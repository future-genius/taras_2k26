import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpiderSense } from './SpiderSenseNotification';
import { Radio, Sparkles, Shield, Zap } from 'lucide-react';

export const SpideyWidget: React.FC = () => {
  const { notify } = useSpiderSense();
  const [isWebShooting, setIsWebShooting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Trigger Spidey Web Shot & Spider-Sense notification
  const handleSpideyClick = () => {
    setIsWebShooting(true);

    const alerts = [
      {
        title: 'Spidey Sense Activated!',
        message: 'Cybernetic Spider Web network synced across all TARAS 2K26 event sectors.',
      },
      {
        title: 'Web-Shooter Deployed!',
        message: 'Interconnected event schedule, live track updates, and digital passes online.',
      },
      {
        title: 'Spider Universe Signal Received!',
        message: 'National Level Technical Symposium registrations live for 26.09.2026.',
      },
    ];

    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
    notify('SYSTEM BROADCAST', randomAlert.title, randomAlert.message);

    setTimeout(() => {
      setIsWebShooting(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center pointer-events-auto">
      {/* ── Hanging Animated Web Line ── */}
      <motion.div
        animate={{
          scaleY: [1, 1.08, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-[2px] h-12 sm:h-16 bg-gradient-to-b from-transparent via-[#dc2626]/70 to-[#dc2626] shadow-[0_0_8px_#dc2626]"
      />

      {/* ── Swinging Spidey Mask & Emblem ── */}
      <motion.div
        animate={{
          rotate: [-7, 7, -7],
          y: [0, 6, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative group cursor-pointer"
        onClick={handleSpideyClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ── Spider-Sense Concentric Radial Pulse Arcs ── */}
        <div className="absolute -inset-4 rounded-full pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.4, 1.8],
              opacity: [0.7, 0.3, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="w-16 h-16 rounded-full border border-[#dc2626]/60 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1.6],
              opacity: [0.8, 0.2, 0],
            }}
            transition={{
              duration: 2.2,
              delay: 0.6,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute w-16 h-16 rounded-full border border-dashed border-[#dc2626]/40"
          />
        </div>

        {/* ── Interactive Radial Web Burst Animation on Click ── */}
        <AnimatePresence>
          {isWebShooting && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <motion.div
                  key={angle}
                  initial={{ scale: 0, opacity: 1, width: 2 }}
                  animate={{
                    scale: 1.8,
                    opacity: 0,
                    width: 40,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    rotate: `${angle}deg`,
                    transformOrigin: 'left center',
                  }}
                  className="absolute h-[2px] bg-gradient-to-r from-[#white] via-[#dc2626] to-transparent shadow-[0_0_10px_#dc2626]"
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* ── Spidey Emblem Main Container ── */}
        <div className="relative w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-gradient-to-br from-[#2a0404] via-[#120202] to-[#0a0c10] border-2 border-[#dc2626] shadow-[0_0_25px_rgba(220,38,38,0.6)] flex flex-col items-center justify-center p-1.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(220,38,38,0.85)] group-hover:border-white">
          
          {/* Background Web Grid Pattern */}
          <div className="absolute inset-0 bg-web-grid opacity-30 mix-blend-overlay rounded-2xl pointer-events-none" />

          {/* ── Spidey Eyes Graphic ── */}
          <div className="relative w-full h-8 flex items-center justify-center gap-1">
            {/* Left Eye */}
            <motion.div
              animate={{
                scaleY: isHovered ? 0.75 : [1, 0.9, 1],
              }}
              transition={{
                duration: isHovered ? 0.2 : 2.5,
                repeat: isHovered ? 0 : Infinity,
              }}
              className="w-3.5 h-6 sm:w-4 sm:h-7 bg-gradient-to-b from-white via-slate-100 to-slate-300 rounded-tl-full rounded-br-full border border-[#dc2626] shadow-[0_0_12px_#ffffff] -rotate-12 transform origin-center"
            />
            {/* Right Eye */}
            <motion.div
              animate={{
                scaleY: isHovered ? 0.75 : [1, 0.9, 1],
              }}
              transition={{
                duration: isHovered ? 0.2 : 2.5,
                repeat: isHovered ? 0 : Infinity,
              }}
              className="w-3.5 h-6 sm:w-4 sm:h-7 bg-gradient-to-b from-white via-slate-100 to-slate-300 rounded-tr-full rounded-bl-full border border-[#dc2626] shadow-[0_0_12px_#ffffff] rotate-12 transform origin-center"
            />
          </div>

          {/* Mini Spidey Logo/Tag */}
          <span className="text-[8px] font-mono font-black text-[#dc2626] uppercase tracking-tighter pt-0.5 group-hover:text-white transition-colors">
            SPIDEY
          </span>
        </div>

        {/* Hover Tooltip Card */}
        <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover:translate-y-0">
          <div className="px-3 py-1.5 rounded-xl bg-[#090b10]/95 border border-[#dc2626]/70 shadow-[0_0_20px_rgba(220,38,38,0.4)] backdrop-blur-md text-[10px] font-mono text-white whitespace-nowrap flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse shadow-[0_0_6px_#dc2626]" />
            <span className="font-bold text-[#dc2626]">SPIDEY SENSE</span>
            <span className="text-slate-400">| Click to ping web</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
