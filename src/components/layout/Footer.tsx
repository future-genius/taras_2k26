import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#050608] border-t border-[#1a0000]/70 pt-16 pb-12 overflow-hidden text-slate-500 text-sm">
      {/* Web grid background */}
      <div className="absolute inset-0 bg-web-grid opacity-20 pointer-events-none" />
      {/* Top dark red accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#7f1d1d]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#0a0c10]">

          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#050608] border border-[#3f0000]/50 shadow-lg overflow-hidden">
                <img
                  src="/taras-logo.png"
                  alt="TARAS 2K26"
                  className="w-full h-full object-contain p-0.5"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xl font-black tracking-widest text-white font-mono">
                TARAS<span className="text-[#b91c1c]">2K26</span>
              </span>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed pr-4">
              Annual National-Level Technical Symposium organized by the Department of Electronics and Communication Engineering at SRM Valliammai Engineering College, Kattankulathur.
            </p>

            <div className="flex items-center gap-2 text-xs font-mono text-[#991b1b] bg-[#0a0c10] border border-[#1a0000]/60 px-3 py-2 rounded-lg w-fit">
              <span>Event Date: 10 OCTOBER 2026</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-300 font-bold text-xs tracking-wider uppercase mb-4 border-l-2 border-[#3f0000] pl-2">
              Exploration
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { to: '/events', label: 'Events Hub' },
                { to: '/timeline', label: 'Symposium Timeline' },
                { to: '/about', label: 'About ECE Department' },
                { to: '/team', label: 'Organizing Roster' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-[#dc2626] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-slate-300 font-bold text-xs tracking-wider uppercase mb-4 border-l-2 border-[#3f0000] pl-2">
              Resources & Support
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { to: '/rules', label: 'Rules & Regulations' },
                { to: '/faq', label: 'Categorized FAQ' },
                { to: '/support', label: 'Help & Support Center' },
                { to: '/venue', label: 'Campus Map & Directions' },
                { to: '/results', label: 'Symposium Podium' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-[#dc2626] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Desk & Legal */}
          <div>
            <h4 className="text-slate-300 font-bold text-xs tracking-wider uppercase mb-4 border-l-2 border-[#3f0000] pl-2">
              Legal & Contact
            </h4>
            <ul className="space-y-2.5 text-xs mb-3">
              {[
                { to: '/privacy', label: 'Privacy Policy' },
                { to: '/terms', label: 'Terms of Participation' },
                { to: '/refund-policy', label: 'Refund Policy' },
                { to: '/security', label: 'Security & Disclosures' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-[#dc2626] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-2 text-xs pt-2 border-t border-[#1a0000]">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#dc2626] shrink-0" />
                <span>taras2k26@gmail.com</span>
              </li>
              <li>
                <a
                  href="https://srmvalliammai.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#dc2626] hover:underline text-xs transition-colors"
                >
                  <span>SRM Valliammai Official Site</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 TARAS 2K26 • Dept. of ECE, SRM Valliammai Engineering College.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-400">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
            <span>•</span>
            <Link to="/security" className="hover:text-white transition-colors">Security</Link>
            <span>•</span>
            <Link to="/support" className="hover:text-white transition-colors">Support Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
