import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCountdown } from '../../hooks/useCountdown';
import { numberFlip } from '../../motion/variants';

const FlipNumber: React.FC<{ value: number }> = ({ value }) => {
  const display = String(value).padStart(2, '0');
  return (
    <div className="relative h-14 sm:h-16 md:h-20 flex items-center justify-center overflow-hidden w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-mono drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)]"
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export const CountdownTimer: React.FC = () => {
  const { days, hours, minutes, seconds, isLive } = useCountdown('2026-10-10T09:00:00+05:30');

  if (isLive) {
    return (
      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#1a0000] border border-[#5b0000]/60 shadow-xl shadow-black">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b91c1c] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#b91c1c]" />
        </span>
        <span className="text-lg md:text-xl font-extrabold tracking-widest text-white uppercase font-mono">
          TARAS 2K26 IS LIVE
        </span>
      </div>
    );
  }

  const units = [
    { label: 'DAYS', value: days },
    { label: 'HOURS', value: hours },
    { label: 'MINUTES', value: minutes },
    { label: 'SECONDS', value: seconds },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 my-4">
      {units.map((unit, i) => (
        <React.Fragment key={unit.label}>
          <div className="flex flex-col items-center justify-center w-20 sm:w-24 md:w-28 glass-panel-glow rounded-xl border border-[#3f0000]/50 shadow-lg relative overflow-hidden">
            {/* Top dark-red accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#b91c1c] to-transparent opacity-60" />
            <FlipNumber value={unit.value} />
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#991b1b] uppercase mb-2 font-mono">
              {unit.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-2xl md:text-3xl font-extrabold text-[#3f0000] hidden sm:inline-block select-none animate-red-pulse">
              :
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
