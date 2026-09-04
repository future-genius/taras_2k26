import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/participant/dashboard';

  /** Map a canonical Firestore role string to the correct dashboard route */
  const getDefaultRoute = (role: string, fallback: string): string => {
    const r = role.toLowerCase();
    if (r === 'super_admin' || r === 'president') return '/admin/dashboard';
    if (r === 'admin') return '/admin/dashboard';
    if (r === 'registration_staff') return '/registration';
    if (r === 'staff' || r === 'registration_team') return '/staff/dashboard';
    if (r === 'coordinator' || r === 'event_head') return '/coordinator/dashboard';
    // participants default to wherever they were trying to go (or dashboard)
    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { role } = await login(email, password);

      // If the user was redirected here from a deep-link, honour it
      const requestedPath = (location.state as any)?.from?.pathname;
      if (requestedPath && requestedPath !== '/participant/dashboard') {
        navigate(requestedPath, { replace: true });
        return;
      }

      // Use the real role from Firestore for precise routing
      navigate(getDefaultRoute(role, from), { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="TARAS UNIVERSE ACCESS"
        title="PARTICIPANT LOGIN"
        subtitle="Sign in to access your digital symposium pass, event schedule, team invitations, and live status."
        height="compact"
      />

      <div className="max-w-md mx-auto px-4 sm:px-6">
        <div className="glass-panel-glow p-6 sm:p-8 rounded-2xl border border-[#b91c1c]/40 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1a0000] border border-[#b91c1c]/60 flex items-center justify-center text-[#b91c1c] font-extrabold font-mono text-lg">
              T
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white font-mono">TARAS 2K26 PORTAL</h3>
              <p className="text-xs text-slate-400 font-mono">SECURE AUTHENTICATION</p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#1a0000]/80 border border-[#b91c1c] text-xs text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="email"
                  required
                  placeholder="participant@college.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Password
                </label>
                <Link
                  to="/participant/forgot-password"
                  className="text-[10px] font-mono font-bold text-[#b91c1c] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors"
                />
              </div>
            </div>

            <Button
              variant="glow"
              size="md"
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? 'Authenticating…' : 'Login to Dashboard'}
            </Button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
            Don't have a participant account?{' '}
            <Link to="/participant/register" className="font-bold text-[#b91c1c] hover:underline font-mono">
              Register Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
