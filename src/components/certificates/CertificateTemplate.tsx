import React, { forwardRef } from 'react';
import { CertificateQRCode } from './CertificateQRCode';
import type { CertificateRecord } from '../../types/certificate';

interface CertificateTemplateProps {
  certificate: CertificateRecord;
  scale?: number;
}

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ certificate }, ref) => {
    const {
      certificateId,
      certId,
      participantName,
      fullName,
      eventName,
      certificateType,
      achievement,
      position,
      issuedAt,
      issueDate,
      college,
      status,
    } = certificate;

    const finalId = certificateId || certId || 'TARAS26-CERT-000000';
    const finalName = participantName || fullName || 'PARTICIPANT NAME';
    const finalEvent = eventName || 'TECHNICAL EVENT TRACK';
    const finalCollege = college || 'SAVEETHA ENGINEERING COLLEGE';
    const rawDate = issuedAt || issueDate || new Date().toISOString();
    const formattedDate = new Date(rawDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const isRevoked = status === 'revoked' || status === 'REVOKED';
    const isDemoCert = Boolean((certificate as any).isDemo || (certificate as any).participantId === 'TARAS-DEMO-001');

    return (
      <div
        ref={ref}
        id="taras-certificate-canvas"
        style={{
          width: '1123px',
          height: '794px',
          backgroundColor: '#050608',
          color: '#ffffff',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Courier New', Courier, monospace, system-ui",
        }}
        className="select-none flex flex-col justify-between p-10 border-8 border-[#b91c1c] rounded-lg shadow-2xl"
      >
        {/* Decorative Inner Border */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            border: '2px solid #d97706',
            pointerEvents: 'none',
          }}
        />

        {/* Decorative Corner Accents */}
        <div className="absolute top-4 left-4 w-6 h-6 bg-[#b91c1c]" />
        <div className="absolute top-4 right-4 w-6 h-6 bg-[#b91c1c]" />
        <div className="absolute bottom-4 left-4 w-6 h-6 bg-[#b91c1c]" />
        <div className="absolute bottom-4 right-4 w-6 h-6 bg-[#b91c1c]" />

        {/* Demo / Sample Watermark Badge if Demo Record */}
        {isDemoCert && (
          <div className="absolute top-6 right-8 z-40 px-3 py-1 bg-[#1a0000] border-2 border-[#b91c1c] rounded-lg text-[10px] font-mono font-black text-[#b91c1c] uppercase tracking-widest shadow-md">
            ✦ DEMO / SAMPLE CREDENTIAL ✦
          </div>
        )}

        {/* Revoked Watermark Banner if Revoked */}
        {isRevoked && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="transform -rotate-12 border-8 border-red-600 px-12 py-6 rounded-3xl bg-red-950/90 text-center shadow-2xl">
              <span className="text-6xl font-black text-red-500 tracking-widest block font-mono">
                REVOKED
              </span>
              <span className="text-lg font-mono text-white mt-2 block">
                THIS CERTIFICATE HAS BEEN OFFICIALLY REVOKED BY TARAS 2K26
              </span>
            </div>
          </div>
        )}

        {/* HEADER SECTION */}
        <div className="text-center space-y-2 pt-4 relative z-10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1a0000] border-2 border-[#b91c1c] flex items-center justify-center font-bold text-[#b91c1c] text-xl">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200 tracking-wider uppercase font-mono">
                SRM VALLIAMMAI ENGINEERING COLLEGE
              </h3>
              <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase font-mono">
                DEPARTMENT OF ELECTRONICS AND COMMUNICATION ENGINEERING
              </p>
            </div>
          </div>

          <div className="pt-3">
            <h1 className="text-4xl font-black tracking-tight text-[#b91c1c] uppercase font-mono drop-shadow-md">
              TARAS 2K26 NATIONAL TECHNICAL SYMPOSIUM
            </h1>
            <div className="w-64 h-0.5 bg-gradient-to-r from-transparent via-[#b91c1c] to-transparent mx-auto mt-2" />
          </div>
        </div>

        {/* BODY SECTION */}
        <div className="text-center space-y-4 my-auto relative z-10 px-8">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#d97706] tracking-widest uppercase font-mono">
              OFFICIAL CREDENTIAL OF ACHIVEMENT
            </span>
            <h2 className="text-3xl font-extrabold text-[#d97706] uppercase tracking-wide font-mono">
              CERTIFICATE OF {String(certificateType).toUpperCase()}
            </h2>
          </div>

          <p className="text-sm text-slate-300 font-mono tracking-wider uppercase">
            THIS IS PROUDLY PRESENTED TO
          </p>

          {/* Recipient Name */}
          <div className="py-2">
            <h3 className="text-4xl font-black text-white tracking-wider uppercase font-mono border-b-2 border-[#d97706]/60 pb-2 inline-block px-10">
              {finalName}
            </h3>
          </div>

          <p className="text-xs text-slate-400 font-mono tracking-wide max-w-3xl mx-auto leading-relaxed">
            OF <strong className="text-slate-200 uppercase">{finalCollege}</strong> FOR PARTICIPATING / EXCELLING IN{' '}
            <strong className="text-[#b91c1c] font-black uppercase text-base">{finalEvent}</strong>
            {achievement ? (
              <span> WITH ACHIEVEMENT <strong className="text-amber-400 font-bold uppercase">({achievement})</strong></span>
            ) : null}
            {position ? (
              <span> SECURING POSITION <strong className="text-amber-400 font-bold">#{position}</strong></span>
            ) : null}
            {' '}AT TARAS 2K26 CONDUCTED BY THE DEPARTMENT OF ECE.
          </p>
        </div>

        {/* FOOTER SECTION */}
        <div className="relative z-10 border-t border-slate-800 pt-4 flex items-end justify-between px-6 pb-2">
          {/* Left: QR Code & Verification Info */}
          <div className="flex items-center gap-4">
            <CertificateQRCode certificateId={finalId} size={90} />
            <div className="text-left space-y-1 font-mono text-[10px] text-slate-400">
              <div>
                <span className="text-slate-500 uppercase block">Certificate ID:</span>
                <span className="text-white font-bold text-xs tracking-wider">{finalId}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block">Issued On:</span>
                <span className="text-slate-300">{formattedDate}</span>
              </div>
              <div className="text-[9px] text-[#b91c1c] font-semibold">
                Verified Record &bull; Authenticity Protected
              </div>
            </div>
          </div>

          {/* Center: Official Seal Badge */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#d97706] bg-[#1a0000] flex flex-col items-center justify-center mx-auto shadow-lg shadow-[#d97706]/20">
              <span className="text-[10px] font-black text-[#d97706] leading-none">TARAS</span>
              <span className="text-[8px] text-white font-bold">2K26</span>
              <span className="text-[7px] text-slate-400">SEAL</span>
            </div>
          </div>

          {/* Right: Signatures Block */}
          <div className="text-right space-y-3 font-mono text-xs">
            <div className="flex items-center gap-8 justify-end border-b border-slate-700 pb-2">
              <div className="text-center">
                <div className="h-6 font-serif italic text-amber-500 font-bold text-sm">HOD ECE</div>
                <div className="text-[9px] text-slate-400 uppercase font-mono border-t border-slate-700 pt-0.5">
                  Head of Department
                </div>
              </div>
              <div className="text-center">
                <div className="h-6 font-serif italic text-red-500 font-bold text-sm">Convener</div>
                <div className="text-[9px] text-slate-400 uppercase font-mono border-t border-slate-700 pt-0.5">
                  Symposium Convener
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              TARAS 2K26 EXECUTIVE BOARD
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';
