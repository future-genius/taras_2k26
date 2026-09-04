import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { X, ArrowRight, Shield, LogOut } from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: { name: string; path: string }[];
  onRegister: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, links, onRegister }) => {
  const location = useLocation();
  const { user, participantProfile, logout } = useAuth();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
    exit: { opacity: 0 },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { ease: [0.23, 1, 0.32, 1] as [number, number, number, number], duration: 0.35 } },
    exit: { opacity: 0, x: -12 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-nav"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[#050608]/98 backdrop-blur-2xl flex flex-col"
          aria-modal="true"
          role="dialog"
          aria-label="Mobile navigation"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a0000]/80">
            <Link to="/" className="flex items-center gap-2" onClick={onClose}>
              <div className="w-8 h-8 rounded-xl bg-[#050608] border border-[#7f1d1d]/60 flex items-center justify-center overflow-hidden">
                <img
                  src="/taras-logo.png"
                  alt="TARAS 2K26"
                  className="w-full h-full object-contain p-0.5"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <span className="text-lg font-black font-mono text-white">
                TARAS<span className="text-[#b91c1c]">2K26</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a0000] border border-transparent hover:border-[#3f0000] transition-colors"
              aria-label="Close mobile menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <motion.nav
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 overflow-y-auto px-6 py-6 space-y-1"
            aria-label="Mobile navigation links"
          >
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <motion.div key={link.path} variants={itemVariants}>
                  <Link
                    to={link.path}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium font-mono transition-all ${
                      isActive
                        ? 'bg-[#1a0000] text-white border-l-2 border-[#b91c1c] pl-5'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{link.name.toUpperCase()}</span>
                    {isActive && <ArrowRight className="w-4 h-4 text-[#b91c1c]" />}
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>

          {/* Bottom CTA */}
          <div className="px-6 py-6 border-t border-[#1a0000]/80 space-y-3">
            {user || participantProfile ? (
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center text-xs font-mono text-red-400 border-red-900/60 hover:bg-red-950/40"
                icon={<LogOut className="w-4 h-4 text-red-500" />}
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                Sign Out of TARAS
              </Button>
            ) : (
              <Button
                variant="glow"
                size="md"
                className="w-full justify-center"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => { onRegister(); onClose(); }}
              >
                Register Participant Pass
              </Button>
            )}
            <p className="text-center text-[10px] font-mono text-slate-600">
              26 SEPTEMBER 2026 • SRM VALLIAMMAI
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
