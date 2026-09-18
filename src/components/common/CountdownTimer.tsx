import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCountdown } from '../../hooks/useCountdown';
import { Calendar, Clock, Radio } from 'lucide-react';

interface TimeUnitProps {
  label: string;
  value: number;
  subLabel?: string;
  isSeconds?: boolean;
}

const TimeUnit: React.FC<TimeUnitProps> = ({ label, value, subLabel, isSeconds }) => {
  const display = String(value).padStart(2, '0');

  return (
    <div className="flex flex-col items-center flex-1 min-w-[64px] sm:min-w-[78px] md:min-w-[92px]">
      {/* Digit Display Card with Spring Physics Hover */}
      <motion.div
        whileHover={{ y: -3, scale: 1.025 }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className={`relative w-full py-3 sm:py-4 px-2 rounded-2xl bg-gradient-to-b from-[#131722]/85 via-[#0b0e16]/95 to-[#06070a]/98 border backdrop-blur-xl flex flex-col items-center justify-center transition-colors duration-300 group overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] ${
          isSeconds
            ? 'border-[#dc2626]/40 hover:border-[#dc2626]'
            : 'border-white/10 hover:border-[#dc2626]/50'
        }`}
      >
        {/* Subtle Ambient Shimmer Glaze across card */}
        <motion.div
          animate={{ x: ['-140%', '220%'] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-2/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -skew-x-12 pointer-events-none z-20"
        />

        {/* Top Active Indicator Tick */}
        {isSeconds ? (
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4], scaleX: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-[2px] rounded-full bg-[#dc2626] mb-1.5 shadow-[0_0_8px_#dc2626]"
          />
        ) : (
          <span className="w-4 h-[1.5px] rounded-full bg-white/15 group-hover:bg-[#dc2626] transition-colors mb-1.5" />
        )}

        {/* Number with Rolling Transition */}
        <div className="relative min-h-[42px] sm:min-h-[48px] md:min-h-[54px] flex items-center justify-center z-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={display}
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="font-bebas text-3xl sm:text-4xl md:text-5xl text-white tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] select-none leading-none"
            >
              {display}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Subtitle / Unit label */}
        <span className="font-mono text-[9px] sm:text-[10px] md:text-[11px] font-bold text-slate-400 group-hover:text-red-400 tracking-[0.22em] uppercase transition-colors pt-1 z-10">
          {label}
        </span>

        {/* Subtle Bottom Accent Glow on hover */}
        <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#dc2626]/0 to-transparent group-hover:via-[#dc2626] transition-all duration-300" />
      </motion.div>

      {subLabel && (
        <span className="text-[8px] font-mono text-slate-500 tracking-wider uppercase mt-1.5 hidden sm:block">
          {subLabel}
        </span>
      )}
    </div>
  );
};

export const CountdownTimer: React.FC = () => {
  const { days, hours, minutes, seconds, isLive } = useCountdown('2026-10-10T09:00:00+05:30');

  if (isLive) {
    return (
      <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#1a0000] via-[#2d0004] to-[#1a0000] border border-[#dc2626] shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center gap-3.5">
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dc2626] opacity-90" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#dc2626]" />
        </span>
        <div>
          <span className="text-base sm:text-lg font-bebas tracking-widest text-white uppercase block">
            TARAS 2K26 IS CURRENTLY LIVE
          </span>
          <span className="text-[11px] font-mono text-slate-300">Technical Symposium in Session</span>
        </div>
      </div>
    );
  }

  const units = [
    { label: 'DAYS', value: days, subLabel: 'OCTOBER 2026', isSeconds: false },
    { label: 'HOURS', value: hours, subLabel: 'TIME MATRIX', isSeconds: false },
    { label: 'MINUTES', value: minutes, subLabel: 'COUNTDOWN', isSeconds: false },
    { label: 'SECONDS', value: seconds, subLabel: 'PRECISION', isSeconds: true },
  ];

  return (
    <div className="relative inline-flex flex-col p-4 sm:p-5 md:p-6 rounded-3xl bg-[#08090e]/95 border border-white/10 hover:border-[#dc2626]/40 shadow-[0_8px_36px_rgba(0,0,0,0.7),0_0_25px_rgba(220,38,38,0.14),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition-all duration-300 overflow-hidden">
      
      {/* ── Top Executive Status Header ── */}
      <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[10px] sm:text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dc2626] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#dc2626]" />
          </span>
          <span className="font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#dc2626]" /> EVENT COUNTDOWN
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[10px]">
          <Calendar className="w-3 h-3 text-[#dc2626]" />
          <span className="font-medium text-slate-200">10 OCT 2026</span>
          <span className="text-slate-600">•</span>
          <span className="text-[#dc2626] font-bold">09:00 AM IST</span>
        </div>
      </div>

      {/* ── 4 Main Time Units with Synchronized Breathing Colons ── */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {units.map((unit, index) => (
          <React.Fragment key={unit.label}>
            <TimeUnit
              label={unit.label}
              value={unit.value}
              subLabel={unit.subLabel}
              isSeconds={unit.isSeconds}
            />

            {/* Synchronized Breathing Colons */}
            {index < units.length - 1 && (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-600 select-none pb-5 px-0.5">
                <motion.span
                  animate={{ scale: [1, 1.25, 1], opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-1.5 h-1.5 rounded-full bg-[#dc2626] shadow-[0_0_6px_rgba(220,38,38,0.8)]"
                />
                <motion.span
                  animate={{ scale: [1, 1.25, 1], opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#dc2626] shadow-[0_0_6px_rgba(220,38,38,0.8)]"
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Bottom Subdued Professional Footer ── */}
      <div className="w-full flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-[9px] font-mono text-slate-400">
        <span className="tracking-wider">
          VENUE: <strong className="text-white font-medium">SRM VALLIAMMAI CAMPUS</strong>
        </span>
        <span className="text-[#dc2626] font-bold tracking-widest uppercase flex items-center gap-1">
          <Radio className="w-2.5 h-2.5 text-[#dc2626] animate-pulse" /> LIVE SYNC
        </span>
      </div>

      {/* ── Hairline Ambient Laser Pulse at Base ── */}
      <div className="absolute bottom-0 inset-x-8 h-[1px] overflow-hidden">
        <motion.div
          animate={{ x: ['-100%', '150%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#dc2626] to-transparent opacity-80"
        />
      </div>
    </div>
  );
};
