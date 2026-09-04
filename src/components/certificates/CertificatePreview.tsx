import React, { useRef } from 'react';
import { CertificateTemplate } from './CertificateTemplate';
import { CertificateDownloadButton } from './CertificateDownloadButton';
import type { CertificateRecord } from '../../types/certificate';
import { X, Award, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CertificatePreviewProps {
  certificate: CertificateRecord;
  onClose: () => void;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ certificate, onClose }) => {
  const certRef = useRef<HTMLDivElement>(null);
  const certId = certificate.certificateId || certificate.certId || 'TARAS26-CERT-000000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
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
                ID: <span className="text-[#b91c1c] font-bold">{certId}</span>
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

        {/* Scaled Preview Wrapper */}
        <div className="w-full overflow-x-auto py-2 flex justify-center bg-[#050608] rounded-2xl border border-white/5 p-4">
          <div
            style={{
              transform: 'scale(0.72)',
              transformOrigin: 'top center',
              width: '1123px',
              height: '794px',
              marginBottom: '-220px', // Offset scale height overflow
            }}
            className="shadow-2xl rounded-lg"
          >
            <CertificateTemplate ref={certRef} certificate={certificate} />
          </div>
        </div>

        {/* Offscreen full-scale hidden canvas for html2canvas extraction */}
        <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
          {/* Note: certRef is attached above in the visible element so html2canvas renders the exact active element */}
        </div>

        {/* Modal Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
          <Link
            to={`/verify-certificate?id=${certId}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#b91c1c] transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Open Verification Link
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/5 transition-colors"
            >
              Close
            </button>
            <CertificateDownloadButton
              targetRef={certRef}
              certificateId={certId}
              variant="glow"
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
