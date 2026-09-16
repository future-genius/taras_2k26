import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  X,
  ArrowRight,
  Shield,
  LogOut,
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  QrCode,
  Award,
  Radio,
  Clock,
  HelpCircle,
  User,
  Compass,
  FileText,
  MapPin,
  Image,
  Mail,
  LogIn,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: { name: string; path: string }[];
  onRegister: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const { user, participantProfile, role, logout } = useAuth();

  // 1. Close mobile drawer on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Lock body scroll when drawer is active & handle browser back/forward buttons
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handlePopState = () => onClose();
      window.addEventListener('popstate', handlePopState);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('popstate', handlePopState);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  const userRole = (role || participantProfile?.role || '').toLowerCase();
  const isAdminOrStaff = [
    'admin',
    'super_admin',
    'president',
    'staff',
    'registration_staff',
    'registration_team',
    'coordinator',
    'event_head',
  ].includes(userRole);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.05 },
    },
    exit: { opacity: 0 },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -14 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { ease: [0.23, 1, 0.32, 1], duration: 0.25 },
    },
    exit: { opacity: 0, x: -10 },
  };

  // Public Navigation Items (Shown on ALL pages)
  const publicNavItems = [
    { name: 'Home', path: '/', icon: <Compass className="w-4 h-4 text-slate-400" /> },
    { name: 'Events Hub', path: '/events', icon: <Calendar className="w-4 h-4 text-slate-400" /> },
    { name: 'Registration Guide', path: '/registration-guide', icon: <HelpCircle className="w-4 h-4 text-[#dc2626]" /> },
    { name: 'Symposium Timeline', path: '/timeline', icon: <Clock className="w-4 h-4 text-slate-400" /> },
    { name: 'About ECE Department', path: '/about', icon: <FileText className="w-4 h-4 text-slate-400" /> },
    { name: 'Organizing Team', path: '/team', icon: <Users className="w-4 h-4 text-slate-400" /> },
    { name: 'Rules & Regulations', path: '/rules', icon: <Shield className="w-4 h-4 text-slate-400" /> },
    { name: 'Categorized FAQ', path: '/faq', icon: <HelpCircle className="w-4 h-4 text-slate-400" /> },
    { name: 'Venue & Directions', path: '/venue', icon: <MapPin className="w-4 h-4 text-slate-400" /> },
    { name: 'Gallery & Media', path: '/gallery', icon: <Image className="w-4 h-4 text-slate-400" /> },
    { name: 'Contact Desk', path: '/contact', icon: <Mail className="w-4 h-4 text-slate-400" /> },
  ];

  // Logged-in Participant Items
  const participantNavItems = [
    { name: 'Dashboard Terminal', path: '/participant/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-[#dc2626]" /> },
    { name: 'My Registered Events', path: '/participant/my-events', icon: <Calendar className="w-4 h-4 text-[#dc2626]" /> },
    { name: 'My Squads & Teams', path: '/participant/dashboard#my-squads-section', icon: <Users className="w-4 h-4 text-[#dc2626]" /> },
    { name: 'Digital Pass QR', path: '/participant/pass', icon: <QrCode className="w-4 h-4 text-[#dc2626]" /> },
    { name: 'My E-Certificates', path: '/participant/dashboard#my-certificates-section', icon: <Award className="w-4 h-4 text-[#dc2626]" /> },
    { name: 'Live Announcements', path: '/announcements', icon: <Radio className="w-4 h-4 text-[#dc2626]" /> },
    { name: 'Help & Support', path: '/support', icon: <HelpCircle className="w-4 h-4 text-[#dc2626]" /> },
    { name: 'Account Profile', path: '/participant/profile', icon: <User className="w-4 h-4 text-[#dc2626]" /> },
  ];

  // Admin / Staff / Coordinator Nav Items
  const staffNavItems = [
    { name: 'Staff Operational Desk', path: '/staff/dashboard', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
    { name: 'Registration Desk Terminal', path: '/registration', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    { name: 'Coordinator Terminal', path: '/coordinator/dashboard', icon: <Compass className="w-4 h-4 text-amber-400" /> },
    { name: 'Executive Admin Dashboard', path: '/admin/dashboard', icon: <Shield className="w-4 h-4 text-red-500" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-nav-drawer"
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-[#07080b] flex flex-col overflow-hidden max-w-full font-mono text-slate-200"
          style={{
            backgroundImage: 'radial-gradient(circle at 75% 25%, rgba(185, 28, 28, 0.12), transparent 60%)',
          }}
          aria-modal="true"
          role="dialog"
          aria-label="Mobile Navigation Menu"
        >
          {/* Top Bar Header (Logo Left, Red Close Button Right) */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#dc2626]/25 bg-[#07080b]/95 shrink-0 relative z-10">
            <Link to="/" className="flex items-center gap-3" onClick={onClose}>
              <div className="relative p-[1.5px] rounded-xl bg-gradient-to-tr from-[#dc2626] via-[#ff3333] to-[#7f1d1d] shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                <div className="w-8 h-8 rounded-[10px] bg-[#07090d] border border-[#dc2626]/70 flex items-center justify-center overflow-hidden">
                  <img
                    src="/taras-logo.png"
                    alt="TARAS 2K26 Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-white leading-none">
                  TARAS<span className="text-[#dc2626]">2K26</span>
                </span>
                <span className="text-[8px] text-slate-400 tracking-wider uppercase mt-0.5">
                  SRM VALLIAMMAI ECE
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#140404] border border-[#dc2626]/60 text-slate-300 hover:text-white hover:border-[#dc2626] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-[#dc2626]" />
            </button>
          </div>

          {/* User Profile Header (If Logged In) */}
          {(user || participantProfile) && (
            <div className="px-5 py-3 bg-[#110404] border-b border-[#dc2626]/30 flex items-center justify-between shrink-0 gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#1a0000] border border-[#dc2626] flex items-center justify-center text-[#dc2626] font-bold text-xs shrink-0">
                  {participantProfile?.fullName?.charAt(0) || 'P'}
                </div>
                <div className="truncate min-w-0 flex-1">
                  <span className="text-xs font-bold text-white block truncate">
                    {participantProfile?.fullName || user?.email}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    ID: <strong className="text-[#dc2626]">{participantProfile?.participantId || 'STAFF'}</strong> • {userRole.toUpperCase()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1a0000] border border-red-600/80 text-red-400 hover:bg-red-900/60 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 shrink-0"
                title="Sign Out of TARAS"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* Nav Links Body */}
          <motion.nav
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 overflow-y-auto px-4 py-4 space-y-6"
            aria-label="Mobile Navigation Options"
          >
            {/* 1. Logged-in Participant Terminal Links */}
            {(user || participantProfile) && (
              <div className="space-y-1">
                <span className="text-[10px] text-[#dc2626] font-bold uppercase tracking-widest px-3 block pb-1.5">
                  PARTICIPANT TERMINAL & SERVICES
                </span>
                {participantNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.div key={item.path} variants={itemVariants}>
                      <Link
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-[#1a0000] text-white border-l-2 border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                            : 'text-slate-300 hover:text-white hover:bg-[#120404] border border-transparent hover:border-[#dc2626]/30'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          {item.icon}
                          <span>{item.name}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* 2. Admin / Staff Terminals (If user has operational role) */}
            {isAdminOrStaff && (
              <div className="space-y-1 pt-2 border-t border-[#dc2626]/20">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest px-3 block pb-1.5">
                  STAFF & ADMIN TERMINALS
                </span>
                {staffNavItems.map((item) => (
                  <motion.div key={item.path} variants={itemVariants}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#0c0d12] border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white transition-all"
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 3. SYMPOSIUM EXPLORATION (Always visible on all pages!) */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3 block pb-1.5">
                SYMPOSIUM EXPLORATION
              </span>
              {publicNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div key={item.path} variants={itemVariants}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#1a0000] text-white border-l-2 border-[#dc2626]'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* 4. LEGAL & POLICIES */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3 block pb-1">
                LEGAL & POLICIES
              </span>
              {[
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Terms of Participation', path: '/terms' },
                { name: 'Refund Policy', path: '/refund-policy' },
                { name: 'Security Disclosures', path: '/security' },
              ].map((policy) => (
                <Link
                  key={policy.path}
                  to={policy.path}
                  onClick={onClose}
                  className="block px-3.5 py-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  {policy.name}
                </Link>
              ))}
            </div>
          </motion.nav>

          {/* Bottom Action Bar (Identical to user's reference screenshot) */}
          <div className="px-4 py-4 border-t border-[#dc2626]/30 bg-[#07080b] space-y-3 shrink-0 pb-6">
            {user || participantProfile ? (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/participant/pass" onClick={onClose} className="w-full">
                  <button className="w-full py-3 px-4 rounded-xl bg-[#100404] border border-slate-700 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#1a0000] transition-colors">
                    <QrCode className="w-4 h-4 text-[#dc2626]" />
                    <span>Pass QR</span>
                  </button>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#b91c1c] hover:bg-[#dc2626] text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(185,28,28,0.5)]"
                >
                  <LogOut className="w-4 h-4 text-white" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/participant/login" onClick={onClose} className="w-full">
                  <button className="w-full py-3 px-4 rounded-xl bg-[#100404] border border-slate-700 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#1a0000] transition-colors">
                    <LogIn className="w-4 h-4 text-slate-300" />
                    <span>Login</span>
                  </button>
                </Link>
                <Link to="/participant/register" onClick={onClose} className="w-full">
                  <button className="w-full py-3 px-4 rounded-xl bg-[#b91c1c] hover:bg-[#dc2626] text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(185,28,28,0.5)]">
                    <UserPlus className="w-4 h-4 text-white" />
                    <span>Register</span>
                  </button>
                </Link>
              </div>
            )}

            <p className="text-center text-[9.5px] text-slate-400 font-mono">
              EVENT DATE: <strong className="text-white">10 OCTOBER 2026</strong> • SRM VALLIAMMAI
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
