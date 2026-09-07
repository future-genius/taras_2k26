import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_EVENTS } from '../../data/events';
import { CertificatePreview } from '../../components/certificates/CertificatePreview';
import { CertificateTemplate } from '../../components/certificates/CertificateTemplate';
import {
  issueCertificate,
  issueCertificatesBatch,
  revokeCertificate,
  getAllCertificates,
  downloadCertificatePdf,
  type IssueCertificateParams,
  type BatchIssueProgress,
} from '../../services/certificateService';
import type { CertificateRecord } from '../../types/certificate';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Search,
  Users,
  Eye,
  XCircle,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface ParticipantCertificateRow {
  registrationId: string;
  participantId: string;
  registrationNumber: string;
  uid: string;
  fullName: string;
  email: string;
  college: string;
  eventId: string;
  eventName: string;
  registrationStatus: string;
  paymentStatus: string;
  attendanceStatus: string;
  venueCheckIn: boolean;
  certificateEligible: boolean;
  eligibilityReason: string;
  certificateId?: string;
  certificateStatus: 'GENERATED' | 'PENDING' | 'REVOKED';
  certificateRecord?: CertificateRecord;
  selected?: boolean;
}

export const CertificateManagementPage: React.FC = () => {
  const { user } = useAuth();

  // Event Selection & Search
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'GENERATED' | 'PENDING' | 'REVOKED'>('ALL');

  // Data States
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ParticipantCertificateRow[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);

  // Action States
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Batch Generation State
  const [selectAll, setSelectAll] = useState(false);
  const [isBatchIssuing, setIsBatchIssuing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchIssueProgress | null>(null);

  // Preview Modal State
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);

  // Hidden Offscreen Canvas Refs for Direct Download
  const canvasRefs = useRef<{ [certId: string]: HTMLDivElement | null }>({});

  // ─────────────────────────────────────────────────────────────────────────────
  // Load All Certs & Registrations
  // ─────────────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Fetch all certificates
      const allCerts = await getAllCertificates();
      setCertificates(allCerts);

      // Create lookup map: `${participantId}_${eventId}` -> CertificateRecord
      const certMap = new Map<string, CertificateRecord>();
      allCerts.forEach((c) => {
        const key = `${c.participantId}_${c.eventId}`;
        certMap.set(key, c);
        if (c.uid) {
          certMap.set(`${c.uid}_${c.eventId}`, c);
        }
      });

      // 2. Fetch registrations (optionally filtered by selected event)
      const regsRef = collection(firestore, 'registrations');
      let regSnap;
      if (selectedEventId && selectedEventId !== 'ALL') {
        const q = query(regsRef, where('eventId', '==', selectedEventId));
        regSnap = await getDocs(q);
      } else {
        regSnap = await getDocs(regsRef);
      }

      // 3. Fetch participants for profile details (names, attendance, college)
      const partsSnap = await getDocs(collection(firestore, 'participants'));
      const partProfileMap = new Map<string, any>();
      partsSnap.docs.forEach((d) => {
        partProfileMap.set(d.id, d.data());
      });

      // 4. Build normalized participant certificate rows with strict eligibility
      const participantRows: ParticipantCertificateRow[] = [];

      for (const docSnap of regSnap.docs) {
        const reg = docSnap.data();
        const pId = reg.participantId || docSnap.id;
        const uId = reg.uid || '';
        const evId = reg.eventId || '';
        const profile = partProfileMap.get(uId) || {};

        const fullName = reg.participantName || profile.fullName || reg.teamName || 'Participant';
        const email = profile.email || reg.email || '—';
        const college = profile.college || reg.college || 'SRM Valliammai Engineering College';
        const eventName = reg.eventName || MOCK_EVENTS.find((e) => e.id === evId)?.name || 'Event';

        // Payment status check
        const isPaid =
          reg.paymentStatus === 'VERIFIED' ||
          reg.paymentStatus === 'NOT_REQUIRED' ||
          reg.status === 'CONFIRMED' ||
          reg.calculatedFee === 0;

        // Attendance check
        const attState =
          reg.eventAttendance === 'PRESENT'
            ? 'PRESENT'
            : profile.attendanceStatus?.[evId] === 'PRESENT'
            ? 'PRESENT'
            : reg.eventAttendance || 'NOT_MARKED';

        const hasVenueCheckIn = Boolean(profile.venueCheckIn || reg.venueCheckIn === true);

        // Strict Eligibility Lifecycle:
        // Registration -> Payment Verified -> Attendance Verified
        let isEligible = false;
        let eligibilityReason = '';

        if (!isPaid) {
          eligibilityReason = 'Payment not verified';
        } else if (attState !== 'PRESENT' && !hasVenueCheckIn && reg.certificateEligible !== true) {
          eligibilityReason = 'Attendance not marked';
        } else {
          isEligible = true;
          eligibilityReason = 'Eligible (Payment & Attendance Verified)';
        }

        // Check for existing certificate
        const existingCert = certMap.get(`${pId}_${evId}`) || certMap.get(`${uId}_${evId}`);
        let certStatus: 'GENERATED' | 'PENDING' | 'REVOKED' = 'PENDING';

        if (existingCert) {
          const s = String(existingCert.certificateStatus || existingCert.status).toUpperCase();
          certStatus = s === 'REVOKED' ? 'REVOKED' : 'GENERATED';
        }

        participantRows.push({
          registrationId: docSnap.id,
          participantId: pId,
          registrationNumber: reg.registrationNumber || pId,
          uid: uId,
          fullName,
          email,
          college,
          eventId: evId,
          eventName,
          registrationStatus: reg.status || 'PENDING',
          paymentStatus: reg.paymentStatus || 'PENDING',
          attendanceStatus: attState,
          venueCheckIn: hasVenueCheckIn,
          certificateEligible: isEligible,
          eligibilityReason,
          certificateId: existingCert?.certificateId,
          certificateStatus: certStatus,
          certificateRecord: existingCert,
          selected: false,
        });
      }

      setRows(participantRows);
      setSelectAll(false);
    } catch (err: any) {
      console.error('Failed to load certificate dashboard data:', err);
      setStatusMessage({
        type: 'error',
        msg: `Failed to load data: ${err.message || 'Network error'}`,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Overview Calculations
  // ─────────────────────────────────────────────────────────────────────────────

  const totalEligible = rows.filter((r) => r.certificateEligible).length;
  const totalGenerated = rows.filter((r) => r.certificateStatus === 'GENERATED').length;
  const totalPending = rows.filter((r) => r.certificateEligible && r.certificateStatus === 'PENDING').length;
  const totalRevoked = rows.filter((r) => r.certificateStatus === 'REVOKED').length;

  // ─────────────────────────────────────────────────────────────────────────────
  // Filtering & Search
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredRows = rows.filter((r) => {
    // Status filter
    if (statusFilter === 'ELIGIBLE' && !r.certificateEligible) return false;
    if (statusFilter === 'GENERATED' && r.certificateStatus !== 'GENERATED') return false;
    if (statusFilter === 'PENDING' && r.certificateStatus !== 'PENDING') return false;
    if (statusFilter === 'REVOKED' && r.certificateStatus !== 'REVOKED') return false;

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.fullName.toLowerCase().includes(q);
      const matchId = r.participantId.toLowerCase().includes(q);
      const matchCertId = r.certificateId?.toLowerCase().includes(q);
      const matchEmail = r.email.toLowerCase().includes(q);
      const matchEvent = r.eventName.toLowerCase().includes(q);
      return matchName || matchId || matchCertId || matchEmail || matchEvent;
    }

    return true;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Actions: Generate Single Certificate
  // ─────────────────────────────────────────────────────────────────────────────

  const handleGenerateCertificate = async (row: ParticipantCertificateRow) => {
    if (!user) return;
    if (!row.certificateEligible) {
      alert(`Cannot generate certificate: ${row.eligibilityReason}`);
      return;
    }

    setProcessingId(row.registrationId);
    setStatusMessage(null);

    try {
      const params: IssueCertificateParams = {
        participantId: row.participantId,
        registrationId: row.registrationId,
        registrationNumber: row.registrationNumber,
        uid: row.uid,
        email: row.email,
        eventId: row.eventId,
        eventName: row.eventName,
        participantName: row.fullName,
        college: row.college,
        certificateType: 'Participation Certificate',
        issuedByUid: user.uid,
        certificateEligible: true,
      };

      const result = await issueCertificate(params);

      setStatusMessage({
        type: 'success',
        msg: result.isExisting
          ? `Certificate already exists: ${result.certificateId}`
          : `Certificate successfully issued: ${result.certificateId}`,
      });

      // Reload dashboard data
      await loadData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        msg: err.message || 'Failed to issue certificate.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Actions: Revoke Certificate
  // ─────────────────────────────────────────────────────────────────────────────

  const handleRevoke = async (certId: string, participantName: string) => {
    if (!user) return;
    const confirmRevoke = window.confirm(
      `Are you sure you want to officially REVOKE certificate ${certId} for "${participantName}"?\n\nOnce revoked, the verification page will display "CERTIFICATE REVOKED".`
    );
    if (!confirmRevoke) return;

    setProcessingId(certId);
    try {
      const res = await revokeCertificate(certId, user.uid, 'Administrative Revocation by Admin');
      if (res.success) {
        setStatusMessage({
          type: 'info',
          msg: `Certificate ${certId} has been officially revoked.`,
        });
        await loadData();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || 'Revocation failed.');
    } finally {
      setProcessingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Actions: Download PDF directly
  // ─────────────────────────────────────────────────────────────────────────────

  const handleDownloadPdf = async (row: ParticipantCertificateRow) => {
    if (!row.certificateRecord) return;
    const certId = row.certificateRecord.certificateId;
    const targetElement = canvasRefs.current[certId];

    if (!targetElement) {
      alert('Certificate canvas is preparing. Please open View to preview and download.');
      return;
    }

    setProcessingId(certId);
    try {
      await downloadCertificatePdf(targetElement, certId, row.fullName, user?.uid);
    } catch (err: any) {
      alert(err.message || 'Failed to generate PDF download.');
    } finally {
      setProcessingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Actions: Copy Verification Link
  // ─────────────────────────────────────────────────────────────────────────────

  const handleCopyLink = (certId: string) => {
    const url = `https://taras-2k26.web.app/verify/${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Batch Selection & Execution
  // ─────────────────────────────────────────────────────────────────────────────

  const handleToggleSelectAll = () => {
    const nextState = !selectAll;
    setSelectAll(nextState);
    setRows((prev) =>
      prev.map((r) =>
        r.certificateEligible && r.certificateStatus === 'PENDING'
          ? { ...r, selected: nextState }
          : r
      )
    );
  };

  const handleToggleRow = (regId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.registrationId === regId ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleBatchIssue = async () => {
    if (!user) return;
    const selected = rows.filter((r) => r.selected && r.certificateEligible && r.certificateStatus === 'PENDING');
    if (selected.length === 0) {
      alert('Please select at least one pending eligible participant.');
      return;
    }

    const confirmBatch = window.confirm(
      `Issue certificates for ${selected.length} selected participant(s)?`
    );
    if (!confirmBatch) return;

    setIsBatchIssuing(true);
    setStatusMessage(null);
    setBatchProgress(null);

    const payloads: IssueCertificateParams[] = selected.map((r) => ({
      participantId: r.participantId,
      registrationId: r.registrationId,
      registrationNumber: r.registrationNumber,
      uid: r.uid,
      email: r.email,
      eventId: r.eventId,
      eventName: r.eventName,
      participantName: r.fullName,
      college: r.college,
      certificateType: 'Participation Certificate',
      issuedByUid: user.uid,
      certificateEligible: true,
    }));

    try {
      const result = await issueCertificatesBatch(payloads, (prog) => {
        setBatchProgress(prog);
      });

      setStatusMessage({
        type: 'success',
        msg: `Batch Issuance Complete: ${result.issued} issued, ${result.skipped} skipped, ${result.failed} failed.`,
      });

      await loadData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        msg: err.message || 'Batch issuance failed.',
      });
    } finally {
      setIsBatchIssuing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <AdminNav />

      <VisualAtmosphere
        environmentKey="proceedings"
        badgeText="TARAS 2K26 CERTIFICATE AUTHORITY"
        title="DYNAMIC E-CERTIFICATE CONSOLE"
        subtitle="Manage end-to-end e-certificate generation, lifecycle, cryptographic QR verification, and revocations."
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono ${
              statusMessage.type === 'success'
                ? 'bg-green-950/60 border border-green-500/50 text-green-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/60 border border-red-500/50 text-red-300'
                : 'bg-blue-950/60 border border-blue-500/50 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
              )}
              <span>{statusMessage.msg}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-base font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* ── SECTION 11: CERTIFICATE OVERVIEW CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Total Eligible
              </span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{totalEligible}</div>
            <div className="text-[10px] font-mono text-slate-500">Paid &amp; Attendance confirmed</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-green-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-green-400 uppercase tracking-wider">
                Certificates Generated
              </span>
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-3xl font-black text-green-400 font-mono">{totalGenerated}</div>
            <div className="text-[10px] font-mono text-slate-500">Active authentic credentials</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                Certificates Pending
              </span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400 font-mono">{totalPending}</div>
            <div className="text-[10px] font-mono text-slate-500">Eligible but not yet generated</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-red-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">
                Certificates Revoked
              </span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-black text-red-400 font-mono">{totalRevoked}</div>
            <div className="text-[10px] font-mono text-slate-500">Officially invalidated</div>
          </div>
        </div>

        {/* ── SECTION 2 & 11: EVENT SELECTOR & CONTROLS ── */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <span className="text-[10px] font-mono text-[#b91c1c] uppercase tracking-widest font-bold">
                GENERATION WORKFLOW
              </span>
              <h3 className="text-xl font-black text-white font-mono">
                PARTICIPANT CERTIFICATE DIRECTORY
              </h3>
            </div>

            {/* Event Dropdown Selector */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-xs font-mono text-slate-400 whitespace-nowrap">
                Select Event:
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full md:w-72 bg-[#141820] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#b91c1c]"
              >
                <option value="ALL">All Events ({rows.length} records)</option>
                {MOCK_EVENTS.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.category})
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData()}
                disabled={loading}
                icon={<RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Search, Filter & Batch Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by participant name, registration number, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#050608] border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#b91c1c]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'ELIGIBLE', 'GENERATED', 'PENDING', 'REVOKED'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setStatusFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-colors whitespace-nowrap ${
                    statusFilter === filterKey
                      ? 'bg-[#b91c1c] text-white'
                      : 'bg-[#141820] text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {filterKey}
                </button>
              ))}

              {/* Batch Action Button */}
              {rows.some((r) => r.selected) && (
                <Button
                  variant="glow"
                  size="sm"
                  onClick={handleBatchIssue}
                  disabled={isBatchIssuing}
                  className="whitespace-nowrap font-mono text-xs font-bold"
                >
                  {isBatchIssuing ? 'Issuing Batch…' : `Generate (${rows.filter((r) => r.selected).length})`}
                </Button>
              )}
            </div>
          </div>

          {/* Batch Progress Bar */}
          {batchProgress && (
            <div className="p-4 rounded-xl bg-[#0a0c10] border border-white/10 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Batch Issuance Progress:</span>
                <span>
                  {batchProgress.issued + batchProgress.skipped + batchProgress.failed} / {batchProgress.total}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#b91c1c] transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      ((batchProgress.issued + batchProgress.skipped + batchProgress.failed) / batchProgress.total) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* ── SECTION 11: PARTICIPANT CERTIFICATE TABLE ── */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <LoadingSpinner label="Loading certificate records…" />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="py-16 text-center space-y-3 font-mono">
                <Award className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-white font-bold text-sm">NO PARTICIPANTS FOUND</div>
                <div className="text-xs text-slate-500">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'No matching participants for the current search/filter.'
                    : 'No event registrations found for this selection.'}
                </div>
              </div>
            ) : (
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#0e1218] border-b border-white/10 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-700 text-[#b91c1c] focus:ring-0"
                      />
                    </th>
                    <th className="p-3">Participant</th>
                    <th className="p-3">Registration No.</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Eligibility</th>
                    <th className="p-3">Certificate Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#050608]">
                  {filteredRows.map((row) => {
                    const isProcessing = processingId === row.registrationId || processingId === row.certificateId;
                    const certRecord = row.certificateRecord;

                    return (
                      <tr key={row.registrationId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={row.selected || false}
                            disabled={!row.certificateEligible || row.certificateStatus !== 'PENDING'}
                            onChange={() => handleToggleRow(row.registrationId)}
                            className="rounded border-slate-700 text-[#b91c1c] focus:ring-0 disabled:opacity-30"
                          />
                        </td>

                        {/* Participant Column */}
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">{row.fullName}</div>
                          <div className="text-[10px] text-slate-400">{row.email}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{row.college}</div>
                        </td>

                        {/* Registration Number */}
                        <td className="p-3">
                          <span className="font-bold text-[#b91c1c] tracking-wider">
                            {row.registrationNumber}
                          </span>
                        </td>

                        {/* Event Name */}
                        <td className="p-3">
                          <span className="text-slate-200 font-semibold">{row.eventName}</span>
                        </td>

                        {/* Eligibility Status */}
                        <td className="p-3">
                          <div className="space-y-1">
                            {row.certificateEligible ? (
                              <Badge variant="green" size="sm">
                                <Check className="w-3 h-3 mr-1" /> ELIGIBLE
                              </Badge>
                            ) : (
                              <Badge variant="amber" size="sm">
                                INELIGIBLE
                              </Badge>
                            )}
                            <div className="text-[9px] text-slate-500 truncate max-w-[170px]">
                              {row.eligibilityReason}
                            </div>
                          </div>
                        </td>

                        {/* Certificate Status */}
                        <td className="p-3">
                          <div className="space-y-1">
                            {row.certificateStatus === 'GENERATED' ? (
                              <Badge variant="green" size="sm">
                                GENERATED ✓
                              </Badge>
                            ) : row.certificateStatus === 'REVOKED' ? (
                              <Badge variant="red" size="sm">
                                REVOKED
                              </Badge>
                            ) : (
                              <Badge variant="outline" size="sm">
                                PENDING
                              </Badge>
                            )}

                            {row.certificateId && (
                              <div className="text-[9px] text-slate-400 font-mono tracking-tight">
                                {row.certificateId}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Generate Action */}
                            {row.certificateStatus === 'PENDING' && (
                              <Button
                                variant="glow"
                                size="sm"
                                disabled={!row.certificateEligible || isProcessing}
                                onClick={() => handleGenerateCertificate(row)}
                                className="text-[10px] py-1 px-2.5 font-bold font-mono"
                              >
                                {isProcessing ? 'Issuing…' : 'Generate'}
                              </Button>
                            )}

                            {/* View Action */}
                            {certRecord && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewCert(certRecord)}
                                className="text-[10px] py-1 px-2 text-slate-300 hover:text-white"
                                title="View Certificate Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Download Action */}
                            {certRecord && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPdf(row)}
                                disabled={isProcessing}
                                className="text-[10px] py-1 px-2 text-slate-300 hover:text-white"
                                title="Download Official PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Copy Verification Link Action */}
                            {row.certificateId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyLink(row.certificateId!)}
                                className="text-[10px] py-1 px-2 text-slate-300 hover:text-white"
                                title="Copy Public Verification Link"
                              >
                                {copiedId === row.certificateId ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}

                            {/* Revoke Action */}
                            {certRecord && row.certificateStatus === 'GENERATED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevoke(certRecord.certificateId, row.fullName)}
                                disabled={isProcessing}
                                className="text-[10px] py-1 px-2 border-red-500/30 text-red-400 hover:bg-red-950/40"
                                title="Revoke Certificate"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>

                          {/* Hidden Offscreen Canvas Element for Instant Local High-Res Download */}
                          {certRecord && (
                            <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
                              <CertificateTemplate
                                ref={(el) => {
                                  canvasRefs.current[certRecord.certificateId] = el;
                                }}
                                certificate={certRecord}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Full Certificate Preview Modal */}
      {previewCert && (
        <CertificatePreview certificate={previewCert} onClose={() => setPreviewCert(null)} />
      )}
    </div>
  );
};
