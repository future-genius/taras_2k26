import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Command, Radio } from 'lucide-react';
import { MobileNav } from './MobileNav';
import { HeaderUserMenu } from './ParticipantNav';
import { LiveModeToggleBtn } from '../visual/LiveModeToggle';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenRegistrationPlaceholder: () => void;
  onOpenPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRegistrationPlaceholder,
  onOpenPalette,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, participantProfile } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Timeline', path: '/timeline' },
    { name: 'About', path: '/about' },
    { name: 'Team', path: '/team' },
    { name: 'Rules', path: '/rules' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Venue', path: '/venue' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050608]/95 backdrop-blur-xl border-b border-[#2a0808]/80 py-2.5 shadow-2xl shadow-black/90'
            : 'bg-gradient-to-b from-[#050608]/95 via-[#050608]/40 to-transparent py-3 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* TARAS Cyber Spider Shield Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative p-[2px] rounded-2xl bg-gradient-to-tr from-[#dc2626] via-[#ff3333] to-[#7f1d1d] shadow-[0_0_20px_rgba(220,38,38,0.5)] group-hover:shadow-[0_0_35px_rgba(220,38,38,0.95)] group-hover:scale-105 transition-all duration-500 shrink-0">
              <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-[#07090d] border border-[#dc2626]/60 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#b91c1c]/20 via-transparent to-black pointer-events-none" />
                <img
                  src="/taras-logo.png"
                  alt="TARAS 2K26 Logo"
                  className="w-full h-full object-cover group-hover:rotate-3 transition-transform duration-500 relative z-10"
                  loading="eager"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bebas text-2xl tracking-wider text-white">
                  TARAS <span className="text-[#dc2626] drop-shadow-[0_0_12px_rgba(220,38,38,0.6)]">2K26</span>
                </span>
              </div>
              <span className="font-mono-tech text-[8px] sm:text-[8.5px] font-bold tracking-[0.22em] text-slate-400 uppercase mt-0.5">
                TECHNOLOGY MEETS TOMORROW
              </span>
            </div>
          </Link>

          {/* ── Center: Desktop Navigation Links ──────────────────── */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7" aria-label="Main navigation">
            {navLinks.slice(0, 7).map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-1 text-xs font-semibold tracking-wider font-oswald uppercase transition-all duration-200 hover:-translate-y-0.5 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {link.name}
                  {/* Red active underline indicator bar */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#dc2626] rounded-full shadow-[0_0_10px_#dc2626] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right: Operations & Auth Action Bar ──────────────── */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Cmd+K Quick Search palette */}
            <button
              onClick={onOpenPalette}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#0a0c10]/90 text-slate-400 hover:text-white hover:border-[#dc2626]/60 text-xs font-mono transition-all shrink-0"
              aria-label="Open command palette"
              title="Quick Command Palette (Ctrl+K / Cmd+K)"
            >
              <Command className="w-3 h-3 text-slate-500" />
              <span>K</span>
            </button>

            {/* TARAS Live Mode Toggle */}
            <div className="shrink-0">
              <LiveModeToggleBtn />
            </div>

            {/* Live indicator → Announcements */}
            <Link
              to="/announcements"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a0000]/60 border border-[#dc2626]/40 text-xs font-mono font-bold text-[#dc2626] hover:text-white hover:border-[#dc2626] transition-all shrink-0"
              title="Live Announcements & Dispatches"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dc2626] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#dc2626]" />
              </span>
              <span>Live</span>
            </Link>

            {/* Participant Profile / Avatar or Login / Register */}
            {user || participantProfile ? (
              <HeaderUserMenu />
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/participant/login"
                  className="px-4 py-1.5 rounded-full text-xs font-mono font-bold text-slate-200 bg-[#12141a]/90 hover:bg-[#1c202a] border border-slate-700 hover:border-slate-500 transition-all backdrop-blur-md"
                >
                  Login
                </Link>
                <Link
                  to="/participant/register"
                  className="px-4 py-1.5 rounded-full text-xs font-mono font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Corner Stylized Tagline (visible on xl and up) */}
            <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-800/80 shrink-0">
              <div className="flex flex-col text-right text-[7.5px] font-mono-tech leading-tight font-bold text-slate-400 uppercase tracking-widest">
                <span>STUDENTS</span>
                <span>IDEAS</span>
                <span className="text-slate-300">IMPACT</span>
              </div>
              <div className="flex items-center text-[#dc2626] font-bold text-xs tracking-tighter opacity-80 select-none">
                ///
              </div>
            </div>
          </div>

          {/* ── Mobile Hamburger & Quick Controls ────────────────── */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onOpenPalette}
              className="p-1.5 rounded-lg border border-slate-800 bg-[#0a0c10] text-slate-400 hover:text-white text-xs font-mono"
            >
              <Command className="w-3.5 h-3.5" />
            </button>
            {!user && (
              <Link
                to="/participant/register"
                className="px-3 py-1.5 rounded-full text-xs font-mono font-bold text-white bg-[#dc2626] shadow-md shadow-red-900/40"
              >
                Register
              </Link>
            )}
            {user && <HeaderUserMenu />}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-[#0a0c10] border border-slate-800 hover:border-[#dc2626] transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Navigation */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={navLinks}
        onRegister={onOpenRegistrationPlaceholder}
      />
    </>
  );
};
