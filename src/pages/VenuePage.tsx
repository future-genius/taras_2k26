import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import {
  MapPin,
  Navigation,
  Bus,
  Train,
  HelpCircle,
  Compass,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  ExternalLink,
  Clock,
  Layers,
  Car,
  Plane,
  CheckCircle2,
  Share2,
  Copy,
} from 'lucide-react';
import { fadeInUp, cardEntrance, staggerContainer } from '../motion/variants';

export const VenuePage: React.FC = () => {
  const [copiedCoords, setCopiedCoords] = useState(false);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText('12.8252, 80.0460');
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const eventZones = [
    {
      id: 'z1',
      name: 'Ground Floor Quadrangle',
      purpose: 'Main Registration Desks, Help Desk & QR Scan Gate',
      time: '08:00 AM ONWARDS',
      badge: 'ENTRY GATE',
      icon: <Layers className="w-5 h-5 text-[#ff2b2b]" />,
    },
    {
      id: 'z2',
      name: 'Main College Auditorium',
      purpose: 'Inaugural Ceremony, Technical Quiz & Valedictory',
      time: '09:30 AM - 04:30 PM',
      badge: 'MAIN AUDI',
      icon: <Sparkles className="w-5 h-5 text-[#ff2b2b]" />,
    },
    {
      id: 'z3',
      name: 'ECE Block — Floor 2',
      purpose: 'Circuitrix Debugging Lab & Embedded Systems Hackathon',
      time: '10:30 AM ONWARDS',
      badge: 'FLOOR 2 LABS',
      icon: <ShieldCheck className="w-5 h-5 text-[#ff2b2b]" />,
    },
    {
      id: 'z4',
      name: 'ECE Block — Floor 3',
      purpose: 'Paper-X-Verse Seminar Halls & VLSI EDA Design Center',
      time: '10:00 AM ONWARDS',
      badge: 'FLOOR 3 HALLS',
      icon: <Compass className="w-5 h-5 text-[#ff2b2b]" />,
    },
    {
      id: 'z5',
      name: 'New Building, SRM VEC',
      purpose: 'Doc Ock’s Clue Cartel — Inter-Department Technical Game Arena',
      time: '10:30 AM ONWARDS',
      badge: 'NEW BUILDING',
      icon: <Layers className="w-5 h-5 text-[#ff2b2b]" />,
    },
  ];

  const travelModes = [
    {
      title: 'Suburban Train Network',
      subtitle: 'Fastest & Direct Access',
      desc: 'Take the Tambaram – Chengalpattu Suburban Line and alight at Potheri Railway Station. The campus main gate is just 200 meters (2-min walk).',
      badge: 'RECOMMENDED',
      icon: <Train className="w-6 h-6 text-[#ff2b2b]" />,
      timing: 'Frequency: Every 15 mins',
    },
    {
      title: 'MTC & State Bus Service',
      subtitle: 'GST Road Highway NH-45',
      desc: 'Any MTC bus or State Express traveling towards Chengalpattu/Guduvanchery stops directly at Potheri Bus Stop right opposite SRM Valliammai.',
      badge: 'HIGHWAY ACCESS',
      icon: <Bus className="w-6 h-6 text-[#ff2b2b]" />,
      timing: 'Stop: Potheri BS',
    },
    {
      title: 'Private Vehicle & Parking',
      subtitle: 'Dedicated Campus Parking',
      desc: 'Access via GST Road (NH-45). Secure multi-wheeler and 2-wheeler parking zones are available at Gate 2 with security assistance.',
      badge: 'FREE PARKING',
      icon: <Car className="w-6 h-6 text-[#ff2b2b]" />,
      timing: 'Gate 2 Entrance',
    },
    {
      title: 'Airport Transit',
      subtitle: 'Chennai International (MAA)',
      desc: 'Chennai International Airport is 24 km away. Direct suburban trains run from Tirusulam Station (Airport) to Potheri Station in 35 mins.',
      badge: 'AIRPORT CONECT',
      icon: <Plane className="w-6 h-6 text-[#ff2b2b]" />,
      timing: '35 mins via Rail',
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-12 pb-24"
    >
      {/* ── Level 1 & 2 Architectural Header Atmosphere ── */}
      <VisualAtmosphere
        environmentKey="venue"
        badgeText="NATIONAL LEVEL SYMPOSIUM ARENA"
        title="VENUE & CAMPUS NAVIGATION"
        subtitle="SRM Valliammai Engineering College • Department of ECE • Kattankulathur, Chengalpattu – 603203."
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ── FEATURED HERO VENUE SHOWCASE CARD ── */}
        <motion.div
          variants={cardEntrance}
          whileHover={{ scale: 1.005 }}
          className="relative rounded-3xl p-3 sm:p-5 bg-[#08090d] border-2 border-[#dc2626]/70 shadow-[0_0_60px_rgba(220,38,38,0.25)] overflow-hidden group"
        >
          {/* Top Floating Badge Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 border border-[#dc2626]/80 backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff2b2b] animate-ping" />
              <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                OFFICIAL ARENA // SRM VALLIAMMAI CAMPUS
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCoords}
                className="px-3 py-1.5 rounded-xl bg-[#1a0000] border border-[#dc2626]/60 hover:border-[#dc2626] text-[11px] font-mono font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
              >
                {copiedCoords ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#ff2b2b]" />}
                {copiedCoords ? 'GPS COORDS COPIED!' : '12.8252° N, 80.0460° E'}
              </button>
              <Badge variant="crimson" size="md">LIVE ARENA 26 SEPT</Badge>
            </div>
          </div>

          {/* Full Campus Image Frame with Pristine Aspect Ratio */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-[#030406] border border-[#dc2626]/30 shadow-2xl flex items-center justify-center min-h-[320px] sm:min-h-[460px] lg:min-h-[580px]">
            <img
              src="/images/venue/venue-campus-hd.jpg"
              alt="SRM Valliammai Engineering College Campus - TARAS 2K26 Venue"
              className="w-full h-full max-h-[700px] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.015]"
              loading="eager"
            />

            {/* Ambient Lighting Gradient Overlays for Cinematic Blending */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050608] via-transparent to-[#050608]/30" />
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-2xl" />
          </div>

          {/* Campus Details Footer Bar inside Card */}
          <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-[#0b0d13] border border-[#dc2626]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-[#ff2b2b] font-mono text-xs font-bold uppercase tracking-widest">
                <Compass className="w-4 h-4" /> MAIN SYMPOSIUM LOCATION
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                Department of Electronics & Communication Engineering (ECE)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                SRM Valliammai Engineering College (An Autonomous Institution, Accredited by NBA & NAAC 'A' Grade), Kattankulathur, Chengalpattu District, Tamil Nadu – 603203.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
              <a
                href="https://maps.google.com/?q=SRM+Valliammai+Engineering+College"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button variant="glow" size="md" icon={<Navigation className="w-4 h-4" />}>
                  Open Google Maps
                </Button>
              </a>
            </div>
          </div>
        </motion.div>

        {/* ── DESIGNATED EVENT ZONES GRID ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#dc2626]/30 pb-4">
            <div>
              <h3 className="text-2xl font-extrabold text-white font-mono flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-[#ff2b2b]" /> Designated Symposium Zones
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Find your assigned event halls, registration desk, and competition labs
              </p>
            </div>
            <Badge variant="red" size="md">4 ACTIVE ZONES</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {eventZones.map((zone) => (
              <motion.div
                key={zone.id}
                variants={cardEntrance}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.25 }}
                className="glass-panel p-5 rounded-2xl border border-[#dc2626]/40 hover:border-[#dc2626] transition-all space-y-3 shadow-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-[#1a0000] border border-[#dc2626]/50 shrink-0">
                      {zone.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#1a0000] border border-[#dc2626]/60 text-[#ff2b2b]">
                      {zone.badge}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-mono leading-snug">{zone.name}</h4>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">{zone.purpose}</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#ff2b2b]" /> TIMING
                  </span>
                  <strong className="text-white">{zone.time}</strong>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── TRAVEL & TRANSPORTATION MATRIX ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#dc2626]/30 pb-4">
            <div>
              <h3 className="text-2xl font-extrabold text-white font-mono flex items-center gap-2.5">
                <Compass className="w-6 h-6 text-[#ff2b2b]" /> How to Reach the Campus
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Multiple convenient transit options connecting Chennai city & suburban routes
              </p>
            </div>
            <Badge variant="crimson" size="md">POTHERI NH-45</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {travelModes.map((mode, idx) => (
              <motion.div
                key={idx}
                variants={cardEntrance}
                whileHover={{ scale: 1.02, y: -3 }}
                className="glass-panel p-5 rounded-2xl border border-[#dc2626]/30 hover:border-[#dc2626]/70 transition-all space-y-3 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#dc2626]/50">
                      {mode.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-slate-300">
                      {mode.badge}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-mono">{mode.title}</h4>
                  <span className="text-[11px] font-mono text-[#ff2b2b] block font-semibold">{mode.subtitle}</span>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">{mode.desc}</p>
                </div>

                <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400 font-semibold">
                  {mode.timing}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── HELP DESK & EMERGENCY CONTACT CONSOLE ── */}
        <motion.div
          variants={cardEntrance}
          className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#120303] via-[#0a0c10] to-[#07090d] border-2 border-[#dc2626]/60 shadow-[0_0_40px_rgba(220,38,38,0.2)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a0000] border border-[#dc2626]/50 text-xs font-mono font-bold text-[#ff2b2b]">
              <HelpCircle className="w-4 h-4" /> CAMPUS ASSISTANCE DESK
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-mono">
              Need Help Finding Your Hall or Event Zone?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
              Our Registration Coordinators and Student Volunteers are posted at the Ground Floor Quadrangle to guide you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <a href="tel:+919840123456" className="w-full sm:w-auto">
              <Button variant="glow" size="md" icon={<PhoneCall className="w-4 h-4" />}>
                Call Desk: +91 98401 23456
              </Button>
            </a>
            <a
              href="https://maps.google.com/?q=SRM+Valliammai+Engineering+College"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="md" icon={<ExternalLink className="w-4 h-4" />}>
                Open GPS
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
