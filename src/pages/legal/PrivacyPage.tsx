import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Database, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-slate-300">
      {/* Header */}
      <div className="space-y-4 border-b border-[#dc2626]/30 pb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#dc2626]" /> Back to Homepage
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1a0000] border border-[#dc2626]/60 text-[#dc2626]">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#dc2626] uppercase tracking-widest block">
              LEGAL & COMPLIANCE
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono uppercase tracking-tight">
              PRIVACY POLICY
            </h1>
          </div>
        </div>
        <p className="text-xs font-mono text-slate-400">
          Last Updated: September 2026 • Official Privacy Disclosure for TARAS 2K26 National Technical Symposium
        </p>
      </div>

      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-[#0a0c10] border border-[#dc2626]/40 space-y-3">
        <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#dc2626]" /> Data Protection Commitment
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
          The Department of Electronics and Communication Engineering (ECE) at SRM Valliammai Engineering College is committed to protecting the privacy of all student participants, faculty, and event attendees of TARAS 2K26. This policy outlines how your personal information is collected, processed, and safeguarded.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-8 text-xs sm:text-sm font-mono leading-relaxed">
        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            1. Information We Collect
          </h3>
          <p className="text-slate-300">
            When you register for TARAS 2K26, create a team, or submit payment details, we collect the following essential participant data:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li><strong className="text-slate-200">Full Name & Contact:</strong> Email address, mobile number.</li>
            <li><strong className="text-slate-200">Academic Details:</strong> Institution/College name, department, and academic year of study.</li>
            <li><strong className="text-slate-200">Event Registrations:</strong> Selected technical presentation tracks, hackathons, and team rosters.</li>
            <li><strong className="text-slate-200">Payment Verification Data:</strong> UTR / Transaction reference numbers and payment proof screenshots uploaded for verification.</li>
            <li><strong className="text-slate-200">Symposium Operations Data:</strong> Venue check-in status, event attendance, and issued e-certificate references.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            2. How Your Information Is Used
          </h3>
          <p className="text-slate-300">
            Collected data is strictly utilized for the legitimate operation of the TARAS 2K26 symposium:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>Generating your unique scannable Digital Pass and QR check-in code.</li>
            <li>Verifying registration payments and confirming track allocation.</li>
            <li>Enabling event coordinators to manage competition hall attendance and scoring.</li>
            <li>Issuing cryptographically verifiable digital merit and participation certificates.</li>
            <li>Sending critical event updates, schedule alterations, or emergency announcements.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            3. Data Storage & Security Controls
          </h3>
          <p className="text-slate-300">
            We implement multi-layered security controls to protect participant records:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#08090d] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Database className="w-4 h-4 text-[#dc2626]" /> Firestore Security Rules
              </div>
              <p className="text-xs text-slate-400">
                Participant data access is strictly isolated. Participants can only view and modify their own registered profile and assigned squad data.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#08090d] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Lock className="w-4 h-4 text-[#dc2626]" /> Storage Protection
              </div>
              <p className="text-xs text-slate-400">
                Payment screenshots and verification assets are uploaded to private bucket storage and accessible only via short-lived signed URL links by authorized staff.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            4. Non-Disclosure & Third Parties
          </h3>
          <p className="text-slate-300">
            TARAS 2K26 does <strong className="text-white">not</strong> sell, rent, lease, or trade participant data to external marketing agencies or commercial third parties. Data is shared exclusively with event venue staff and official college administration for event execution.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            5. Contact Us Regarding Privacy
          </h3>
          <p className="text-slate-300">
            For questions, concerns, or requests regarding your personal data held in the TARAS 2K26 system, please contact:
          </p>
          <div className="p-4 rounded-xl bg-[#0a0c10] border border-slate-800 flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#dc2626]" />
            <div>
              <div className="text-white font-bold">TARAS 2K26 Privacy Desk</div>
              <a href="mailto:taras2k26@gmail.com" className="text-[#dc2626] hover:underline text-xs">
                taras2k26@gmail.com
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
        <Link to="/terms">
          <Button variant="outline" size="sm">
            View Terms of Participation →
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
