import React, { forwardRef } from 'react';
import { CertificateQRCode } from './CertificateQRCode';
import { certificateLayout } from '../../config/certificateLayout';
import type { CertificateRecord } from '../../types/certificate';

interface CertificateTemplateProps {
  certificate: CertificateRecord;
  scale?: number;
  className?: string;
}

/**
 * TARAS 2K26 — Dynamic E-Certificate Template Component
 *
 * Uses the supplied TARAS 2K26 Certificate.png design as the fixed background.
 * Overlays participant-specific data according to the layout configuration.
 */
export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ certificate, scale = 1, className = '' }, ref) => {
    const {
      certificateId,
      certId,
      participantName,
      fullName,
      eventName,
      college,
      issuedAt,
      issueDate,
      certificateStatus,
      status,
      achievement,
      position,
    } = certificate;

    const finalId = certificateId || certId || 'TARAS26-CERT-000000';
    const finalName = (participantName || fullName || 'PARTICIPANT NAME').toUpperCase();
    const finalEvent = (eventName || 'TECHNICAL EVENT TRACK').toUpperCase();
    const finalCollege = (college || 'SRM VALLIAMMAI ENGINEERING COLLEGE').toUpperCase();

    const rawDate = issuedAt || issueDate || new Date().toISOString();
    const formattedDate = new Date(rawDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const isRevoked =
      certificateStatus === 'REVOKED' ||
      status === 'revoked' ||
      status === 'REVOKED';

    const { canvas, participantName: nameCfg, collegeName: colCfg, eventDescription: descCfg, certificateId: idCfg, issueDate: dateCfg, qrCode: qrCfg } = certificateLayout;

    // Construct high-impact recognition description
    const recognitionText = (
      <span>
        for participating and demonstrating technical competence in{' '}
        <strong style={{ color: '#ef4444', fontWeight: 800 }}>{finalEvent}</strong>
        {achievement ? (
          <span>
            {' '}with distinction of <strong style={{ color: '#fbbf24' }}>{achievement}</strong>
          </span>
        ) : position ? (
          <span>
            {' '}securing <strong style={{ color: '#fbbf24' }}>Rank #{position}</strong>
          </span>
        ) : null}{' '}
        under TARAS 2K26 National Level Technical Symposium conducted by the Department of Electronics and Communication Engineering at SRM Valliammai Engineering College.
      </span>
    );

    return (
      <div
        ref={ref}
        id={`taras-certificate-${finalId}`}
        style={{
          width: `${canvas.width}px`,
          height: `${canvas.height}px`,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#000000',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
        className={`select-none shadow-2xl rounded-sm ${className}`}
      >
        {/* Fixed Template Background Image */}
        <img
          src="/assets/certificates/taras-certificate-template.png"
          alt="TARAS 2K26 Certificate Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${canvas.width}px`,
            height: `${canvas.height}px`,
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />

        {/* Dynamic Overlay: Participant Name */}
        <div
          style={{
            position: 'absolute',
            left: `${nameCfg.x}px`,
            top: `${nameCfg.y}px`,
            width: `${nameCfg.width}px`,
            fontSize: `${nameCfg.fontSize}px`,
            fontWeight: nameCfg.fontWeight,
            color: nameCfg.color,
            textAlign: nameCfg.alignment,
            fontFamily: nameCfg.fontFamily,
            textTransform: nameCfg.textTransform,
            lineHeight: 1.15,
            zIndex: 10,
          }}
        >
          {finalName}
        </div>

        {/* Dynamic Overlay: College Name */}
        <div
          style={{
            position: 'absolute',
            left: `${colCfg.x}px`,
            top: `${colCfg.y}px`,
            width: `${colCfg.width}px`,
            fontSize: `${colCfg.fontSize}px`,
            fontWeight: colCfg.fontWeight,
            color: colCfg.color,
            textAlign: colCfg.alignment,
            fontFamily: colCfg.fontFamily,
            textTransform: colCfg.textTransform,
            zIndex: 10,
          }}
        >
          {finalCollege}
        </div>

        {/* Dynamic Overlay: Event & Recognition Description */}
        <div
          style={{
            position: 'absolute',
            left: `${descCfg.x}px`,
            top: `${descCfg.y}px`,
            width: `${descCfg.width}px`,
            fontSize: `${descCfg.fontSize}px`,
            fontWeight: descCfg.fontWeight,
            color: descCfg.color,
            textAlign: descCfg.alignment,
            fontFamily: descCfg.fontFamily,
            lineHeight: descCfg.lineHeight,
            zIndex: 10,
          }}
        >
          {recognitionText}
        </div>

        {/* Dynamic Overlay: QR Code Container */}
        <div
          style={{
            position: 'absolute',
            left: `${qrCfg.x}px`,
            top: `${qrCfg.y}px`,
            width: `${qrCfg.width}px`,
            height: `${qrCfg.height}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <CertificateQRCode certificateId={finalId} size={92} showCaption={true} />
        </div>

        {/* Dynamic Overlay: Certificate ID */}
        <div
          style={{
            position: 'absolute',
            left: `${idCfg.x}px`,
            top: `${idCfg.y}px`,
            width: `${idCfg.width}px`,
            fontSize: `${idCfg.fontSize}px`,
            fontWeight: idCfg.fontWeight,
            color: idCfg.color,
            textAlign: idCfg.alignment,
            fontFamily: idCfg.fontFamily,
            zIndex: 10,
          }}
        >
          ID: {finalId}
        </div>

        {/* Dynamic Overlay: Issue Date */}
        <div
          style={{
            position: 'absolute',
            left: `${dateCfg.x}px`,
            top: `${dateCfg.y}px`,
            width: `${dateCfg.width}px`,
            fontSize: `${dateCfg.fontSize}px`,
            fontWeight: dateCfg.fontWeight,
            color: dateCfg.color,
            textAlign: dateCfg.alignment,
            fontFamily: dateCfg.fontFamily,
            zIndex: 10,
          }}
        >
          Issued: {formattedDate}
        </div>

        {/* Revoked Status Watermark Banner */}
        {isRevoked && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <div
              style={{
                transform: 'rotate(-12deg)',
                border: '6px solid #dc2626',
                padding: '24px 48px',
                borderRadius: '16px',
                backgroundColor: 'rgba(69, 10, 10, 0.95)',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
              }}
            >
              <span
                style={{
                  fontSize: '56px',
                  fontWeight: 900,
                  color: '#ef4444',
                  letterSpacing: '6px',
                  display: 'block',
                  fontFamily: 'monospace',
                }}
              >
                REVOKED
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  color: '#ffffff',
                  marginTop: '8px',
                  display: 'block',
                  fontWeight: 600,
                }}
              >
                THIS CERTIFICATE HAS BEEN OFFICIALLY REVOKED BY TARAS 2K26
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';
