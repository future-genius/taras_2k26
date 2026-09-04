import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface CertificateQRCodeProps {
  certificateId: string;
  size?: number;
  baseUrl?: string;
}

export const CertificateQRCode: React.FC<CertificateQRCodeProps> = ({
  certificateId,
  size = 110,
  baseUrl,
}) => {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://taras-2k26.web.app');
  const verifyUrl = `${origin}/verify-certificate?id=${encodeURIComponent(certificateId)}`;

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-md border border-amber-500/40">
      <QRCodeSVG
        value={verifyUrl}
        size={size}
        level="H"
        includeMargin={false}
        fgColor="#0a0c10"
        bgColor="#ffffff"
      />
      <span className="text-[8px] font-mono text-slate-700 mt-1 font-semibold tracking-tighter">
        SCAN TO VERIFY
      </span>
    </div>
  );
};
