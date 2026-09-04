import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_EVENTS } from '../../data/events';
import { CertificatePreview } from '../../components/certificates/CertificatePreview';
import {
  issueCertificatesBatch,
  revokeCertificate,
  getAllCertificates,
  type IssueCertificateParams,
  type BatchIssueProgress,
} from '../../services/certificateService';
import type { CertificateRecord, CertificateType } from '../../types/certificate';
import {
  Award,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Search,
  Zap,
  Users,
  Eye,
  XCircle,
  CheckSquare,
  Square,
  ShieldAlert,
} from 'lucide-react';

interface EligibleParticipantItem {
  uid: string;
  participantId: string;
  fullName: string;
  college: string;
  email: string;
  eventId: string;
  selected: boolean;
  achievement?: string;
  position?: number;
  alreadyIssued?: boolean;
}

export const CertificateManagementPage: React.FC = () => {
  const { user } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'issue' | 'registry'>('issue');

  // Issue Workflow State
  const [selectedEventId, setSelectedEventId] = useState(MOCK_EVENTS[0]?.id || '');
  const [selectedType, setSelectedType] = useState<CertificateType>('Participation Certificate');
  const [customAchievement, setCustomAchievement] = useState('');
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participants, setParticipants] = useState<EligibleParticipantItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Batch Progress & Feedback
  const [isIssuing, setIsIssuing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchIssueProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Registry & Filtering
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loadingRegistry, setLoadingRegistry] = useState(true);

  // Certificate Preview Modal
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);

  // Fetch Eligible Participants for Selected Event
  const loadEligibleParticipants = useCallback(async () => {
    setLoadingParticipants(true);
    setStatusMessage(null);
    try {
      // 1. Fetch registrations for event
      const regs = await db.queryWhere('registrations', 'eventId', selectedEventId);
      const existingCerts = await getAllCertificates();

      const items: EligibleParticipantItem[] = [];

      for (const reg of regs) {
        const targetUid = (reg.uid as string) || '';
        const pId = (reg.participantId as string) || 'TARAS26-ID';

        // Check if participant already has this certificate type issued for event
        const alreadyIssued = existingCerts.some(
          (c) =>
            c.eventId === selectedEventId &&
            c.participantId === pId &&
            c.certificateType === selectedType &&
            (c.status === 'issued' || c.status === 'ISSUED')
        );

        items.push({
          uid: targetUid,
          participantId: pId,
          fullName: (reg.fullName as string) || 'Participant Name',
          college: (reg.college as string) || 'Saveetha Engineering College',
          email: (reg.email as string) || '',
          eventId: selectedEventId,
          selected: !alreadyIssued,
          alreadyIssued,
        });
      }

      setParticipants(items);
      setSelectAll(items.some((i) => i.selected));
    } catch (err) {
      console.warn('Error fetching eligible participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  }, [selectedEventId, selectedType]);

  useEffect(() => {
    loadEligibleParticipants();
  }, [loadEligibleParticipants]);

  // Fetch All Certificates for Registry
  const fetchRegistry = async () => {
    setLoadingRegistry(true);
    try {
      const list = await getAllCertificates();
      setCertificates(list);
    } catch (err) {
      console.warn('Error loading certificate registry:', err);
    } finally {
      setLoadingRegistry(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  // Select / Deselect All
  const handleToggleSelectAll = () => {
    const nextState = !selectAll;
    setSelectAll(nextState);
    setParticipants((prev) =>
      prev.map((p) => (p.alreadyIssued ? p : { ...p, selected: nextState }))
    );
  };

  // Toggle Single Participant
  const handleToggleSelect = (pId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.participantId === pId ? { ...p, selected: !p.selected } : p))
    );
  };

  // Issue Certificates Batch
  const handleIssueCertificates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const selectedItems = participants.filter((p) => p.selected && !p.alreadyIssued);
    if (selectedItems.length === 0) {
      setStatusMessage({ type: 'error', msg: 'Please select at least one eligible participant to issue certificates.' });
      return;
    }

    const eventObj = MOCK_EVENTS.find((e) => e.id === selectedEventId);
    const eventName = eventObj?.name || 'TARAS 2K26 Technical Event';

    setIsIssuing(true);
    setStatusMessage(null);
    setBatchProgress(null);

    const issuePayloads: IssueCertificateParams[] = selectedItems.map((p) => ({
      participantId: p.participantId,
      uid: p.uid,
      eventId: selectedEventId,
      eventName,
      participantName: p.fullName,
      college: p.college,
      certificateType: selectedType,
      achievement: customAchievement.trim() || undefined,
      issuedByUid: user.uid,
    }));

    try {
      const result = await issueCertificatesBatch(issuePayloads, (prog) => {
        setBatchProgress(prog);
      });

      setStatusMessage({
        type: 'success',
        msg: `Batch Issuance Complete! Issued: ${result.issued}, Skipped (Already Exists): ${result.skipped}, Failed: ${result.failed}.`,
      });

      fetchRegistry();
      loadEligibleParticipants();
    } catch (err: any) {
      setStatusMessage({ type: 'error', msg: err.message || 'Batch certificate issuance failed.' });
    } finally {
      setIsIssuing(false);
    }
  };

  // Revoke Certificate
  const handleRevoke = async (certId: string) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to REVOKE certificate ${certId}? This action will mark the certificate invalid on public verification.`)) {
      return;
    }

    const res = await revokeCertificate(certId, user.uid);
    if (res.success) {
      alert(res.message);
      fetchRegistry();
      loadEligibleParticipants();
    } else {
      alert(`Revocation failed: ${res.message}`);
    }
  };

  // Filter Registry
  const filteredCertificates = certificates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const certIdStr = (c.certificateId || c.certId || '').toLowerCase();
    const nameStr = (c.participantName || c.fullName || '').toLowerCase();
    const eventStr = (c.eventName || '').toLowerCase();

    const matchesQuery = certIdStr.includes(q) || nameStr.includes(q) || eventStr.includes(q);
    const matchesType = typeFilter === 'ALL' || c.certificateType === typeFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'issued' && (c.status === 'issued' || c.status === 'ISSUED')) ||
      (statusFilter === 'revoked' && (c.status === 'revoked' || c.status === 'REVOKED'));

    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-24">
      <VisualAtmosphere
        environmentKey="proceedings"
        badgeText="CLIENT-SIDE E-CERTIFICATE ENGINE"
        title="CERTIFICATE MANAGEMENT CONSOLE"
        subtitle="Issue cryptographically signed e-certificates, manage duplicate prevention, view registry, and handle revocations."
        height="compact"
      />

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Action Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('issue')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'issue'
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Zap className="w-4 h-4 text-[#b91c1c]" /> Issue Event Certificates
            </button>

            <button
              onClick={() => setActiveTab('registry')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'registry'
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Award className="w-4 h-4 text-[#b91c1c]" /> Certificate Registry ({certificates.length})
            </button>
          </div>
        </div>

        {/* TAB 1: ISSUE CERTIFICATES */}
        {activeTab === 'issue' && (
          <div className="space-y-8">
            <form onSubmit={handleIssueCertificates} className="space-y-8">
              {/* Event & Certificate Type Selector Card */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-sm uppercase">
                    <Sparkles className="w-4 h-4 text-[#b91c1c]" /> 1. Select Target Event & Certificate Type
                  </div>
                  <Badge variant="red" size="sm">
                    CLIENT-SIDE METADATA ENGINE
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                      Target Event Track
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#b91c1c]"
                    >
                      {MOCK_EVENTS.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name} ({ev.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                      Certificate Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as CertificateType)}
                      className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#b91c1c]"
                    >
                      <option value="Participation Certificate">Participation Certificate</option>
                      <option value="Winner Certificate">Winner Certificate (#1 Position)</option>
                      <option value="Runner-up Certificate">Runner-up Certificate (#2 Position)</option>
                      <option value="Special Recognition Certificate">Special Recognition Certificate</option>
                      <option value="Workshop Certificate">Workshop Certificate</option>
                      <option value="Volunteer Certificate">Volunteer Certificate</option>
                      <option value="Coordinator Certificate">Coordinator Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">
                      Custom Achievement Citation (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Winner - 1st Rank in Circuit Debugging"
                      value={customAchievement}
                      onChange={(e) => setCustomAchievement(e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl px-3.5 py-3 text-white focus:outline-none focus:border-[#b91c1c]"
                    />
                  </div>
                </div>
              </div>

              {/* Eligible Participants Selector Card */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-6">
                <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-sm uppercase">
                    <Users className="w-4 h-4 text-[#b91c1c]" /> 2. Eligible Registered Participants ({participants.length})
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                    >
                      {selectAll ? <CheckSquare className="w-4 h-4 text-[#b91c1c]" /> : <Square className="w-4 h-4" />}
                      <span>Select All Available</span>
                    </button>
                    <Button variant="outline" size="sm" onClick={loadEligibleParticipants} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                      Refresh
                    </Button>
                  </div>
                </div>

                {loadingParticipants ? (
                  <LoadingSpinner />
                ) : participants.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-mono text-xs">
                    No registered participants found for this event track.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#1a0000] text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3 text-center">Select</th>
                          <th className="px-4 py-3">Participant ID</th>
                          <th className="px-4 py-3">Full Name</th>
                          <th className="px-4 py-3">College</th>
                          <th className="px-4 py-3">Current Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {participants.map((p) => (
                          <tr
                            key={p.participantId}
                            className={`transition-colors ${p.selected ? 'bg-white/5' : 'hover:bg-white/5'}`}
                          >
                            <td className="px-4 py-3.5 text-center">
                              {p.alreadyIssued ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={p.selected}
                                  onChange={() => handleToggleSelect(p.participantId)}
                                  className="w-4 h-4 accent-[#b91c1c] rounded cursor-pointer"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-[#b91c1c]">{p.participantId}</td>
                            <td className="px-4 py-3.5 font-bold text-white">{p.fullName}</td>
                            <td className="px-4 py-3.5 text-slate-400">{p.college}</td>
                            <td className="px-4 py-3.5">
                              {p.alreadyIssued ? (
                                <Badge variant="green" size="sm">CERTIFICATE ISSUED ✓</Badge>
                              ) : (
                                <Badge variant="amber" size="sm">ELIGIBLE FOR ISSUANCE</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Status Message Display */}
                {statusMessage && (
                  <div
                    className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-mono ${
                      statusMessage.type === 'success'
                        ? 'bg-green-950/50 border border-green-500/50 text-green-400'
                        : 'bg-[#1a0000] border border-[#b91c1c] text-[#b91c1c]'
                    }`}
                  >
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{statusMessage.msg}</span>
                  </div>
                )}

                {/* Batch Progress Bar */}
                {batchProgress && (
                  <div className="space-y-2 font-mono text-xs bg-[#0a0c10] p-4 rounded-2xl border border-white/10">
                    <div className="flex justify-between text-white font-bold">
                      <span>Batch Issuance Progress:</span>
                      <span className="text-[#b91c1c]">
                        {batchProgress.issued + batchProgress.skipped + batchProgress.failed} / {batchProgress.total}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-[#b91c1c] transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            ((batchProgress.issued + batchProgress.skipped + batchProgress.failed) /
                              batchProgress.total) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  variant="glow"
                  size="lg"
                  type="submit"
                  disabled={isIssuing || participants.filter((p) => p.selected && !p.alreadyIssued).length === 0}
                  className="w-full justify-center font-mono py-4 text-sm font-bold"
                >
                  {isIssuing
                    ? 'Issuing Certificates…'
                    : `Issue Official ${selectedType} (${participants.filter((p) => p.selected && !p.alreadyIssued).length} Selected)`}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: CERTIFICATE REGISTRY */}
        {activeTab === 'registry' && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/40 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                <Award className="w-4 h-4 text-[#b91c1c]" /> OFFICIAL ISSUED CERTIFICATE REGISTRY
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ID, name, event…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-[#0a0c10] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#b91c1c]"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#b91c1c]"
                >
                  <option value="ALL">All Types</option>
                  <option value="Participation Certificate">Participation</option>
                  <option value="Winner Certificate">Winner</option>
                  <option value="Runner-up Certificate">Runner Up</option>
                  <option value="Special Recognition Certificate">Special Recognition</option>
                  <option value="Workshop Certificate">Workshop</option>
                  <option value="Volunteer Certificate">Volunteer</option>
                  <option value="Coordinator Certificate">Coordinator</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0a0c10] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#b91c1c]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="issued">Valid / Issued</option>
                  <option value="revoked">Revoked</option>
                </select>

                <Button variant="outline" size="sm" onClick={fetchRegistry} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                  Refresh
                </Button>
              </div>
            </div>

            {loadingRegistry ? (
              <LoadingSpinner />
            ) : filteredCertificates.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                No certificate records match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#1a0000] text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3.5">Certificate ID</th>
                      <th className="px-4 py-3.5">Recipient Name</th>
                      <th className="px-4 py-3.5">Event Track</th>
                      <th className="px-4 py-3.5">Type</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Issued Date</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCertificates.map((cert) => {
                      const cId = cert.certificateId || cert.certId || '';
                      const isRev = cert.status === 'revoked' || cert.status === 'REVOKED';

                      return (
                        <tr key={cId} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-bold text-[#b91c1c]">{cId}</td>
                          <td className="px-4 py-4 font-bold text-white">{cert.participantName || cert.fullName}</td>
                          <td className="px-4 py-4 text-slate-300">{cert.eventName}</td>
                          <td className="px-4 py-4">
                            <Badge variant="red" size="sm">{cert.certificateType}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            {isRev ? (
                              <Badge variant="red" size="sm" className="bg-red-950 text-red-400 border-red-800">
                                REVOKED
                              </Badge>
                            ) : (
                              <Badge variant="green" size="sm">VALID</Badge>
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-400">
                            {new Date(cert.issuedAt || cert.issueDate || '').toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewCert(cert)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0a0c10] border border-slate-700 text-slate-300 hover:text-white transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </button>

                            <Link
                              to={`/verify-certificate?id=${cId}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0a0c10] border border-[#b91c1c]/40 text-[#b91c1c] hover:text-white transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Verify
                            </Link>

                            {!isRev && (
                              <button
                                onClick={() => handleRevoke(cId)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-700 text-red-400 hover:bg-red-900 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      {previewCert && (
        <CertificatePreview certificate={previewCert} onClose={() => setPreviewCert(null)} />
      )}
    </div>
  );
};
