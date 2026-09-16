import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Button } from '../components/common/Button';
import {
  UserPlus,
  Trophy,
  Users,
  Share2,
  CreditCard,
  Clock,
  Flag,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const RegistrationGuidePage: React.FC = () => {
  const navigate = useNavigate();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    {
      step: '01',
      title: 'Register Yourself',
      subtitle: 'CREATE YOUR PARTICIPANT IDENTITY',
      desc: 'Create your TARAS 2K26 participant account with your full name, email, registration number, college, and phone number to get your unique participant ID.',
      icon: <UserPlus className="w-5 h-5 text-[#dc2626]" />,
      details: [
        'Instant TARAS 2K26 participant ID generation',
        'Automatic SRM Valliammai internal vs. external college verification',
        'Secure password & profile credentials',
      ],
    },
    {
      step: '02',
      title: 'Choose Your Event',
      subtitle: 'SELECT COMPETITION TRACKS',
      desc: 'Browse through technical and non-technical event tracks. Review rules, prize pools, and team requirements for each event.',
      icon: <Trophy className="w-5 h-5 text-[#dc2626]" />,
      details: [
        'Technical tracks: Paper-X-Verse, Tech-Matrix, Cyber-Code, etc.',
        'Non-Technical tracks: Gaming, Media, Quizzes, and Workshops',
        'Register for up to 3 events per participant or squad',
      ],
    },
    {
      step: '03',
      title: 'Create a Team',
      subtitle: 'FORM YOUR SQUAD (IF REQUIRED)',
      desc: 'For team events, create a squad as Team Leader/Captain. Set your team name and declared member count.',
      icon: <Users className="w-5 h-5 text-[#dc2626]" />,
      details: [
        'Automatic unique 6-character squad code (e.g. TR-X8K92)',
        'Event-independent squad creation in Team Hub',
        '1 Participant = 1 Team maximum enforced at database level',
      ],
    },
    {
      step: '04',
      title: 'Invite Your Friends',
      subtitle: 'SHARE YOUR TEAM CODE',
      desc: 'Share your team code with your teammates so they can submit join requests from their own accounts.',
      icon: <Share2 className="w-5 h-5 text-[#dc2626]" />,
      details: [
        'Team captain receives real-time join requests',
        'Approve or reject teammates with one click',
        'Team composition locks after registering for your first event',
      ],
    },
    {
      step: '05',
      title: 'Complete Payment',
      subtitle: 'SUBMIT UTR & PROOF',
      desc: 'Complete the applicable registration fee (₹200/person for paid events; ₹0 for free events) via UPI/QR code and submit your 12-digit UTR transaction number.',
      icon: <CreditCard className="w-5 h-5 text-[#dc2626]" />,
      details: [
        'Flat ₹200/person covering all registered events',
        'Instant duplicate UTR prevention & transaction locking',
        'Upload payment screenshot proof for rapid desk verification',
      ],
    },
    {
      step: '06',
      title: 'Get Verified',
      subtitle: 'DESK APPROVAL & DIGITAL PASS',
      desc: 'The TARAS registration desk reviews your submitted UTR and payment proof to verify your event registration.',
      icon: <Clock className="w-5 h-5 text-[#dc2626]" />,
      details: [
        'Real-time status updates on your participant dashboard',
        'Instant scannable QR Pass issuance upon verification',
        'Venue gate check-in priority pass unlocked',
      ],
    },
    {
      step: '07',
      title: 'Get Ready',
      subtitle: 'SYMPOSIUM DAY: 10 OCTOBER 2026',
      desc: 'Access your live schedule, venue map, e-certificate wallet, and track announcements as you prepare for TARAS 2K26.',
      icon: <Flag className="w-5 h-5 text-[#dc2626]" />,
      details: [
        'SRM Valliammai Engineering College Campus, Kattankulathur',
        'Digital Pass QR scan at venue entry gate',
        'Live announcements and winner leaderboards',
      ],
    },
  ];

  return (
    <div className="space-y-12 pb-24 font-mono text-slate-100">
      {/* Header Visual Atmosphere */}
      <VisualAtmosphere
        environmentKey="cyberMatrix"
        badgeText="TARAS 2K26 // OFFICIAL PARTICIPANT GUIDANCE"
        title="REGISTRATION GUIDE"
        subtitle="Your journey to TARAS 2K26 starts here. Follow our step-by-step walkthrough to register, form your squad, complete payment, and claim your digital pass."
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        {/* Intro Card with Subtle Spider Web Background Graphic */}
        <div className="relative p-6 sm:p-8 rounded-3xl border-2 border-[#dc2626]/70 bg-gradient-to-br from-[#120404] via-[#07090d] to-[#120404] shadow-[0_0_40px_rgba(220,38,38,0.25)] overflow-hidden">
          {/* Subtle WHITE Spider Web Vector Graphic */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-25 z-0">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full stroke-white fill-none stroke-[0.8]"
            >
              <line x1="100" y1="0" x2="0" y2="100" />
              <line x1="100" y1="0" x2="0" y2="0" />
              <line x1="100" y1="0" x2="100" y2="100" />
              <line x1="100" y1="0" x2="25" y2="50" />
              <line x1="100" y1="0" x2="50" y2="75" />
              <line x1="100" y1="0" x2="75" y2="25" />
              <path d="M100,20 Q80,20 80,0" />
              <path d="M100,40 Q60,40 60,0" />
              <path d="M100,60 Q40,60 40,0" />
              <path d="M100,80 Q20,80 20,0" />
              <circle cx="100" cy="0" r="20" className="stroke-white/40" />
              <circle cx="100" cy="0" r="45" className="stroke-white/30" />
            </svg>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a0000] border border-[#dc2626]/60 text-xs text-[#dc2626] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>7-STEP SYMPOSIUM JOURNEY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              WELCOME TO TARAS 2K26
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl font-light">
              Whether you are competing individually or leading a team of visionaries, TARAS 2K26 provides a streamlined digital registration experience. Review the 7 steps below before beginning.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-4 h-4 text-[#dc2626]" />
                Event Date: <strong className="text-white font-bold">10 October 2026</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Venue: <strong className="text-white font-bold">SRM Valliammai Engineering College</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 7-Step Journey Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#dc2626] uppercase tracking-widest flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              REGISTRATION STEPS WALKTHROUGH
            </h3>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Step 01 to 07
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((s, index) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`p-6 rounded-3xl border bg-[#07090d] transition-all group hover:border-[#dc2626] ${
                  index === steps.length - 1
                    ? 'md:col-span-2 border-[#dc2626]/60 bg-gradient-to-r from-[#120404] via-[#07090d] to-[#120404]'
                    : 'border-slate-800/80 hover:bg-[#0a0c10]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <span className="text-xs font-black text-white bg-[#1a0000] border border-[#dc2626] px-2.5 py-1 rounded-xl shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                      {s.step}
                    </span>
                    <div className="p-2 rounded-xl bg-[#090b10] border border-slate-800 group-hover:border-[#dc2626]/70 mt-2 transition-colors">
                      {s.icon}
                    </div>
                  </div>

                  <div className="space-y-2 min-w-0 flex-1">
                    <div>
                      <span className="text-[9px] text-[#dc2626] font-bold tracking-widest uppercase block">
                        {s.subtitle}
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-[#dc2626] transition-colors">
                        {s.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 font-light leading-relaxed">
                      {s.desc}
                    </p>

                    <ul className="pt-2 border-t border-slate-800/60 space-y-1 text-[11px] text-slate-400 font-light">
                      {s.details.map((d, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Callout Box */}
        <div className="p-8 rounded-3xl border-2 border-[#dc2626] bg-gradient-to-r from-[#1a0000] via-[#090b10] to-[#1a0000] shadow-[0_0_50px_rgba(220,38,38,0.35)] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <span className="text-[10px] text-[#dc2626] font-bold tracking-widest uppercase block mb-1">
              READY TO BECOME A PARTICIPANT?
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              START YOUR TARAS 2K26 REGISTRATION NOW
            </h3>
            <p className="text-xs text-slate-300 mt-1 font-light max-w-xl">
              Create your account in 60 seconds, choose your competition track, and claim your digital pass.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <Link to="/events">
              <Button variant="outline" size="md" className="border-slate-700 hover:border-white">
                View Events
              </Button>
            </Link>
            <Link to="/participant/register">
              <Button variant="glow" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                Register Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
