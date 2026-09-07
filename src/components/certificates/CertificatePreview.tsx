import React, { useRef, useState } from 'react';
import { CertificateTemplate } from './CertificateTemplate';
import { CertificateDownloadButton } from './CertificateDownloadButton';
import type { CertificateRecord } from '../../types/certificate';
import { X, Award, ExternalLink, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CertificatePreviewProps {
  certificate: CertificateRecord;
  onClose: () => void;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ certificate, onClose }) => {
  const certRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const certId = certificate.certificateId || certificate.certId || 'TARAS26-CERT-000000';
  const participantName = certificate.participantName || certificate.fullName || 'Participant';

  const verificationUrl =
    certificate.verificationUrl || `https://taras-2k26.web.app/verify/${certId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0a0c10] border border-[#b91c1c]/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a0000] border border-[#b91c1c] text-[#b91c1c] flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-tight">
                OFFICIAL CERTIFICATE PREVIEW
              </h3>
              <p className="text-xs font-mono text-slate-400">
                ID: <span className="text-[#b91c1c] font-bold">{certId}</span> &bull; {certificate.eventName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scaled Preview Canvas Wrapper */}
        <div className="w-full overflow-x-auto py-2 flex justify-center bg-[#050608] rounded-2xl border border-white/5 p-4">
          <div
            style={{
              transform: 'scale(0.70)',
              transformOrigin: 'top center',
              width: '1199px',
              height: '848px',
              marginBottom: '-250px', // Offset scale height overflow
            }}
            className="shadow-2xl rounded-lg"
          >
            <CertificateTemplate ref={certRef} certificate={certificate} />
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/verify/${certId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#b91c1c]" /> Verify Page
            </Link>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" /> Copy Link
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/5 transition-colors"
            >
              Close
            </button>
            <CertificateDownloadButton
              targetRef={certRef}
              certificateId={certId}
              participantName={participantName}
              variant="glow"
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
