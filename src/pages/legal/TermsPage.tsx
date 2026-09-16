import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldAlert, CheckCircle2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-slate-300">
      {/* Header */}
      <div className="space-y-4 border-b border-[#dc2626]/30 pb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#dc2626]" /> Back to Homepage
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1a0000] border border-[#dc2626]/60 text-[#dc2626]">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#dc2626] uppercase tracking-widest block">
              LEGAL & COMPLIANCE
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono uppercase tracking-tight">
              TERMS & CONDITIONS
            </h1>
          </div>
        </div>
        <p className="text-xs font-mono text-slate-400">
          Official Terms of Participation for TARAS 2K26 National Level Technical Symposium
        </p>
      </div>

      {/* Terms Sections */}
      <div className="space-y-8 text-xs sm:text-sm font-mono leading-relaxed">
        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            1. Eligibility & Registration
          </h3>
          <p className="text-slate-300">
            Participation in TARAS 2K26 is open to undergraduate and postgraduate engineering and technology students possessing valid college identification.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>Participants must register using accurate contact details and valid student credentials.</li>
            <li>Each participant must present a valid college physical ID card alongside their digital QR pass at venue entry.</li>
            <li>Registration passes are non-transferable between students without prior authorization from the registration desk.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            2. Event Rules & Team Formation
          </h3>
          <p className="text-slate-300">
            Competitions strictly adhere to the specific rules posted on the event details page:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>Team events require a designated team leader who manages squad invitations and updates.</li>
            <li>Participants may only join one team per event track. Attempting to enter multiple teams for the same competition track is prohibited.</li>
            <li>Plagiarism or submission of pre-existing commercial projects in paper presentations or hackathons will result in immediate disqualification.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            3. Code of Conduct & Venue Discipline
          </h3>
          <p className="text-slate-300">
            All participants are expected to maintain professional conduct on the SRM Valliammai Engineering College campus:
          </p>
          <div className="p-4 rounded-xl bg-[#0a0c10] border border-amber-500/40 text-amber-200/90 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-bold block mb-1">Campus Discipline Policy</strong>
              Misconduct, damage to lab property, unauthorized access to restricted department areas, or non-compliance with staff instructions will lead to pass revocation and reporting to institution authorities.
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            4. Certificates & Verification
          </h3>
          <p className="text-slate-300">
            Official E-certificates are issued digitally following event evaluation:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>Participation certificates are awarded only to participants who complete physical venue check-in and attend their registered event hall.</li>
            <li>Certificates contain a cryptographic QR code readable at <strong className="text-white">/verify</strong>. Tampering with client-side certificate data renders credentials invalid.</li>
          </ul>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
        <Link to="/refund-policy">
          <Button variant="outline" size="sm">
            View Refund Policy →
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
