import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

interface QRPassVisualProps {
  participantName?: string;
  participantId?: string;
  college?: string;
  department?: string;
  year?: string;
  section?: string;
  qrToken?: string;
  registeredEvents?: string[];
  attendanceState?: 'CONFIRMED' | 'PENDING' | 'CHECKED-IN';
  venueStatus?: string;
}

export const QRPassVisual: React.FC<QRPassVisualProps> = ({
  participantName = 'ALEX PARKER',
  participantId = 'TARAS26-89421045',
  college = 'METROPOLITAN INSTITUTE OF TECH',
  department = 'ECE',
  year = 'III',
  section = 'A',
  qrToken = 'QR-TARAS26-89421045-SECURE',
  registeredEvents = ['Web Weaver Hackathon', 'Cyber Net Warfare'],
  attendanceState = 'CONFIRMED',
  venueStatus = 'MAIN AUDITORIUM',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="printable-digital-pass relative w-full max-w-md mx-auto rounded-2xl bg-[#0a0c10]/95 border border-[#b91c1c]/40 p-6 shadow-[0_12px_40px_rgba(185,28,28,0.3)] backdrop-blur-2xl overflow-hidden"
    >
      {/* Visual Background Layer */}
      <div className="absolute inset-0 bg-web-grid opacity-20 pointer-events-none no-print" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#b91c1c]/10 rounded-full blur-3xl pointer-events-none no-print" />

      {/* Pass Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10 print:border-black">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1a0000] border border-[#b91c1c]/60 flex items-center justify-center font-extrabold text-[#b91c1c] text-sm print:bg-white print:border-black print-text-red">
            T
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-wider text-white print-text-dark font-mono">
              TARAS 2K26 PASS
            </h3>
            <p className="text-[10px] font-mono text-slate-400 print-text-dark uppercase">
              TECHNICAL SYMPOSIUM IDENTITY
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-[#1a0000] border border-[#b91c1c]/40 flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#b91c1c] print:bg-white print:border-black print-text-red">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{attendanceState}</span>
        </div>
      </div>

      {/* Participant Info & High Scannable QR Code */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative z-10">
        {/* Scannable Real Vector QR Code Container */}
        <div className="p-3 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center shrink-0 border-2 border-[#b91c1c] print:border-black print-bg-white">
          <div className="p-1.5 bg-white rounded flex items-center justify-center">
            <QRCodeSVG
              value={qrToken}
              size={112}
              level="H"
              marginSize={2}
              aria-label={`Secure QR Code for Participant ${participantId}`}
            />
          </div>
          <span className="mt-1 text-[8px] font-mono font-bold text-black uppercase tracking-tighter">
            VALID SYMPOSIUM TOKEN
          </span>
        </div>

        {/* Info Column */}
        <div className="sm:col-span-2 space-y-2">
          <div>
            <span className="text-[10px] font-mono text-slate-400 print-text-dark uppercase block">
              Participant Name
            </span>
            <h4 className="text-base font-extrabold text-white print-text-dark leading-tight font-mono">
              {participantName}
            </h4>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-400 print-text-dark uppercase block">
              Participant ID
            </span>
            <p className="text-xs font-mono font-bold text-[#b91c1c] print-text-red">{participantId}</p>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-400 print-text-dark uppercase block">
              Institution
            </span>
            <p className="text-xs text-slate-300 print-text-dark truncate font-mono">{college}</p>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono">
            <div>
              <span className="text-slate-400 print-text-dark uppercase">Dept: </span>
              <span className="text-white print-text-dark font-bold">{department}</span>
            </div>
            <div>
              <span className="text-slate-400 print-text-dark uppercase">Yr/Sec: </span>
              <span className="text-white print-text-dark font-bold">
                {year} / {section}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Registered Events & Venue Zone */}
      <div className="space-y-3 pt-3 border-t border-white/10 relative z-10 print:border-black">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-slate-400 print-text-dark font-mono">
            <MapPin className="w-3.5 h-3.5 text-[#b91c1c] print-text-red" /> Venue Zone:
          </span>
          <span className="font-bold text-white print-text-dark font-mono">{venueStatus}</span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-slate-400 print-text-dark uppercase block mb-1.5">
            Registered Events ({registeredEvents.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {registeredEvents.length > 0 ? (
              registeredEvents.map((evt, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1a0000] text-slate-200 border border-[#5b0000]/50 print:bg-white print:border-black print-text-dark"
                >
                  {evt}
                </span>
              ))
            ) : (
              <span className="text-[10px] font-mono text-slate-500 italic">No events registered yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Pass Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800 print:border-black flex items-center justify-between text-[10px] font-mono text-slate-500 print-text-dark relative z-10">
        <span>SYMPOSIUM DATE: 26.09.2026</span>
        <span className="text-[#b91c1c] print-text-red font-bold">TARAS UNIVERSE // SECURED</span>
      </div>
    </motion.div>
  );
};
