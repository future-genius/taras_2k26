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
              <span>Event Date: 26 SEPTEMBER 2026</span>
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
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { to: '/rules', label: 'Rules & Regulations' },
                { to: '/faq', label: 'Categorized FAQ' },
                { to: '/venue', label: 'Campus Map & Directions' },
                { to: '/results', label: 'Symposium Podium' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-[#991b1b] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Desk */}
          <div>
            <h4 className="text-slate-300 font-bold text-xs tracking-wider uppercase mb-4 border-l-2 border-[#3f0000] pl-2">
              Help Desk
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#7f1d1d] shrink-0 mt-0.5" />
                <span>SRM Valliammai Engineering College, Kattankulathur – 603203</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#7f1d1d] shrink-0" />
                <span>taras2k26@gmail.com</span>
              </li>
              <li>
                <a
                  href="https://srmvalliammai.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#7f1d1d] hover:text-[#991b1b] text-xs transition-colors"
                >
                  <span>Official College Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>© 2026 TARAS 2K26 • Department of ECE, SRM Valliammai. All rights reserved.</p>
          <div className="flex items-center gap-1 font-mono">
            <span>Built for</span>
            <span className="text-[#7f1d1d] font-semibold">TARAS 2K26</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
