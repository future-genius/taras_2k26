import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { VisualCard } from '../components/visual/VisualCard';
import { MOCK_EVENTS } from '../data/events';
import { MOCK_ANNOUNCEMENTS } from '../data/announcements';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useAuth } from '../context/AuthContext';
import heroCinematic from '../assets/hero-cinematic.jpg';
import {
  Cpu,
  Users,
  Lightbulb,
  Trophy,
  ArrowRight,
  Shield,
  Calendar,
  MapPin,
  Rocket,
  Brain,
  ChevronRight,
  Zap,
  Sparkles,
} from 'lucide-react';

const RevealSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  return (
    <motion.section
      ref={ref as any}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.65, delay, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
    >
      {children}
    </motion.section>
  );
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRegisterClick = () => {
    if (user) {
      navigate('/events');
    } else {
      navigate('/participant/register');
    }
  };

  const pillars = [
    { label: 'TECH TALKS', icon: <Cpu className="w-5 h-5 text-white group-hover:text-[#dc2626] transition-colors" /> },
    { label: 'COMPETITIONS', icon: <Users className="w-5 h-5 text-white group-hover:text-[#dc2626] transition-colors" /> },
    { label: 'WORKSHOPS', icon: <Lightbulb className="w-5 h-5 text-white group-hover:text-[#dc2626] transition-colors" /> },
    { label: 'EXCITING PRIZES', icon: <Trophy className="w-5 h-5 text-white group-hover:text-[#dc2626] transition-colors" /> },
  ];

  const purposeCards = [
    {
      title: 'LEARN',
      subtitle: 'from experts',
      icon: <Users className="w-6 h-6 text-[#dc2626]" />,
      desc: 'Master cutting-edge embedded systems, AI micro-architectures, and wireless protocols.',
    },
    {
      title: 'BUILD',
      subtitle: 'real skills',
      icon: <Brain className="w-6 h-6 text-[#dc2626]" />,
      desc: 'Tackle real-world hardware & coding problem statements under championship pressure.',
    },
    {
      title: 'CREATE',
      subtitle: 'real impact',
      icon: <Rocket className="w-6 h-6 text-[#dc2626]" />,
      desc: 'Showcase solutions, win cash prizes, and network with leading tech founders and industry engineers.',
    },
  ];

  return (
    <div className="space-y-12 lg:space-y-20 pb-24 overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: HERO SECTION (Exact Reference Design Match + Dynamic Animations)
         ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[86vh] lg:min-h-[92vh] flex items-center pt-24 pb-12 lg:py-28 overflow-hidden bg-[#050608]">
        {/* Full Cinematic Spider-Man Backdrop Image */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-right lg:bg-center scale-100 opacity-95 transition-transform duration-1000 ease-out"
            style={{
              backgroundImage: `url(${heroCinematic})`,
              backgroundPosition: 'right 20% top',
            }}
          />
          {/* Subtle Left Side Vignette to ensure text readability without obscuring Spider-Man */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050608]/95 via-[#050608]/65 to-transparent lg:w-[65%]" />
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#050608] to-transparent" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[65vh]">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 pt-2">
              {/* Overline Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2"
              >
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a0000]/80 border border-[#dc2626]/50 shadow-[0_0_15px_rgba(220,38,38,0.25)]">
                  <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-ping" />
                  <span className="font-mono-tech text-[10px] sm:text-xs font-bold tracking-[0.25em] text-slate-200 uppercase">
                    A SYMPOSIUM FOR GREATER POSSIBILITIES
                  </span>
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-1"
              >
                <h1 className="font-bebas text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.88] tracking-wider text-white select-none">
                  TARAS <span className="text-[#dc2626] drop-shadow-[0_0_35px_rgba(220,38,38,0.65)]">2K26</span>
                </h1>
                <p className="font-bebas text-2xl sm:text-3xl md:text-4xl tracking-[0.16em] text-slate-200 uppercase pt-1 flex items-center gap-3">
                  <span>TECHNICAL SYMPOSIUM</span>
                  <span className="inline-block w-8 h-[2px] bg-[#dc2626]/70" />
                </p>
              </motion.div>

              {/* 3-Line Manifesto */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-mono text-xs sm:text-sm text-slate-300 leading-relaxed font-light space-y-0.5"
              >
                <p className="flex items-center gap-2">
                  <span className="text-[#dc2626]">&gt;</span> Ideas Investigate.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#dc2626]">&gt;</span> Technology Elevate.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#dc2626]">&gt;</span> Together We Create Tomorrow.
                </p>
              </motion.div>

              {/* Action Buttons with High-Tech Pulse and Shimmer Sheen */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center gap-3.5 pt-1"
              >
                <button
                  onClick={handleRegisterClick}
                  className="relative group overflow-hidden px-6 sm:px-8 py-3.5 rounded-full font-mono text-xs sm:text-sm font-bold tracking-wider text-white bg-[#dc2626] hover:bg-[#b91c1c] animate-pulse-glow shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                >
                  {/* Cyber Sheen Reflection Sweep */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                  <span className="relative z-10 flex items-center gap-2">
                    REGISTER NOW <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <Link
                  to="/events"
                  className="px-6 sm:px-8 py-3.5 rounded-full font-mono text-xs sm:text-sm font-bold tracking-wider text-white bg-[#0a0c10]/90 hover:bg-[#141822] border border-slate-700 hover:border-[#dc2626]/70 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all hover:scale-105 backdrop-blur-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#dc2626]" />
                  <span>EXPLORE EVENTS</span>
                </Link>
              </motion.div>

              {/* 4 Pillars Bar with Hover Micro-Animations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 border-t border-white/10"
              >
                {pillars.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 group cursor-default p-2 rounded-xl hover:bg-white/[0.02] transition-all hover:-translate-y-1"
                  >
                    <div className="p-2 rounded-lg bg-[#0a0c10]/90 border border-slate-800 group-hover:border-[#dc2626] group-hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] group-hover:scale-110 transition-all duration-300">
                      {pillar.icon}
                    </div>
                    <span className="font-mono-tech text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                      {pillar.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Graphic Wall Stencil Accents + Floating Tech Badges */}
            <div className="hidden lg:col-span-5 lg:flex flex-col justify-between items-end h-full relative py-6 pointer-events-none select-none">
              {/* Floating High-Tech Stat Pill 1 */}
              <div className="animate-float px-4 py-2.5 rounded-2xl bg-[#080a0f]/90 border border-[#dc2626]/50 shadow-[0_0_25px_rgba(220,38,38,0.3)] backdrop-blur-md flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dc2626] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#dc2626]" />
                </span>
                <div className="text-left font-mono">
                  <div className="text-xs font-bold text-white tracking-wider">6 CHAMPIONSHIP TRACKS</div>
                  <div className="text-[10px] text-slate-400">Technical &amp; Non-Technical</div>
                </div>
              </div>

              {/* Wall Stencil Typography */}
              <div className="text-right space-y-0.5 text-slate-400/40 font-bebas text-2xl sm:text-3xl tracking-widest uppercase pr-4">
                <div>SAME PEOPLE</div>
                <div className="text-[#dc2626]/80 font-bold">GREATER</div>
                <div>POSSIBILITIES</div>
              </div>

              {/* Floating High-Tech Stat Pill 2 */}
              <div className="animate-float-delayed px-4 py-2.5 rounded-2xl bg-[#080a0f]/90 border border-slate-700/80 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-3">
                <Trophy className="w-4 h-4 text-[#dc2626]" />
                <div className="text-left font-mono">
                  <div className="text-xs font-bold text-white tracking-wider">CASH POOL &amp; MERIT PASS</div>
                  <div className="text-[10px] text-slate-400">Verified Credentials</div>
                </div>
              </div>

              {/* Ledge Stencil Tag */}
              <div className="pt-8 text-right space-y-0.5 pr-2">
                <div className="font-bebas text-xl tracking-widest text-slate-400/30 uppercase rotate-[-3deg]">
                  GREATER STUDENTS
                </div>
                <div className="font-bebas text-2xl tracking-widest text-slate-300/50 uppercase rotate-[-3deg]">
                  BRIGHTER TOMORROW
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          HIGH-TECH ANIMATED CYBER MARQUEE RIBBON
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden py-3 bg-[#080a0f] border-y border-[#dc2626]/30 shadow-[0_0_25px_rgba(220,38,38,0.15)] select-none">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
          <span>⚡ TARAS 2K26 NATIONAL TECHNICAL SYMPOSIUM</span>
          <span className="text-[#dc2626]">•</span>
          <span>DEPARTMENT OF ELECTRONICS &amp; COMMUNICATION ENGINEERING</span>
          <span className="text-[#dc2626]">•</span>
          <span>SRM VALLIAMMAI ENGINEERING COLLEGE</span>
          <span className="text-[#dc2626]">•</span>
          <span>26 SEPTEMBER 2026</span>
          <span className="text-[#dc2626]">•</span>
          <span>6 CHAMPIONSHIP TRACKS</span>
          <span className="text-[#dc2626]">•</span>
          <span>CASH PRIZES &amp; MERIT CERTIFICATES</span>
          <span className="text-[#dc2626]">•</span>
          <span>REGISTRATIONS OPEN NOW</span>
          <span className="text-[#dc2626]">•</span>

          {/* Loop duplicate for seamless infinite ticker */}
          <span>⚡ TARAS 2K26 NATIONAL TECHNICAL SYMPOSIUM</span>
          <span className="text-[#dc2626]">•</span>
          <span>DEPARTMENT OF ELECTRONICS &amp; COMMUNICATION ENGINEERING</span>
          <span className="text-[#dc2626]">•</span>
          <span>SRM VALLIAMMAI ENGINEERING COLLEGE</span>
          <span className="text-[#dc2626]">•</span>
          <span>26 SEPTEMBER 2026</span>
          <span className="text-[#dc2626]">•</span>
          <span>6 CHAMPIONSHIP TRACKS</span>
          <span className="text-[#dc2626]">•</span>
          <span>CASH PRIZES &amp; MERIT CERTIFICATES</span>
          <span className="text-[#dc2626]">•</span>
          <span>REGISTRATIONS OPEN NOW</span>
          <span className="text-[#dc2626]">•</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: DEPARTMENT METADATA & LIVE COUNTDOWN BAR
         ───────────────────────────────────────────────────────────── */}
      <RevealSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#dc2626]/40 animate-border-pulse flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
          {/* Department & Venue Info */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-[#1a0000] border border-[#dc2626]/50 text-slate-200">
              <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse" />
              <span>DEPT. OF ECE • SRM VALLIAMMAI ENGINEERING COLLEGE</span>
            </div>
            <h3 className="font-mono text-xs sm:text-sm text-slate-300 font-light">
              National Level Technical Symposium • Connecting Innovators Across India
            </h3>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-[#dc2626]" /> 26 SEPTEMBER 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-[#dc2626]" /> SRM VALLIAMMAI CAMPUS
              </span>
            </div>
          </div>

          {/* Real Live Countdown Timer */}
          <div className="shrink-0">
            <CountdownTimer />
          </div>
        </div>
      </RevealSection>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: OUR PURPOSE (Exact Reference Cyber-Bevel Design)
         ───────────────────────────────────────────────────────────── */}
      <RevealSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-8 sm:p-12 lg:p-14 rounded-3xl bg-[#08090d]/95 border-2 border-slate-800/90 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Cyber Cut corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#dc2626]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#dc2626]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#dc2626]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#dc2626]" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Description Column */}
            <div className="lg:col-span-6 space-y-4">
              <span className="font-mono-tech text-xs font-bold uppercase tracking-[0.2em] text-[#dc2626] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse" />
                OUR PURPOSE
              </span>
              <h2 className="font-bebas text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide leading-tight uppercase">
                MORE THAN A SYMPOSIUM
              </h2>
              <p className="text-slate-300 font-mono text-xs sm:text-sm leading-relaxed max-w-lg font-light">
                TARAS 2K26 is a platform for visionary minds to collaborate, compete and create meaningful impact through technology.
              </p>
            </div>

            {/* Right 3 Crimson Action Cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {purposeCards.map((card, i) => (
                <div
                  key={i}
                  className="group p-6 rounded-2xl bg-[#0e1017]/95 border border-slate-800 hover:border-[#dc2626] transition-all duration-300 flex flex-col items-center justify-center text-center space-y-3 hover:shadow-[0_0_24px_rgba(220,38,38,0.3)] hover:-translate-y-2 cursor-default"
                >
                  <div className="p-3 rounded-xl bg-[#1a0000] border border-[#dc2626]/40 group-hover:scale-115 group-hover:border-[#dc2626] group-hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300">
                    {card.icon}
                  </div>
                  <div>
                    <h4 className="font-bebas text-2xl tracking-wider text-white group-hover:text-[#dc2626] transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-[11px] font-mono-tech text-slate-400">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: FEATURED COMPETITIONS TRACKS
         ───────────────────────────────────────────────────────────── */}
      <RevealSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#dc2626]/30 pb-4">
          <div>
            <span className="font-mono-tech text-xs font-bold text-[#dc2626] uppercase tracking-widest block mb-1">
              CHALLENGE YOUR LIMITS
            </span>
            <h2 className="font-bebas text-4xl sm:text-5xl text-white tracking-wide uppercase">
              FEATURED COMPETITIONS &amp; TRACKS
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#dc2626] hover:text-white uppercase tracking-wider transition-colors group"
          >
            VIEW ALL 6 EVENTS <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_EVENTS.slice(0, 3).map((ev) => (
            <Link key={ev.id} to={`/events/${ev.id}`} className="group block">
              <VisualCard
                title={ev.name}
                subtitle={ev.shortDescription}
                category={ev.category === 'TECHNICAL' ? 'technical' : 'non-technical'}
                badge={ev.category}
              >
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
                  <span className="text-[#dc2626] font-bold group-hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] transition-all">
                    {ev.prizes[0]?.amount} Prize
                  </span>
                  <span className="text-slate-400">{ev.type} Track</span>
                </div>
              </VisualCard>
            </Link>
          ))}
        </div>
      </RevealSection>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: LIVE SYMPOSIUM DISPATCHES TICKER
         ───────────────────────────────────────────────────────────── */}
      <RevealSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#dc2626]/40 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dc2626] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#dc2626]" />
              </span>
              <span className="font-mono-tech text-xs font-bold text-white uppercase tracking-widest">
                LIVE DISPATCHES &amp; SYMPOSIUM BROADCASTS
              </span>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-mono font-bold text-[#dc2626] hover:underline flex items-center gap-1 uppercase group"
            >
              All Updates <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_ANNOUNCEMENTS.slice(0, 2).map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-2xl bg-[#0a0c10]/90 border border-slate-800 hover:border-[#dc2626]/60 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:-translate-y-1 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-tech text-[#dc2626] font-bold uppercase">{ann.category}</span>
                  <span className="text-[10px] font-mono text-slate-500">{new Date(ann.timestamp).toLocaleDateString()}</span>
                </div>
                <h4 className="text-sm font-bold text-white font-mono">{ann.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 font-light">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>
    </div>
  );
};
