import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getCertificateById } from '../services/certificateService';
import type { CertificateRecord } from '../types/certificate';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { CertificatePreview } from '../components/certificates/CertificatePreview';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Award,
  Calendar,
  Building2,
  FileCheck,
  XCircle,
  ShieldCheck,
  Eye,
  Mail,
} from 'lucide-react';

export const CertificateVerificationPage: React.FC = () => {
  const { certificateId: pathCertId } = useParams<{ certificateId?: string }>();
  const [searchParams] = useSearchParams();
  const [certInput, setCertInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [certRecord, setCertRecord] = useState<CertificateRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [verificationState, setVerificationState] = useState<'VALID' | 'REVOKED' | 'INVALID' | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const performLookup = async (idToLookup: string) => {
    const cleanId = idToLookup.trim();
    if (!cleanId) return;

    setIsVerifying(true);
    setCertRecord(null);
    setSearched(true);
    setVerificationState(null);

    try {
      const record = await getCertificateById(cleanId);

      if (record) {
        setCertRecord(record);
        const statusStr = String(record.status).toLowerCase();
        if (statusStr === 'revoked') {
          setVerificationState('REVOKED');
        } else {
          setVerificationState('VALID');
        }
      } else {
        setVerificationState('INVALID');
      }
    } catch {
      setVerificationState('INVALID');
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verify if ID is in path parameter or URL query parameters
  useEffect(() => {
    const idToLookup = pathCertId || searchParams.get('id') || searchParams.get('code');
    if (idToLookup) {
      setCertInput(idToLookup);
      performLookup(idToLookup);
    }
  }, [pathCertId, searchParams]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(certInput);
  };

  return (
    <div className="space-y-10 pb-24">
      {/* Visual Atmosphere Header */}
      <VisualAtmosphere
        environmentKey="proceedings"
        badgeText="OFFICIAL PUBLIC CERTIFICATE REGISTRY"
        title="CERTIFICATE VERIFICATION PORTAL"
        subtitle="Verify authentic symposium achievement credentials issued by TARAS 2K26."
        height="compact"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Verification Form Card */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-[#b91c1c]/40 space-y-6">
          <div className="text-center space-y-2 border-b border-white/10 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1a0000] border-2 border-[#b91c1c] text-[#b91c1c] flex items-center justify-center mx-auto shadow-lg shadow-[#b91c1c]/20">
              <FileCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white font-mono uppercase tracking-tight">
              SYMPOSIUM CREDENTIAL VERIFIER
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Enter the unique Certificate ID (e.g. TARAS26-CERT-7F4A92C8) printed on the credential or scanned from QR code.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                Certificate ID Number / Code
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. TARAS26-CERT-7F4A92C8"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-[#0a0c10] border border-[#b91c1c]/50 rounded-2xl text-sm font-mono text-white focus:outline-none focus:border-[#b91c1c] focus:ring-1 focus:ring-[#b91c1c]"
                />
              </div>
            </div>

            <Button
              variant="glow"
              size="lg"
              type="submit"
              disabled={isVerifying}
              className="w-full justify-center font-mono py-4 text-sm font-bold"
            >
              {isVerifying ? 'Searching Registry…' : 'Verify Certificate Authenticity'}
            </Button>
          </form>

          {/* RESULT 1: VALID CERTIFICATE */}
          {searched && verificationState === 'VALID' && certRecord && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#06080c] border-2 border-green-500/80 space-y-6 animate-fadeIn shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-green-400 font-mono font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>VERIFIED GENUINE CERTIFICATE</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="green">GENUINE OFFICIAL RECORD</Badge>
                </div>
              </div>

              <div className="space-y-5 text-xs font-mono">
                <div className="bg-[#0a0c10] p-4 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wider">Certificate ID</span>
                    <span className="font-bold text-[#b91c1c] text-sm">{certRecord.certificateId}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wider">Participant Name</span>
                    <span className="text-base font-black text-white">{certRecord.participantName}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wider">Institution / College</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#b91c1c]" /> {certRecord.collegeName || certRecord.college || 'SRM Valliammai Engineering College'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wider">Event Name</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> {certRecord.eventName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wider">Certificate Type</span>
                    <span className="text-emerald-400 font-black uppercase">{certRecord.certificateType}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wider">Date of Issue</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {certRecord.issueDate}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    variant="glow"
                    size="md"
                    onClick={() => setShowPreview(true)}
                    icon={<Eye className="w-4 h-4" />}
                    className="w-full sm:w-auto font-mono text-xs justify-center"
                  >
                    View Certificate
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                  <span>Authorized by: <strong className="text-slate-300 font-mono">TARAS 2K26 Academic Council</strong></span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> SRM VALLIAMMAI ECE DEPARTMENT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* RESULT 2: REVOKED CERTIFICATE */}
          {searched && verificationState === 'REVOKED' && certRecord && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#1a0000] border-2 border-red-600 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-red-900/40 pb-3">
                <div className="flex items-center gap-2 text-red-500 font-mono font-bold text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>CERTIFICATE REVOKED</span>
                </div>
                <Badge variant="red">REVOKED</Badge>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-red-900/50 space-y-3 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Certificate ID:</span>
                  <span className="text-red-400 font-bold">{certRecord.certificateId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Recipient:</span>
                  <span className="text-white font-bold">{certRecord.participantName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Event:</span>
                  <span className="text-slate-300">{certRecord.eventName}</span>
                </div>
                {certRecord.revokedReason && (
                  <div className="flex justify-between text-slate-400 border-t border-red-900/30 pt-2">
                    <span>Revocation Reason:</span>
                    <span className="text-amber-400 font-bold">{certRecord.revokedReason}</span>
                  </div>
                )}
                {certRecord.revokedAt && (
                  <div className="flex justify-between text-slate-400">
                    <span>Revoked Timestamp:</span>
                    <span className="text-slate-300">{new Date(certRecord.revokedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700/60 font-mono text-xs text-red-200">
                <strong>Notice:</strong> This credential is no longer valid.
              </div>
            </div>
          )}

          {/* RESULT 3: NOT FOUND / INVALID CERTIFICATE */}
          {searched && verificationState === 'INVALID' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#140000] border-2 border-[#b91c1c] space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-[#b91c1c] font-mono font-bold text-sm">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <span>CERTIFICATE NOT FOUND</span>
                </div>
                <Badge variant="red">RECORD NOT FOUND</Badge>
              </div>

              <p className="text-xs text-white font-mono leading-relaxed">
                No valid TARAS 2K26 certificate found for this ID.
              </p>

              <div className="p-4 rounded-2xl bg-[#0a0c10] border border-white/10 font-mono text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <Mail className="w-4 h-4 text-[#b91c1c]" /> Help & Support:
                </div>
                <p>
                  If you believe this is an error, contact symposium support at{' '}
                  <span className="text-[#b91c1c] font-bold">taras2k26@srmvalliammai.ac.in</span> or verify the ID number entered.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {showPreview && certRecord && (
        <CertificatePreview
          certificate={certRecord}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};
