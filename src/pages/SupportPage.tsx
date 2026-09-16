import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Mail, MapPin, Phone, MessageSquare, QrCode, Users, CreditCard, Award, ArrowLeft, ChevronDown } from 'lucide-react';
import { Button } from '../components/common/Button';

export const SupportPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const supportTopics = [
    {
      title: 'Registration & Pass',
      icon: <QrCode className="w-5 h-5 text-[#dc2626]" />,
      desc: 'How to register, view your digital pass, and present QR code at venue entry.',
    },
    {
      title: 'Team & Squad Hub',
      icon: <Users className="w-5 h-5 text-[#dc2626]" />,
      desc: 'Creating teams, sharing join codes, accepting team members, or leaving teams.',
    },
    {
      title: 'Payment Verification',
      icon: <CreditCard className="w-5 h-5 text-[#dc2626]" />,
      desc: 'Uploading UTR receipts, payment verification status, and resubmitting proofs.',
    },
    {
      title: 'Certificates & Podium',
      icon: <Award className="w-5 h-5 text-[#dc2626]" />,
      desc: 'Downloading digital certificates, cryptographic verification, and results.',
    },
  ];

  const faqs = [
    {
      q: 'How long does payment proof verification take?',
      a: 'Payment verification typically takes 2 to 6 hours. Once reviewed by the TARAS registration team, your status on the dashboard will update to "Payment Verified", enabling your full event pass.',
    },
    {
      q: 'Can I join multiple event teams?',
      a: 'You can register for multiple event tracks, but you can only belong to one team per specific event track (e.g., one Paper Presentation team).',
    },
    {
      q: 'What should I bring on event day?',
      a: 'Bring your physical college student ID card and your mobile device displaying your TARAS Digital QR Pass.',
    },
    {
      q: 'What if my payment proof is rejected?',
      a: 'If rejected, check your participant dashboard for the rejection note. You can immediately upload a corrected UTR receipt without needing to re-register.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-slate-300">
      {/* Header */}
      <div className="space-y-4 border-b border-[#dc2626]/30 pb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#dc2626]" /> Back to Homepage
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1a0000] border border-[#dc2626]/60 text-[#dc2626]">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#dc2626] uppercase tracking-widest block">
              PARTICIPANT ASSISTANCE
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono uppercase tracking-tight">
              HELP & SUPPORT CENTER
            </h1>
          </div>
        </div>
        <p className="text-xs font-mono text-slate-400">
          Get assistance with registrations, teams, payments, schedule, or venue instructions for TARAS 2K26.
        </p>
      </div>

      {/* Support Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {supportTopics.map((topic, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#0a0c10] border border-slate-800 hover:border-[#dc2626]/60 transition-all space-y-3"
          >
            <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#dc2626]/40 w-fit">
              {topic.icon}
            </div>
            <h3 className="font-mono text-sm font-bold text-white">{topic.title}</h3>
            <p className="font-mono text-xs text-slate-400 leading-relaxed">{topic.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Contacts */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08090d] border border-[#dc2626]/40 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-[#dc2626] uppercase tracking-widest font-bold">DIRECT CONTACT CHANNELS</span>
          <h2 className="text-xl font-black text-white font-mono uppercase">NEED IMMEDIATE HELP?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[#0a0c10] border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-[#dc2626] font-bold">
              <Mail className="w-4 h-4" /> Registration Email
            </div>
            <a href="mailto:taras2k26@gmail.com" className="text-slate-200 hover:underline block">
              taras2k26@gmail.com
            </a>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0c10] border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-[#dc2626] font-bold">
              <MapPin className="w-4 h-4" /> Symposium Venue
            </div>
            <span className="text-slate-200 block">
              SRM Valliammai Engineering College, Kattankulathur
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0c10] border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-[#dc2626] font-bold">
              <Phone className="w-4 h-4" /> Desk Operating Hours
            </div>
            <span className="text-slate-200 block">
              Mon–Sat: 8:30 AM – 4:30 PM
            </span>
          </div>
        </div>
      </div>

      {/* Accordion FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white font-mono uppercase border-b border-slate-800 pb-3">
          FREQUENTLY ASKED QUESTIONS
        </h2>

        <div className="space-y-3 font-mono">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#0a0c10] border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-white hover:text-[#dc2626] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#dc2626]' : 'text-slate-500'}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Nav */}
      <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
        <Link to="/faq">
          <Button variant="outline" size="sm">
            Full Categorized FAQ →
          </Button>
        </Link>
        <Link to="/">
          <Button variant="glow" size="sm">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
