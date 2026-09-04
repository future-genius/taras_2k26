import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCertificateById } from '../services/certificateService';
import type { CertificateRecord } from '../types/certificate';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
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
} from 'lucide-react';

export const CertificateVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [certInput, setCertInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [certRecord, setCertRecord] = useState<CertificateRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [verificationState, setVerificationState] = useState<'VALID' | 'REVOKED' | 'INVALID' | null>(null);

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

  // Auto-verify if ID is in URL query parameters
  useEffect(() => {
    const idParam = searchParams.get('id') || searchParams.get('code');
    if (idParam) {
      setCertInput(idParam);
      performLookup(idParam);
    }
  }, [searchParams]);

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
              Enter the unique Certificate ID (e.g. TARAS26-CERT-7F4A92C81D) printed on the credential or QR code.
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
                  placeholder="e.g. TARAS26-CERT-7F4A92C81D"
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
                  <span>✓ VERIFIED CERTIFICATE</span>
                </div>
                <div className="flex items-center gap-2">
                  {Boolean((certRecord as any).isDemo || certRecord.participantId === 'TARAS-DEMO-001') && (
                    <Badge variant="red">DEMO CERTIFICATE &bull; YES</Badge>
                  )}
                  <Badge variant="green">GENUINE OFFICIAL RECORD</Badge>
                </div>
              </div>

              <div className="space-y-5 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] tracking-wider">Recipient Name:</span>
                  <span className="text-xl font-black text-white">{certRecord.participantName || certRecord.fullName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] tracking-wider">Institution / College:</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-[#b91c1c]" /> {certRecord.college || 'Saveetha Engineering College'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] tracking-wider">Certificate Type:</span>
                    <span className="text-[#b91c1c] font-black text-sm">{certRecord.certificateType}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] tracking-wider">Event Track:</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1 mt-0.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> {certRecord.eventName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] tracking-wider">Date of Issue:</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />{' '}
                      {new Date(certRecord.issuedAt || certRecord.issueDate || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {Boolean((certRecord as any).isDemo || certRecord.participantId === 'TARAS-DEMO-001') && (
                  <div className="p-3 rounded-xl bg-[#1a0000]/70 border border-[#b91c1c]/60 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                    <span className="text-white font-bold">DEMO / SAMPLE CREDENTIAL:</span>
                    <span className="text-[#b91c1c] font-bold">YES &bull; ISOLATED TEST RECORD</span>
                  </div>
                )}

                {certRecord.achievement && (
                  <div className="p-3 rounded-xl bg-[#0a0c10] border border-amber-500/30 font-mono">
                    <span className="text-[10px] text-slate-400 uppercase block">Achievement Recognized:</span>
                    <span className="text-amber-400 font-bold text-sm">{certRecord.achievement}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                  <span>Certificate ID: <strong className="text-slate-300 font-mono">{certRecord.certificateId || certRecord.certId}</strong></span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> SRM VALLIAMMAI ECE DEPARTMENT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* RESULT 2: REVOKED CERTIFICATE */}
          {searched && verificationState === 'REVOKED' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#1a0000] border-2 border-red-600 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-red-500 font-mono font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>⚠ CERTIFICATE REVOKED</span>
              </div>
              <p className="text-xs text-slate-200 font-mono leading-relaxed">
                This certificate record has been <strong className="text-red-400 uppercase">OFFICIALLY REVOKED</strong> by TARAS 2K26 administration. It is no longer valid for any official reference or proof of achievement.
              </p>
              {certRecord && (
                <div className="p-3 rounded-xl bg-black/50 border border-red-900/50 text-[11px] font-mono text-slate-400">
                  <div>Certificate ID: <span className="text-red-400 font-bold">{certRecord.certificateId || certRecord.certId}</span></div>
                  <div>Recipient: <span className="text-white">{certRecord.participantName || certRecord.fullName}</span></div>
                </div>
              )}
            </div>
          )}

          {/* RESULT 3: INVALID CERTIFICATE */}
          {searched && verificationState === 'INVALID' && (
            <div className="p-6 rounded-3xl bg-[#1a0000] border-2 border-[#b91c1c] space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#b91c1c] font-mono font-bold text-sm">
                <XCircle className="w-5 h-5 shrink-0 text-[#b91c1c]" />
                <span>✕ INVALID CERTIFICATE</span>
              </div>
              <p className="text-xs text-white font-mono leading-relaxed">
                The Certificate ID or code entered was not found in the official TARAS 2K26 registry. Please verify the code printed on the physical credential or scan the original QR code.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
