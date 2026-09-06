import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TeamMemberItem } from '../../data/teamData';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  UserCheck,
  Award,
  Sparkles,
  ShieldCheck,
  Quote,
  User,
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const getInitials = (name: string): string => {
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface TeamProfileShowcaseProps {
  members: TeamMemberItem[];
  currentIndex: number;
  onNavigateIndex: (index: number, direction: number) => void;
}

export const TeamProfileShowcase: React.FC<TeamProfileShowcaseProps> = ({
  members,
  currentIndex,
  onNavigateIndex,
}) => {
  const [direction, setDirection] = useState<number>(1);
  const [imageError, setImageError] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Interactive 3D tilt position states
  const [tilt, setTilt] = useState<{ rotateX: number; rotateY: number }>({ rotateX: 0, rotateY: 0 });

  const totalMembers = members.length;
  const currentMember = members[currentIndex] || members[0];

  // Detect accessibility prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Reset image error & tilt state on member change
  useEffect(() => {
    setImageError(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  }, [currentMember?.id]);

  // Handle Next / Previous navigation
  const handlePrev = useCallback(() => {
    setDirection(-1);
    const prev = (currentIndex - 1 + totalMembers) % totalMembers;
    onNavigateIndex(prev, -1);
  }, [currentIndex, totalMembers, onNavigateIndex]);

  const handleNext = useCallback(() => {
    setDirection(1);
    const next = (currentIndex + 1) % totalMembers;
    onNavigateIndex(next, 1);
  }, [currentIndex, totalMembers, onNavigateIndex]);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // 3D Card Hover Motion Tracker
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Calculate subtle 3D tilt (max ±12deg)
    setTilt({
      rotateX: -y * 12,
      rotateY: x * 12,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  if (!currentMember) return null;

  // Format index string (e.g. 01 / 06)
  const formattedCurrentIndex = String(currentIndex + 1).padStart(2, '0');
  const formattedTotalCount = String(totalMembers).padStart(2, '0');

  // Animation variants for card slide + 3D holographic rotation
  const containerVariants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 60 : -60,
      opacity: 0,
      rotateY: prefersReducedMotion ? 0 : dir > 0 ? 15 : -15,
      scale: prefersReducedMotion ? 1 : 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.5,
        ease: [0.16, 1, 0.3, 1] as const, // Spring-like cubic bezier
      },
    },
    exit: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? -60 : 60,
      opacity: 0,
      rotateY: prefersReducedMotion ? 0 : dir > 0 ? -15 : 15,
      scale: prefersReducedMotion ? 1 : 0.96,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.4,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    }),
  };

  // Staggered text children variants
  const textChildVariants = {
    enter: { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
    center: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: prefersReducedMotion ? 0 : 0.06 * i,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    }),
  };

  return (
    <div className="w-full space-y-8">
      {/* ── Main Editorial Showcase Card Container ── */}
      <div className="relative glass-panel-glow bg-[#07090e]/60 backdrop-blur-xl p-6 sm:p-8 md:p-10 rounded-3xl border border-[#dc2626]/40 overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        
        {/* Ambient Dark Red Background Radial Aura */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 65% 50% at 25% 45%, rgba(185, 28, 28, 0.25) 0%, transparent 75%)',
          }}
        />

        {/* Ambient Subtle Grid Texture */}
        <div className="absolute inset-0 bg-web-grid opacity-15 mix-blend-overlay pointer-events-none" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentMember.id}
            custom={direction}
            variants={containerVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10"
            drag={prefersReducedMotion ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) handleNext();
              else if (info.offset.x > 60) handlePrev();
            }}
          >
            {/* ── LEFT COLUMN: High-End Professional Photo Frame ── */}
            <div className="lg:col-span-6 flex flex-col items-center">
              {/* 3D Perspective Card Wrapper */}
              <div
                className="w-full max-w-md sm:max-w-lg cursor-pointer"
                style={{ perspective: 1200 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <motion.div
                  animate={{
                    rotateX: tilt.rotateX,
                    rotateY: tilt.rotateY,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 24,
                  }}
                  className="relative w-full p-[3px] rounded-[30px] bg-gradient-to-b from-[#dc2626] via-[#3a0606] to-[#0a0c10] shadow-[0_0_50px_rgba(220,38,38,0.35)] hover:shadow-[0_0_80px_rgba(220,38,38,0.6)] transition-shadow duration-500 group"
                >
                  {/* Subtle Background Glow Aura */}
                  <div className="absolute -inset-2 rounded-[34px] bg-gradient-to-tr from-[#dc2626]/40 via-red-950/20 to-amber-500/10 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Glass Photo Sheen Sweep Animation */}
                  <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none z-20">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-1/2 h-full -skew-x-12 animate-light-sweep" />
                  </div>

                  {/* Outer Bevel Frame Body */}
                  <div className="relative w-full aspect-[3/4] rounded-[27px] bg-[#06080e] overflow-hidden border border-white/10 flex flex-col justify-between shadow-2xl">
                    
                    {/* ── 1. Top HUD Header Strip ── */}
                    <div className="absolute top-0 left-0 right-0 z-30 px-4 py-3 bg-gradient-to-b from-[#05070c]/95 via-[#05070c]/80 to-transparent flex items-center justify-between font-mono text-[11px] border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dc2626] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#dc2626] shadow-[0_0_8px_#dc2626]" />
                        </span>
                        <span className="font-mono font-black tracking-widest text-white uppercase text-[10px]">
                          TARAS // EXECUTIVE DIRECTORY
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#1a0000] border border-[#dc2626]/50 text-[#dc2626] text-[10px] font-mono font-black tracking-wider shadow-[0_0_10px_rgba(220,38,38,0.25)]">
                          ID: {currentMember.id.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* ── 2. Precision Laser HUD Corner Reticles ── */}
                    <div className="absolute top-3 left-3 w-7 h-7 z-30 pointer-events-none">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#dc2626] to-transparent shadow-[0_0_8px_#dc2626]" />
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[#dc2626] to-transparent shadow-[0_0_8px_#dc2626]" />
                      <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_#ffffff]" />
                    </div>
                    <div className="absolute top-3 right-3 w-7 h-7 z-30 pointer-events-none">
                      <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-[#dc2626] to-transparent shadow-[0_0_8px_#dc2626]" />
                      <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-[#dc2626] to-transparent shadow-[0_0_8px_#dc2626]" />
                      <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_#ffffff]" />
                    </div>
                    <div className="absolute bottom-16 left-3 w-7 h-7 z-30 pointer-events-none">
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#dc2626] to-transparent shadow-[0_0_8px_#dc2626]" />
                      <div className="absolute bottom-0 left-0 w-[2px] h-full bg-gradient-to-t from-[#dc2626] to-transparent shadow-[0_0_8px_#dc2626]" />
                      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_#ffffff]" />
                    </div>
                    <div className="absolute bottom-16 right-3 w-7 h-7 z-30 pointer-events-none">
                      <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-[#dc2626] to-transparent shadow-[0_0_8px_#dc2626]" />
                      <div className="absolute bottom-0 right-0 w-[2px] h-full bg-gradient-to-t from-[#dc2626] to-transparent shadow-[0_0_8px_#dc2626]" />
                      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_#ffffff]" />
                    </div>

                    {/* ── 3. Main Portrait Photo / Executive Holographic Monogram Core ── */}
                    {currentMember.image && !imageError ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <img
                          src={currentMember.image}
                          alt={currentMember.name}
                          onError={() => setImageError(true)}
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        {/* Vignette Overlay Gradients */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#06080e] via-transparent to-[#06080e]/60 opacity-80 pointer-events-none" />
                        <div className="absolute inset-0 bg-web-grid opacity-15 mix-blend-overlay pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#180303] via-[#090b10] to-[#040508] text-center relative overflow-hidden space-y-4 pt-12 pb-20">
                        {/* Background Subtle Radar Glow Grid */}
                        <div className="absolute inset-0 bg-web-grid opacity-25 mix-blend-overlay pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.25)_0%,transparent_70%)] pointer-events-none" />

                        {/* Multi-layered Holographic Reactor Core Ring */}
                        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center my-auto transition-transform duration-700 group-hover:scale-105">
                          {/* Radar Pulse Wave Animation */}
                          <div className="absolute inset-0 rounded-full border border-[#dc2626]/50 animate-radar-pulse" />

                          {/* Outer Rotating Dashed Orbit Ring */}
                          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#dc2626]/50 animate-spin-slow" />

                          {/* Inner Counter-Rotating Ticks Ring */}
                          <div className="absolute inset-3 rounded-full border border-dotted border-slate-500/60 animate-spin-reverse" />

                          {/* Glowing Inner Shield Ring */}
                          <div className="absolute inset-5 rounded-full border-2 border-[#dc2626] shadow-[0_0_30px_rgba(220,38,38,0.6)]" />

                          {/* 4 Cardinal Laser Dots */}
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#dc2626] rounded-full shadow-[0_0_10px_#dc2626] animate-pulse" />
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#dc2626] rounded-full shadow-[0_0_10px_#dc2626] animate-pulse" />
                          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2.5 h-2.5 bg-[#dc2626] rounded-full shadow-[0_0_10px_#dc2626] animate-pulse" />
                          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2.5 h-2.5 bg-[#dc2626] rounded-full shadow-[0_0_10px_#dc2626] animate-pulse" />

                          {/* Central Metallic Monogram Badge */}
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#2d0404] via-[#140202] to-[#090b10] border-2 border-[#dc2626] flex items-center justify-center text-white text-3xl sm:text-4xl font-black font-mono shadow-[0_0_35px_rgba(220,38,38,0.7)] backdrop-blur-md relative overflow-hidden group/badge">
                            {/* Badge Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent -translate-x-full group-hover/badge:translate-x-full transition-transform duration-1000" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#dc2626] drop-shadow-[0_2px_10px_rgba(220,38,38,0.6)] tracking-widest">
                              {getInitials(currentMember.name)}
                            </span>
                          </div>
                        </div>

                        {/* Monogram Executive Status Labels */}
                        <div className="space-y-1 z-20">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c0000] border border-[#dc2626]/60 text-[10px] font-mono font-bold text-white shadow-[0_0_12px_rgba(220,38,38,0.3)] uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3 text-[#dc2626]" />
                            VERIFIED EXECUTIVE
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block font-semibold uppercase tracking-widest pt-1">
                            COMMITTED MEMBER // TARAS 2K26
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Dark Gradient Overlay Bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06080e] via-transparent to-transparent opacity-90 pointer-events-none" />

                    {/* ── 4. Titanium Designation Plaque ── */}
                    <div className="absolute bottom-3 left-3 right-3 z-30">
                      <div className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-[#180303]/95 via-[#090b10]/95 to-[#180303]/95 border border-[#dc2626]/70 backdrop-blur-xl shadow-[0_8px_25px_rgba(0,0,0,0.6)] flex items-center justify-between text-left group-hover:border-[#dc2626] transition-colors duration-300">
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold tracking-widest">
                            OFFICIAL DESIGNATION
                          </span>
                          <span className="text-xs sm:text-sm font-mono font-black text-white block truncate uppercase tracking-tight text-gradient-web">
                            {currentMember.badge || currentMember.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end text-[9px] font-mono text-slate-400 font-bold uppercase">
                            <span className="text-[#dc2626]">ACTIVE</span>
                            <span className="text-[8px] text-slate-500">OFFICIAL</span>
                          </div>
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dc2626] opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#dc2626] shadow-[0_0_8px_#dc2626]" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Executive Details & Metadata ── */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Category Counter & Tag */}
              <motion.div
                custom={0}
                variants={textChildVariants}
                className="flex items-center justify-between border-b border-white/10 pb-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#dc2626] animate-pulse" />
                  <span className="text-xs font-mono font-extrabold text-slate-300 uppercase tracking-widest">
                    ORGANIZING COMMITTEE
                  </span>
                </div>

                <div className="text-right font-mono">
                  <span className="text-2xl font-black text-[#dc2626]">{formattedCurrentIndex}</span>
                  <span className="text-slate-600 font-bold mx-1">/</span>
                  <span className="text-sm font-bold text-slate-400">{formattedTotalCount}</span>
                </div>
              </motion.div>

              {/* Role & Name */}
              <div className="space-y-2">
                <motion.div custom={1} variants={textChildVariants} className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-md bg-[#1c0000] border border-[#dc2626]/50 text-xs font-mono font-black text-[#dc2626] uppercase tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                    {currentMember.role}
                  </span>
                </motion.div>

                <motion.h2
                  custom={2}
                  variants={textChildVariants}
                  className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-mono uppercase tracking-tight drop-shadow-[0_2px_12px_rgba(220,38,38,0.3)]"
                >
                  {currentMember.name}
                </motion.h2>

                {currentMember.department && (
                  <motion.p
                    custom={3}
                    variants={textChildVariants}
                    className="text-xs sm:text-sm font-mono text-slate-300 font-normal flex items-center gap-2 flex-wrap"
                  >
                    <span className="text-slate-200">{currentMember.department}</span>
                    {currentMember.designation && (
                      <span className="text-slate-400 font-light">
                        • {currentMember.designation}
                      </span>
                    )}
                  </motion.p>
                )}

                {currentMember.assignedEventName && (
                  <motion.div custom={4} variants={textChildVariants} className="pt-2">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-[#1c0000] via-[#090b10] to-[#1c0000] border border-[#dc2626]/60 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]">
                      <Award className="w-4 h-4 text-[#dc2626]" />
                      Assigned Event: <span className="text-slate-200 font-extrabold">{currentMember.assignedEventName}</span>
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Short Bio Quote Block */}
              {currentMember.shortBio && (
                <motion.div
                  custom={5}
                  variants={textChildVariants}
                  className="relative p-4 sm:p-5 rounded-2xl bg-[#090b10]/90 border-l-4 border-[#dc2626] border-y border-r border-white/5 backdrop-blur-md shadow-lg group/quote"
                >
                  <Quote className="w-6 h-6 text-[#dc2626]/30 absolute top-3 right-3 group-hover/quote:text-[#dc2626]/50 transition-colors" />
                  <p className="text-xs sm:text-sm font-mono text-slate-300 italic leading-relaxed relative z-10">
                    "{currentMember.shortBio}"
                  </p>
                </motion.div>
              )}

              {/* Contact & Social Links */}
              <motion.div
                custom={6}
                variants={textChildVariants}
                className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono"
              >
                {currentMember.instagram && (
                  <a
                    href={currentMember.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#090b10] border border-slate-800 text-slate-300 hover:text-white hover:border-[#dc2626] hover:bg-[#1a0000] hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all group"
                  >
                    <InstagramIcon className="w-4 h-4 text-[#dc2626] group-hover:scale-110 transition-transform" />
                    <span>Instagram</span>
                  </a>
                )}

                {currentMember.linkedin && (
                  <a
                    href={currentMember.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#090b10] border border-slate-800 text-slate-300 hover:text-white hover:border-[#dc2626] hover:bg-[#1a0000] hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all group"
                  >
                    <LinkedinIcon className="w-4 h-4 text-[#dc2626] group-hover:scale-110 transition-transform" />
                    <span>LinkedIn</span>
                  </a>
                )}

                {currentMember.email && (
                  <a
                    href={`mailto:${currentMember.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#090b10] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all truncate max-w-xs"
                  >
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{currentMember.email}</span>
                  </a>
                )}

                {currentMember.phone && (
                  <a
                    href={`tel:${currentMember.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#090b10] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all shrink-0"
                  >
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{currentMember.phone}</span>
                  </a>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Bottom Controls & Arrow Navigation ── */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            className="px-5 py-2.5 rounded-xl bg-[#090b10] border border-slate-800 text-slate-300 hover:text-white hover:border-[#dc2626] hover:bg-[#1a0000] transition-all flex items-center gap-2 font-mono text-xs font-bold group outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] shadow-md"
            aria-label="Previous profile"
          >
            <ChevronLeft className="w-4 h-4 text-[#dc2626] group-hover:-translate-x-1 transition-transform" />
            <span>PREVIOUS</span>
          </button>

          {/* Quick Keyboard Counter Hint */}
          <div className="text-center font-mono text-xs text-slate-400 hidden sm:block">
            Use <kbd className="px-2 py-0.5 rounded bg-slate-800 text-white text-[10px] border border-slate-700">←</kbd>{' '}
            <kbd className="px-2 py-0.5 rounded bg-slate-800 text-white text-[10px] border border-slate-700">→</kbd> arrow keys to navigate
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-[#090b10] border border-slate-800 text-slate-300 hover:text-white hover:border-[#dc2626] hover:bg-[#1a0000] transition-all flex items-center gap-2 font-mono text-xs font-bold group outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] shadow-md"
            aria-label="Next profile"
          >
            <span>NEXT</span>
            <ChevronRight className="w-4 h-4 text-[#dc2626] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── Member Directory Pill Selector Grid ── */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#dc2626]" />
            MEMBER DIRECTORY ({totalMembers})
          </span>
          <span className="text-[11px] text-slate-500">Click card to jump to member</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {members.map((member, idx) => {
            const isSelected = idx === currentIndex;
            const indexStr = String(idx + 1).padStart(2, '0');

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  onNavigateIndex(idx, idx > currentIndex ? 1 : -1);
                }}
                className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] group ${
                  isSelected
                    ? 'bg-[#180303] border-[#dc2626] shadow-[0_0_20px_rgba(220,38,38,0.35)]'
                    : 'bg-[#090b10] border-slate-800 hover:border-slate-700 hover:bg-[#0e111a]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeMemberDirectoryBorder"
                    className="absolute inset-0 rounded-2xl border-2 border-[#dc2626] pointer-events-none shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}

                <div className="flex items-center justify-between text-[10px] font-mono relative z-10">
                  <span className={isSelected ? 'text-[#dc2626] font-extrabold' : 'text-slate-500'}>
                    #{indexStr}
                  </span>
                  {isSelected ? (
                    <UserCheck className="w-3.5 h-3.5 text-[#dc2626]" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-[#dc2626] transition-colors" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0 relative z-10">
                  <div
                    className={`text-xs font-bold font-mono truncate ${
                      isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {member.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate uppercase tracking-tight">
                    {member.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
