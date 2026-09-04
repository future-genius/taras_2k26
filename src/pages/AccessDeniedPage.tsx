import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Button } from '../components/common/Button';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const { role, participantProfile } = useAuth();
  const navigate = useNavigate();

  const getRoleDashboardPath = () => {
    switch (role) {
      case 'admin':
      case 'super_admin':
      case 'PRESIDENT':
        return '/admin/dashboard';
      case 'registration_staff':
        return '/registration';
      case 'staff':
      case 'REGISTRATION_TEAM':
        return '/staff/dashboard';
      case 'coordinator':
      case 'EVENT_HEAD':
        return '/coordinator/dashboard';
      default:
        return '/participant/dashboard';
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-16 space-y-8">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="403 — ACCESS RESTRICTED"
        title="ACCESS DENIED"
        subtitle="You do not possess the required clearance level to access this administrative portal."
        height="compact"
      />

      <div className="max-w-md w-full glass-panel-glow p-8 rounded-3xl border border-[#b91c1c]/60 shadow-[0_0_50px_rgba(185,28,28,0.3)] text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#1a0000] border-2 border-[#b91c1c] flex items-center justify-center text-[#b91c1c] mx-auto animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-[#b91c1c] uppercase tracking-widest block">
            SECURITY CLEARANCE INSUFFICIENT
          </span>
          <h2 className="text-2xl font-black text-white font-mono">RESTRICTED ZONE</h2>
          <p className="text-xs text-slate-400 font-mono">
            Current Authenticated Role: <strong className="text-white uppercase font-bold">{role}</strong>
          </p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-light">
          This section is strictly reserved for authorized TARAS 2K26 administrative personnel. Attempts to bypass role-based security boundaries are recorded in system audit logs.
        </p>

        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>

          <Link to={getRoleDashboardPath()} className="w-full sm:w-auto">
            <Button
              variant="glow"
              size="sm"
              icon={<Home className="w-4 h-4" />}
              className="w-full sm:w-auto justify-center"
            >
              My Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
