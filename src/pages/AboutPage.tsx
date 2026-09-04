import React from 'react';
import { Badge } from '../components/common/Badge';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Shield, Cpu, Award, Zap, Compass, HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, cardEntrance } from '../motion/variants';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const values = [
    { title: 'Academic Distinction', description: 'Over 25 years of pioneering Electronics, Signal Processing, and Communication Engineering.', icon: <Award className="w-6 h-6 text-[#dc2626]" /> },
    { title: 'Hardware & AI Innovation', description: 'Hands-on training in VLSI Cadence, Embedded IoT, and Neural Hardware Accelerators.', icon: <Cpu className="w-6 h-6 text-[#dc2626]" /> },
    { title: 'Student Empowerment', description: 'Organized by student leaders and IEEE student branch members fostering competitive engineering passion.', icon: <Zap className="w-6 h-6 text-[#dc2626]" /> },
    { title: 'State-of-the-Art Labs', description: 'Ten dedicated research laboratories with Microwave Benches, DSP Boards, and EDA Software.', icon: <Shield className="w-6 h-6 text-[#dc2626]" /> },
  ];

  return (
    <div className="space-y-12 pb-24">
      {/* Visual Header */}
      <VisualAtmosphere
        environmentKey="about"
        badgeText="THE TARAS LEGACY"
        title="ABOUT TARAS & ECE DEPARTMENT"
        subtitle="Department of Electronics and Communication Engineering • SRM Valliammai Engineering College"
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ── Cinematic Spider-Man Noir Character Story Showcase ── */}
        <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0a0c10] via-[#120404] to-[#0a0c10] border-2 border-[#dc2626]/40 shadow-2xl overflow-hidden">
          {/* Spider Web Pattern */}
          <div className="absolute inset-0 bg-web-grid opacity-25 pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-[#dc2626]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Story Text */}
            <div className="lg:col-span-8 space-y-4">
              <span className="font-mono-tech text-xs font-bold uppercase tracking-widest text-[#dc2626]">
                ORIGIN OF THE SYMPOSIUM
              </span>
              <h2 className="font-bebas text-3xl sm:text-4xl lg:text-5xl text-white tracking-wide uppercase">
                WHAT IS TARAS 2K26?
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed font-light font-mono">
                TARAS is the flagship annual national-level technical symposium organized by the Department of Electronics and Communication Engineering at SRM Valliammai Engineering College.
              </p>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-light font-mono">
                The name TARAS symbolizes speed, energy, and radiant connectivity. Designed around an interconnected cybernetic spider-web universe, TARAS 2K26 brings together brilliant undergraduate and postgraduate minds across India to compete in paper presentations, hardware debugging, IoT hackathons, and pop culture media quizzes.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/events"
                  className="px-5 py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-950/50 flex items-center gap-2"
                >
                  Explore Event Tracks <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/timeline"
                  className="px-5 py-2.5 rounded-xl bg-[#0a0c10] border border-slate-700 hover:border-white text-slate-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                >
                  Symposium Schedule
                </Link>
              </div>
            </div>

            {/* Spider-Man Character Illustration Graphic Box */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-64 sm:w-72 rounded-2xl overflow-hidden border-2 border-[#dc2626]/60 shadow-[0_0_30px_rgba(220,38,38,0.3)] group">
                <img
                  src="/images/about/about-city.jpg"
                  alt="Spider-Man Noir Detective overlooking City"
                  className="w-full h-80 object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-90 contrast-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-[#0a0c10]/90 border border-slate-800 backdrop-blur-md text-center">
                  <span className="font-bebas text-sm text-white tracking-widest block uppercase">
                    GUARDIANS OF INNOVATION
                  </span>
                  <span className="font-mono-tech text-[9px] text-[#dc2626] uppercase">
                    SRM Valliammai ECE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: <Compass className="w-6 h-6 text-[#dc2626]" />,
              title: 'Department Vision',
              text: 'To excel in providing quality technical education in Electronics and Communication Engineering, fostering innovative research, ethical values, and leadership capabilities for societal advancement.',
            },
            {
              icon: <HeartHandshake className="w-6 h-6 text-[#dc2626]" />,
              title: 'Department Mission',
              text: 'To provide state-of-the-art laboratory infrastructure, promote industry-institute collaboration, encourage lifelong learning, and instill entrepreneurship among engineering delegates.',
            },
          ].map((item) => (
            <div key={item.title} className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 hover:border-[#dc2626]/40 transition-colors space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#dc2626]/40">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white font-mono">{item.title}</h3>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-mono font-light">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Pillars */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="font-mono-tech text-xs font-bold text-[#dc2626] uppercase tracking-widest">
              FOUR FOUNDATIONS
            </span>
            <h3 className="font-bebas text-3xl sm:text-4xl text-white tracking-wider uppercase">
              SYMPOSIUM PILLARS
            </h3>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {values.map((v, i) => (
              <motion.div
                key={i}
                variants={cardEntrance}
                className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-[#dc2626]/60 transition-colors space-y-3"
              >
                <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#dc2626]/40 w-fit">{v.icon}</div>
                <h4 className="font-bold text-white text-sm font-mono">{v.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-mono font-light">{v.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
