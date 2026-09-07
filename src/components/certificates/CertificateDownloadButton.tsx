import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import { downloadCertificatePdf } from '../../services/certificateService';

interface CertificateDownloadButtonProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  certificateId: string;
  participantName?: string;
  className?: string;
  variant?: 'glow' | 'outline' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const CertificateDownloadButton: React.FC<CertificateDownloadButtonProps> = ({
  targetRef,
  certificateId,
  participantName = 'Participant',
  className = '',
  variant = 'glow',
  size = 'md',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!targetRef.current) {
      alert('Certificate template element is not ready. Please wait a moment and try again.');
      return;
    }

    setIsGenerating(true);

    try {
      await downloadCertificatePdf(targetRef.current, certificateId, participantName);
    } catch (err: any) {
      console.error('Failed to generate certificate PDF:', err);
      alert(err.message || 'Failed to generate certificate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownloadPDF}
      disabled={isGenerating}
      className={className}
      icon={
        isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Download className="w-4 h-4" />
        )
      }
    >
      {isGenerating ? 'Generating PDF…' : 'Download PDF'}
    </Button>
  );
};
