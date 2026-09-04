import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import {
  issueCertificate,
  getCertificateById,
  checkCertificateExists,
} from '../../services/certificateService';
import type { CertificateRecord } from '../../types/certificate';
import { CertificateTemplate } from '../../components/certificates/CertificateTemplate';
import { CertificateDownloadButton } from '../../components/certificates/CertificateDownloadButton';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Award,
  CheckCircle2,
  FileCheck,
  Download,
  Eye,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Calendar,
  XCircle,
  Sparkles,
} from 'lucide-react';

export const CertificateDemoPage: React.FC = () => {
  const { user } = useAuth();

  const [demoParticipant, setDemoParticipant] = useState<Record<string, any> | null>(null);
  const [issuedCertificate, setIssuedCertificate] = useState<CertificateRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const certTemplateRef = useRef<HTMLDivElement>(null);

  const DEMO_PARTICIPANT_ID = 'TARAS-DEMO-001';
  const DEMO_EVENT_ID = 'TR-DEMO';
  const DEMO_EVENT_NAME = 'Demo Event';

  const loadDemoData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      // 1. Fetch Demo Participant
      const byId = await db.queryWhere('participants', 'participantId', DEMO_PARTICIPANT_ID);
      let participant = byId[0] as Record<string, any> | undefined;

      if (!participant) {
        // Search by isDemo
        const byDemo = await db.queryWhere('participants', 'isDemo', true);
        participant = byDemo[0] as Record<string, any> | undefined;
      }

      if (participant) {
        setDemoParticipant(participant);

        // 2. Check if certificate is already issued
        const existingCert = await checkCertificateExists(
          participant.participantId,
          DEMO_EVENT_ID,
          'Certificate of Participation'
        );

        if (existingCert) {
          setIssuedCertificate(existingCert);
        } else {
          setIssuedCertificate(null);
        }
      } else {
        setDemoParticipant(null);
        setIssuedCertificate(null);
      }
    } catch (err: any) {
      console.error('Error loading demo data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDemoData();
  }, []);

  const handleIssueCertificate = async () => {
    if (!demoParticipant || !user) return;

    setIsIssuing(true);
    setStatusMessage(null);

    try {
      const res = await issueCertificate({
        participantId: demoParticipant.participantId,
        uid: demoParticipant.uid,
        eventId: DEMO_EVENT_ID,
        eventName: DEMO_EVENT_NAME,
        participantName: demoParticipant.fullName,
        college: demoParticipant.college || 'Saveetha Engineering College',
        certificateType: 'Certificate of Participation',
        achievement: 'Exemplary Technical Presentation & Symposium Participation',
        position: null,
        issuedByUid: user.uid,
        certificateEligible: true,
      });

      if (res.success && res.certificateId) {
        // Tag record with isDemo: true for clean isolation
        try {
          await db.updateDoc('certificate_records', res.certificateId, {
            isDemo: true,
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // Non-critical
        }

        const freshRecord = await getCertificateById(res.certificateId);
        setIssuedCertificate(freshRecord);
        setStatusMessage({
          type: 'success',
          text: `Demo Certificate successfully issued! Official ID: ${res.certificateId}`,
        });
        loadDemoData();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Issuance could not be completed.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to issue demo certificate.',
      });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    setStatusMessage(null);

    try {
      const now = new Date().toISOString();

      // 1. Reset Demo Participant Record
      if (demoParticipant && demoParticipant.uid) {
        await db.updateDoc('participants', demoParticipant.uid, {
          venueCheckIn: false,
          venueCheckInStatus: 'NOT_CHECKED_IN',
          venueCheckInTimestamp: null,
          certificateStatus: 'PENDING',
          updatedAt: now,
        });
      }

      // 2. Delete or Revoke Demo Certificate Records ONLY
      const demoCerts = await db.queryWhere('certificate_records', 'participantId', DEMO_PARTICIPANT_ID);
      for (const cert of demoCerts) {
        const certId = (cert as any).certificateId || (cert as any).certId || (cert as any).id;
        if (certId) {
          try {
            await db.deleteDoc('certificate_records', certId);
          } catch {
            // If delete rule restricts, mark revoked
            await db.updateDoc('certificate_records', certId, {
              status: 'revoked',
              revokedAt: now,
              updatedAt: now,
            });
          }
        }
      }

      setIssuedCertificate(null);
      setIsResetModalOpen(false);
      setStatusMessage({
        type: 'info',
        text: 'Demo participant state reset and demo certificate records cleared.',
      });
      loadDemoData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to reset demo data.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-10 pb-24">
      {/* Offscreen Template Mount for HTML2Canvas & PDF Generation */}
      {issuedCertificate && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <CertificateTemplate ref={certTemplateRef} certificate={issuedCertificate} />
        </div>
      )}

      {/* Visual Atmosphere Header */}
      <VisualAtmosphere
        environmentKey="proceedings"
        badgeText="ADMIN OPERATIONS // SYMPOSIUM CREDENTIAL DEMO"
        title="CERTIFICATE DEMO CONSOLE"
        subtitle="Live symposium demonstration portal for real cryptographic certificate issuance, on-demand PDF generation, and public verification."
        height="compact"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Status banner */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 font-mono text-xs animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-green-950/40 border-green-500/80 text-green-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/40 border-red-500/80 text-red-300'
                : 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            ) : (
              <Sparkles className="w-5 h-5 shrink-0 text-cyan-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Demo Participant & Certificate Console Card */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-[#b91c1c]/50 space-y-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1a0000] border-2 border-[#b91c1c] text-[#b91c1c] flex items-center justify-center shadow-lg shadow-[#b91c1c]/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white font-mono uppercase">
                    DEMO PARTICIPANT RECORD
                  </h2>
                  <Badge variant="red">ISOLATED DEMO</Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Live Firestore Record: <strong className="text-white">TARAS-DEMO-001</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDemoData}
                disabled={isLoading}
                className="font-mono text-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetModalOpen(true)}
                className="font-mono text-xs text-slate-400 hover:text-red-400 hover:border-red-500"
              >
                Reset Demo Data
              </Button>
            </div>
          </div>

          {/* Participant Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase text-[10px]">Participant Name:</span>
              <span className="text-base font-black text-white block">
                {demoParticipant?.fullName || 'TARAS Demo Participant'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase text-[10px]">Registration ID:</span>
              <span className="text-base font-black text-[#b91c1c] block">
                {demoParticipant?.participantId || 'TARAS-DEMO-001'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase text-[10px]">Event Track:</span>
              <span className="text-base font-bold text-amber-400 block">
                {DEMO_EVENT_NAME}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase text-[10px]">Department &amp; Year:</span>
              <span className="text-slate-200 font-bold block">
                Electronics &amp; Communication &bull; IV Year (Demo)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase text-[10px]">Eligibility Status:</span>
              <div className="flex items-center gap-1.5 text-green-400 font-bold mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>ELIGIBLE FOR ISSUANCE ✓</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase text-[10px]">Certificate Status:</span>
              <div className="mt-1">
                {issuedCertificate ? (
                  <Badge variant="green">ISSUED &bull; {issuedCertificate.certificateId || issuedCertificate.certId}</Badge>
                ) : (
                  <Badge variant="outline">NOT ISSUED YET</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Issuance & Actions Arena */}
          <div className="pt-4 border-t border-white/10 space-y-6">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#b91c1c]" />
              SYMPOSIUM DEMO ACTIONS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Action 1: Issue Certificate */}
              {!issuedCertificate ? (
                <Button
                  variant="glow"
                  size="lg"
                  onClick={handleIssueCertificate}
                  disabled={isIssuing || !demoParticipant}
                  className="w-full justify-center font-mono py-4 text-xs font-bold"
                >
                  <Award className="w-4 h-4 mr-2" />
                  {isIssuing ? 'Generating Cryptographic ID…' : 'Issue Demo Certificate'}
                </Button>
              ) : (
                <div className="p-4 rounded-2xl bg-green-950/40 border border-green-500/50 text-green-400 font-mono text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold block">Status</span>
                  <span className="text-xs font-bold block">CERTIFICATE ISSUED ✓</span>
                </div>
              )}

              {/* Action 2: Preview Certificate */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsPreviewModalOpen(true)}
                disabled={!issuedCertificate}
                className="w-full justify-center font-mono py-4 text-xs"
              >
                <Eye className="w-4 h-4 mr-2" /> Preview Certificate
              </Button>

              {/* Action 3: Download Real PDF */}
              {issuedCertificate ? (
                <CertificateDownloadButton
                  targetRef={certTemplateRef}
                  certificateId={issuedCertificate.certificateId || issuedCertificate.certId || 'DEMO-CERT'}
                  variant="glow"
                  size="lg"
                  className="w-full justify-center font-mono py-4 text-xs font-bold"
                />
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  disabled
                  className="w-full justify-center font-mono py-4 text-xs opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
              )}

              {/* Action 4: Verify Public Certificate */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (issuedCertificate) {
                    const id = issuedCertificate.certificateId || issuedCertificate.certId;
                    window.open(`/verify-certificate?id=${id}`, '_blank');
                  }
                }}
                disabled={!issuedCertificate}
                className="w-full justify-center font-mono py-4 text-xs text-cyan-300 hover:border-cyan-400"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Verify Certificate
              </Button>
            </div>

            {/* Test Tamper / Invalid ID Verification Action */}
            <div className="p-5 rounded-2xl bg-[#06080c] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div>
                <span className="text-slate-300 font-bold block">Demonstrate Tamper-Proof Rejection:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Test public verifier response for an invalid / fabricated Certificate ID (<code>INVALID-DEMO-ID</code>).
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/verify-certificate?id=INVALID-DEMO-ID', '_blank')}
                className="font-mono text-xs text-red-400 hover:border-red-500 shrink-0"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Test Invalid Certificate
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {isPreviewModalOpen && issuedCertificate && (
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title="TARAS 2K26 — OFFICIAL CERTIFICATE PREVIEW"
        >
          <div className="space-y-6 flex flex-col items-center">
            {/* Certificate Template Container scaled for viewing */}
            <div className="w-full overflow-x-auto p-4 bg-black/60 rounded-2xl border border-slate-800 flex justify-center">
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                <CertificateTemplate certificate={issuedCertificate} />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <CertificateDownloadButton
                targetRef={certTemplateRef}
                certificateId={issuedCertificate.certificateId || issuedCertificate.certId || 'DEMO-CERT'}
                variant="glow"
                size="md"
              />
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsPreviewModalOpen(false)}
                className="font-mono text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Safe Reset Confirmation Modal */}
      {isResetModalOpen && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title="RESET TARAS DEMO DATA?"
        >
          <div className="space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-950/60 border-2 border-red-500 flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <p className="text-white font-bold text-sm uppercase">
                Reset Demo Participant &amp; Demo Certificates
              </p>
              <p className="text-slate-400 leading-relaxed">
                This will reset <strong>TARAS-DEMO-001</strong> venue check-in and remove issued demo certificates. All real participant and symposium records will remain completely untouched.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="glow"
                size="md"
                onClick={handleResetDemoData}
                disabled={isResetting}
                className="font-mono text-xs font-bold"
              >
                {isResetting ? 'Resetting…' : 'Confirm Reset Demo'}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsResetModalOpen(false)}
                className="font-mono text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
