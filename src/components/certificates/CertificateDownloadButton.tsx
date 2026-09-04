import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';

interface CertificateDownloadButtonProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  certificateId: string;
  className?: string;
  variant?: 'glow' | 'outline' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const CertificateDownloadButton: React.FC<CertificateDownloadButtonProps> = ({
  targetRef,
  certificateId,
  className = '',
  variant = 'glow',
  size = 'md',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!targetRef.current) {
      alert('Certificate template element is not ready.');
      return;
    }

    setIsGenerating(true);

    try {
      const element = targetRef.current;

      // Render high-res canvas (scale: 2 for sharp crisp rendering on A4 print)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#050608',
      });

      const imgData = canvas.toDataURL('image/png');

      // Standard A4 Landscape PDF (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TARAS26_Certificate_${certificateId}.pdf`);
    } catch (err) {
      console.error('Failed to generate certificate PDF:', err);
      alert('Failed to generate certificate PDF. Please try again.');
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
      className={`font-mono font-bold ${className}`}
      icon={
        isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Download className="w-4 h-4 text-white" />
        )
      }
    >
      {isGenerating ? 'Rendering PDF…' : 'Download Certificate PDF'}
    </Button>
  );
};
