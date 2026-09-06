import React from 'react';
import { motion } from 'framer-motion';

export const TeamHero: React.FC = () => {
  return (
    <header className="relative w-full text-center flex flex-col items-center justify-center pt-8 pb-4">
      {/* Category Sub-Badge */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest bg-[#1a0000]/90 border border-[#b91c1c]/40 text-[#f8fafc] shadow-[0_0_20px_rgba(185,28,28,0.35)] mb-4"
      >
        <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse" />
        TARAS 2K26 ORGANIZING COMMITTEE
      </motion.div>

      {/* Main Title */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-mono uppercase"
      >
        THE PEOPLE BEHIND <span className="text-gradient-red">TARAS 2K26</span>
      </motion.h1>

      {/* Short Supporting Statement */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-3 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed font-mono font-light"
      >
        A collective of visionaries, mentors, and creators bringing the national symposium to life.
      </motion.p>
    </header>
  );
};
