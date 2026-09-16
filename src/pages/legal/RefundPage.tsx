import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, CreditCard, HelpCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const RefundPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-slate-300">
      {/* Header */}
      <div className="space-y-4 border-b border-[#dc2626]/30 pb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#dc2626]" /> Back to Homepage
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1a0000] border border-[#dc2626]/60 text-[#dc2626]">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#dc2626] uppercase tracking-widest block">
              LEGAL & COMPLIANCE
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono uppercase tracking-tight">
              REFUND & CANCELLATION POLICY
            </h1>
          </div>
        </div>
        <p className="text-xs font-mono text-slate-400">
          Official Payment & Cancellation Guidelines for TARAS 2K26 Registration Fees
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-xs sm:text-sm font-mono leading-relaxed">
        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            1. Registration Fee Structure
          </h3>
          <p className="text-slate-300">
            Registration fees collected for TARAS 2K26 cover symposium venue access, competition materials, merit certificates, and event organization expenses.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            2. Cancellation Policy
          </h3>
          <p className="text-slate-300">
            Due to logistical allocations, venue capacity planning, and pre-event material preparation:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>Registration passes are <strong className="text-white">non-cancellable</strong> once payment proof is verified by the registration desk.</li>
            <li>If a participant is unable to attend due to unforeseen circumstances, they may request a pass transfer to another student from the same institution up to 48 hours prior to the symposium date.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            3. Refund Conditions
          </h3>
          <p className="text-slate-300">
            Refund requests are considered strictly under the following exceptional conditions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#08090d] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Duplicate Payment
              </div>
              <p className="text-xs text-slate-400">
                If a transaction was accidentally debited twice for the same registration ID (with dual UTR records), the duplicate payment will be refunded after verification.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#08090d] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Event Cancellation
              </div>
              <p className="text-xs text-slate-400">
                In the unlikely event of symposium cancellation by institution authority, full registration fees will be refunded to the original account.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-white border-l-2 border-[#dc2626] pl-3 uppercase">
            4. Refund Request Process
          </h3>
          <p className="text-slate-300">
            To request a refund review for duplicate payments, please email <a href="mailto:taras2k26@gmail.com" className="text-[#dc2626] underline">taras2k26@gmail.com</a> with:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>Participant ID & Full Name</li>
            <li>Registration ID (TARAS26-XXXX)</li>
            <li>Bank Transaction Receipts & UTR Numbers</li>
          </ul>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
        <Link to="/security">
          <Button variant="outline" size="sm">
            View Security & Disclosures →
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
