import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSuccessMessage('Password reset link sent to your registered email address.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="ACCOUNT RECOVERY"
        title="FORGOT PASSWORD"
        subtitle="Enter your registered participant email address to receive a secure password reset link."
        height="compact"
      />

      <div className="max-w-md mx-auto px-4 sm:px-6">
        <div className="glass-panel-glow p-6 sm:p-8 rounded-2xl border border-[#b91c1c]/40 shadow-2xl space-y-6">
          {successMessage ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#b91c1c] mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-white font-mono">EMAIL SENT</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">{successMessage}</p>
              <Link to="/participant/login">
                <Button variant="outline" size="sm" className="mt-4" icon={<ArrowLeft className="w-4 h-4" />}>
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[#1a0000]/80 border border-[#b91c1c] text-xs text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Participant Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                  <input
                    type="email"
                    required
                    placeholder="your.email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors"
                  />
                </div>
              </div>

              <Button
                variant="glow"
                size="md"
                type="submit"
                disabled={isSubmitting}
                className="w-full justify-center"
              >
                {isSubmitting ? 'Sending Link…' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
            <Link to="/participant/login" className="inline-flex items-center gap-1 font-bold text-[#b91c1c] hover:underline font-mono">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
