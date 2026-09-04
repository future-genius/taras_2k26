import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { MapPin, Navigation, Bus, Train, HelpCircle, Compass, Sparkles, ShieldCheck } from 'lucide-react';
import { fadeInUp, cardEntrance, staggerContainer } from '../motion/variants';

export const VenuePage: React.FC = () => {
  const eventZones = [
    { name: 'Ground Floor Quadrangle', purpose: 'Registration Desks & QR Scan Entry Gate', status: '08:00 AM' },
    { name: 'Main Auditorium', purpose: 'Inaugural, Quiz Finals & Valedictory', status: '09:30 AM' },
    { name: 'ECE Block Floor 2', purpose: 'Circuitrix Debugging Lab & DSP Hackathon', status: '10:30 AM' },
    { name: 'ECE Block Floor 3', purpose: 'Paperionix Seminar Halls & VLSI EDA Lab', status: '10:00 AM' },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-10 pb-24"
    >
      {/* Level 1 & 2 Architectural Map Web Grid Atmosphere */}
      <VisualAtmosphere
        environmentKey="venue"
        badgeText="CAMPUS LOCATION & MAP"
        title="VENUE & CAMPUS GUIDE"
        subtitle="SRM Valliammai Engineering College • Kattankulathur, Chengalpattu – 603203."
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ── Featured Venue Artwork Showcase (Spider-Man: Brand New Day) ── */}
        <motion.div
          variants={cardEntrance}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-[#1c0404] via-[#0a0c10] to-[#050608] border-2 border-[#dc2626]/60 shadow-[0_0_50px_rgba(220,38,38,0.25)] overflow-hidden group"
        >
          {/* Header Tag */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 border border-[#dc2626]/80 backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <Sparkles className="w-4 h-4 text-[#ff2b2b] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
              SRM VALLIAMMAI CAMPUS // BRAND NEW DAY
            </span>
          </div>

          {/* Full Image Display Container */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-[#030406] flex items-center justify-center min-h-[300px] sm:min-h-[420px] lg:min-h-[500px]">
            <img
              src="/images/venue/spiderman-brand-new-day.jpg"
              alt="TARAS 2K26 Venue - Spider-Man: Brand New Day Artwork"
              className="w-full h-full max-h-[600px] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              loading="eager"
            />

            {/* Subtle Vignette & Glow Overlay for Seamless Blending */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050608] via-transparent to-[#050608]/40" />
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-2xl" />
          </div>

          {/* Caption / Interactive Info Bar */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#dc2626]/30 bg-[#0a0c10]/90 rounded-b-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#ff2b2b] font-mono text-xs font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4" /> Official Symposium Arena
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white font-mono">
                Department of Electronics & Communication Engineering
              </h3>
              <p className="text-xs text-slate-300 font-light max-w-xl">
                Experience cutting-edge tech competitions and technical presentations at the state-of-the-art SRM Valliammai ECE Complex.
              </p>
            </div>

            <a
              href="https://maps.google.com/?q=SRM+Valliammai+Engineering+College"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-full sm:w-auto"
            >
              <Button variant="glow" size="md" icon={<Navigation className="w-4 h-4" />}>
                Get Directions
              </Button>
            </a>
          </div>
        </motion.div>

        {/* ── Grid: Campus Map & Event Zones ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 space-y-6">
            {/* Map Environment Card */}
            <motion.div variants={cardEntrance} className="glass-panel-glow rounded-2xl p-6 border border-[#b91c1c]/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#b91c1c]" /> SRM Valliammai Campus Map
                </h3>
                <Badge variant="crimson">26 SEPT ACTIVE</Badge>
              </div>
              <div className="w-full h-72 rounded-xl bg-[#0a0c10] border border-[#b91c1c]/40 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group">
                <img
                  src="/images/venue/venue-map.jpg"
                  alt="SRM Valliammai Architectural Map Grid"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 brightness-90 contrast-125 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-transparent to-[#0a0c10]/80" />
                <MapPin className="w-10 h-10 text-[#b91c1c] mb-3 animate-bounce relative z-10" />
                <h4 className="text-base font-bold text-white font-mono relative z-10">SRM Valliammai ECE Block</h4>
                <p className="text-xs text-slate-300 mt-1 relative z-10 font-mono">
                  Kattankulathur (Potheri Railway Station • GST Road NH-45)
                </p>
                <a
                  href="https://maps.google.com/?q=SRM+Valliammai+Engineering+College"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 relative z-10"
                >
                  <Button variant="glow" size="sm" icon={<Navigation className="w-4 h-4" />}>
                    Open Google Maps
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Event Zones */}
            <motion.div variants={cardEntrance} className="space-y-4">
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#dc2626]" /> Designated Event Areas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventZones.map((z, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="glass-panel p-4 rounded-xl border border-[#b91c1c]/30 hover:border-[#b91c1c]/70 transition-all space-y-1.5 shadow-md hover:shadow-[0_0_20px_rgba(220,38,38,0.15)]"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm font-mono">{z.name}</h4>
                      <span className="text-[10px] font-mono text-[#b91c1c] font-bold px-2 py-0.5 rounded bg-[#1a0000] border border-[#dc2626]/40">{z.status}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-light">{z.purpose}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div variants={cardEntrance} className="space-y-6">
            <div className="glass-panel-glow p-6 rounded-2xl space-y-4 border border-[#b91c1c]/40 shadow-xl">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#dc2626]" /> How to Reach Us
              </h3>
              <div className="space-y-4 text-xs text-slate-300 font-light leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0a0c10] border border-white/5">
                  <Train className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-mono text-sm">By Suburban Train:</strong>
                    Take the Tambaram–Chengalpattu local line and alight at <strong className="text-[#ff2b2b]">Potheri Station</strong> (2-minute walk to campus gate).
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0a0c10] border border-white/5">
                  <Bus className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-mono text-sm">By MTC Bus:</strong>
                    Any bus traveling via GST Road (NH-45) stops at <strong className="text-[#ff2b2b]">Potheri Bus Stop</strong> right opposite the university main entrance.
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[#b91c1c]/40 space-y-3 shadow-xl">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#b91c1c]" /> Help Desk & Assistance
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Visit the Registration Help Desk at the Ground Floor Quadrangle upon arrival for QR scan check-in and assistance.
              </p>
              <div className="text-sm font-mono text-[#ff2b2b] font-bold pt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-ping" />
                +91 98401 23456
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};
