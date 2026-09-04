import React from 'react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Mail, Phone, MapPin, Send, Shield } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you! The TARAS 2K26 Help Desk will respond within 24 hours.');
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Level 1 & 2 Final Cinematic Portal Environment */}
      <VisualAtmosphere
        environmentKey="contact"
        badgeText="GET IN TOUCH"
        title="CONTACT & ENQUIRIES"
        subtitle="Need assistance with event registration, paper submissions, or campus navigation?"
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-5">
            <div className="glass-panel-glow rounded-xl p-6 border border-[#b91c1c]/40 space-y-4 shadow-lg">
              <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2 border-b border-white/10 pb-3">
                <Shield className="w-5 h-5 text-[#b91c1c]" /> Executive Contacts
              </h3>
              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div>
                  <strong className="text-white block font-mono text-sm">Faculty Convener</strong>
                  <span>Dr. G. Uresh Kumar (Associate Professor, Dept of ECE)</span>
                  <div className="flex items-center gap-2 text-[#b91c1c] mt-1 font-mono">
                    <Mail className="w-3.5 h-3.5" /> ureshkumar.ece@valliammai.edu.in
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <strong className="text-white block font-mono text-sm">Student Council President</strong>
                  <span>R. Kirthivasan (Final Year ECE)</span>
                  <div className="flex items-center gap-2 text-[#b91c1c] mt-1 font-mono">
                    <Phone className="w-3.5 h-3.5" /> +91 98401 23456
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <strong className="text-white block font-mono text-sm">Student Council Vice President</strong>
                  <span>V. Siddharth (Final Year ECE)</span>
                  <div className="flex items-center gap-2 text-[#b91c1c] mt-1 font-mono">
                    <Phone className="w-3.5 h-3.5" /> +91 97908 11223
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-5 border border-[#b91c1c]/30 space-y-2">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#b91c1c]" /> Campus Address
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                Department of Electronics and Communication Engineering,<br />
                SRM Valliammai Engineering College,<br />
                Kattankulathur, Chengalpattu – 603203.
              </p>
            </div>
          </div>

          {/* Enquiry Form */}
          <div className="glass-panel-glow rounded-xl p-6 border border-[#b91c1c]/40 shadow-xl">
            <h3 className="text-xl font-bold text-white font-mono mb-1">Send an Enquiry</h3>
            <p className="text-xs text-slate-400 mb-6">We respond within 24 hours.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Full Name', type: 'text', placeholder: 'Your full name' },
                { label: 'Email Address', type: 'email', placeholder: 'your.email@domain.com' },
                { label: 'College & Department', type: 'text', placeholder: 'e.g. SRM Valliammai - ECE' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{f.label}</label>
                  <input
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we assist you?"
                  className="w-full px-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors resize-none"
                />
              </div>
              <Button variant="glow" size="md" className="w-full justify-center" icon={<Send className="w-4 h-4" />}>
                Submit Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
