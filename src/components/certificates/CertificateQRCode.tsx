import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface CertificateQRCodeProps {
  certificateId: string;
  size?: number;
  baseUrl?: string;
  showCaption?: boolean;
}

export const CertificateQRCode: React.FC<CertificateQRCodeProps> = ({
  certificateId,
  size = 96,
  baseUrl,
  showCaption = true,
}) => {
  const origin =
    baseUrl ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? window.location.origin
      : 'https://taras-2k26.web.app');

  const verifyUrl = `${origin}/verify/${encodeURIComponent(certificateId)}`;

  return (
    <div className="flex flex-col items-center justify-center p-1.5 bg-white rounded-lg shadow-xl border border-slate-700/50">
      <QRCodeSVG
        value={verifyUrl}
        size={size}
        level="H"
        includeMargin={false}
        fgColor="#050608"
        bgColor="#ffffff"
      />
      {showCaption && (
        <span className="text-[7px] font-mono text-slate-800 mt-0.5 font-black tracking-widest uppercase">
          VERIFY
        </span>
      )}
    </div>
  );
};
