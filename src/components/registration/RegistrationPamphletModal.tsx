import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  Shield,
  UserPlus,
  Trophy,
  Users,
  Share2,
  CreditCard,
  Clock,
  Flag,
} from 'lucide-react';
import { Button } from '../common/Button';

export const RegistrationPamphletModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsOpen(false);
  };

  // Lock background page body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Keyboard accessibility: ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const journeySteps = [
    {
      step: '01',
      title: 'Register Yourself',
      desc: 'Create your participant account and enter your details.',
      icon: <UserPlus className="w-4 h-4 text-[#dc2626]" />,
    },
    {
      step: '02',
      title: 'Choose Your Event',
      desc: 'Select the competition event you want to participate in.',
      icon: <Trophy className="w-4 h-4 text-[#dc2626]" />,
    },
    {
      step: '03',
      title: 'Create a Team',
      desc: 'Create a team if your event requires a squad.',
      icon: <Users className="w-4 h-4 text-[#dc2626]" />,
    },
    {
      step: '04',
      title: 'Invite Your Friends',
      desc: 'Share your team code so your teammates can join.',
      icon: <Share2 className="w-4 h-4 text-[#dc2626]" />,
    },
    {
      step: '05',
      title: 'Complete Payment',
      desc: 'Submit the registration fee and upload valid payment proof.',
      icon: <CreditCard className="w-4 h-4 text-[#dc2626]" />,
    },
    {
      step: '06',
      title: 'Get Verified',
      desc: 'Wait for the TARAS registration desk to verify your payment.',
      icon: <Clock className="w-4 h-4 text-[#dc2626]" />,
    },
    {
      step: '07',
      title: 'Get Ready',
      desc: 'Check your dashboard for digital QR pass, schedule, and venue updates.',
      icon: <Flag className="w-4 h-4 text-[#dc2626]" />,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        {/* Backdrop Overlay — Solid Opaque Dark Red/Black so background page text NEVER bleeds through */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-[#090404]/96 backdrop-blur-md z-0"
        />

        {/* Modal Window Container (92-95% of mobile viewport width, max 560px desktop) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          style={{ width: 'min(94vw, 560px)', maxHeight: 'min(86vh, 720px)' }}
          className="relative flex flex-col bg-[#07090d] border-2 border-[#dc2626] rounded-3xl shadow-[0_0_60px_rgba(220,38,38,0.45)] overflow-hidden z-10 text-slate-200 font-mono"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pamphlet-modal-title"
        >
          {/* ── Realistic WHITE Spider-Web Vector Graphic: Top-Right Corner ── */}
          <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-35 z-0">
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
              <line x1="100" y1="0" x2="50" y2="25" />
              <path d="M100,20 Q80,20 80,0" />
              <path d="M100,40 Q60,40 60,0" />
              <path d="M100,60 Q40,60 40,0" />
              <path d="M100,80 Q20,80 20,0" />
              <path d="M100,100 Q0,100 0,0" />
              <circle cx="100" cy="0" r="18" className="stroke-white/40" />
              <circle cx="100" cy="0" r="38" className="stroke-white/30" />
              <circle cx="100" cy="0" r="62" className="stroke-white/20" />
            </svg>
          </div>

          {/* ── Secondary WHITE Spider-Web Graphic: Bottom-Left Corner ── */}
          <div className="absolute bottom-0 left-0 w-28 h-28 pointer-events-none opacity-20 rotate-180 z-0">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full stroke-white fill-none stroke-[0.75]"
            >
              <line x1="100" y1="0" x2="0" y2="100" />
              <line x1="100" y1="0" x2="0" y2="0" />
              <line x1="100" y1="0" x2="100" y2="100" />
              <path d="M100,30 Q70,30 70,0" />
              <path d="M100,60 Q40,60 40,0" />
              <path d="M100,90 Q10,90 10,0" />
            </svg>
          </div>

          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#dc2626]/30 bg-[#07090d]/95 shrink-0 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 rounded-xl bg-[#1a0000] border border-[#dc2626]/70 text-[#dc2626] shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[8.5px] sm:text-[9px] font-bold text-[#dc2626] uppercase tracking-widest block leading-tight">
                  TARAS 2K26 OFFICIAL GUIDANCE
                </span>
                <h2
                  id="pamphlet-modal-title"
                  className="text-xs sm:text-sm font-black text-white uppercase tracking-tight leading-tight block"
                >
                  HOW TO REGISTER
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-[#1a0000] border border-transparent hover:border-[#dc2626]/50 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-[#dc2626]" />
            </button>
          </div>

          {/* Modal Body — Internal Scrollable Journey Steps List (NO TRUNCATION!) */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3 relative z-10 flex-1">
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Welcome to <strong className="text-white">TARAS 2K26</strong>! Follow this simple 7-step guide to complete your registration, form your squad, and get ready to compete.
            </p>

            <div className="space-y-2">
              {journeySteps.map((s) => (
                <div
                  key={s.step}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-[#090b10] border border-slate-800/90 hover:border-[#dc2626]/50 transition-all group"
                >
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <span className="text-[10px] font-bold text-[#dc2626] bg-[#1a0000] border border-[#dc2626]/40 px-2 py-0.5 rounded-md mb-1">
                      {s.step}
                    </span>
                    <div className="p-1.5 rounded-lg bg-[#07090d] border border-slate-800 group-hover:border-[#dc2626]/60">
                      {s.icon}
                    </div>
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-white group-hover:text-[#dc2626] transition-colors leading-snug">
                      {s.title}
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-normal font-light break-words">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-[#dc2626]/30 bg-[#07090d]/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-10 pb-5 sm:pb-4">
            <span className="text-[10px] text-slate-400 font-mono text-center sm:text-left">
              EVENT DATE: <strong className="text-white">10 OCTOBER 2026</strong> • SRM VALLIAMMAI
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="w-full sm:w-auto justify-center text-xs border-slate-800 hover:border-slate-600 min-h-[42px] sm:min-h-0"
              >
                Maybe Later / Close
              </Button>
              <Button
                variant="glow"
                size="sm"
                onClick={() => {
                  handleClose();
                  navigate('/participant/register');
                }}
                icon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto justify-center text-xs font-bold min-h-[42px] sm:min-h-0"
              >
                Register Now
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
