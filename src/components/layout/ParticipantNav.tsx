import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Calendar, QrCode, Radio, User, ShieldCheck, ShieldAlert, Users, LogOut } from 'lucide-react';

export const ParticipantMobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { participantProfile, role, isSuperAdmin, isAdmin, isStaff, isCoordinator } = useAuth();

  if (!participantProfile) return null;

  const getHomeDashboard = () => {
    if (isSuperAdmin || isAdmin) return '/admin/dashboard';
    if (role === 'registration_staff') return '/registration';
    if (isStaff) return '/staff/dashboard';
    if (isCoordinator) return '/coordinator/dashboard';
    return '/participant/dashboard';
  };

  const navItems = [
    { label: isSuperAdmin ? 'President' : isAdmin ? 'Admin' : role === 'registration_staff' ? 'Scan' : isStaff ? 'Desk' : isCoordinator ? 'Head' : 'Home', path: getHomeDashboard(), icon: <Home className="w-5 h-5" /> },
    { label: 'Events', path: '/participant/my-events', icon: <Calendar className="w-5 h-5" /> },
    { label: 'QR Pass', path: '/participant/pass', icon: <QrCode className="w-6 h-6 text-[#b91c1c]" />, highlight: true },
    { label: 'Updates', path: '/announcements', icon: <Radio className="w-5 h-5" /> },
    { label: 'Profile', path: '/participant/profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#050608]/95 backdrop-blur-xl border-t border-[#b91c1c]/40 py-2 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all ${
                item.highlight
                  ? 'p-2 rounded-xl bg-[#1a0000] border border-[#b91c1c] -mt-4 shadow-[0_0_15px_rgba(185,28,28,0.4)]'
                  : isActive
                  ? 'text-[#b91c1c]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-mono font-bold tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const HeaderUserMenu: React.FC = () => {
  const { participantProfile, role, isSuperAdmin, isAdmin, isStaff, isCoordinator, logout } = useAuth();
  if (!participantProfile) {
    return (
      <Link
        to="/participant/login"
        className="px-3.5 py-1.5 rounded-lg bg-[#1a0000] border border-[#b91c1c]/60 text-xs font-mono font-bold text-white hover:bg-[#b91c1c] transition-all"
      >
        Sign In / Register
      </Link>
    );
  }

  const getDashboardPath = () => {
    if (isSuperAdmin || isAdmin) return '/admin/dashboard';
    if (role === 'registration_staff') return '/registration';
    if (isStaff) return '/staff/dashboard';
    if (isCoordinator) return '/coordinator/dashboard';
    return '/participant/dashboard';
  };

  const getRoleBadge = () => {
    if (isSuperAdmin) return 'PRESIDENT';
    if (isAdmin) return 'ADMIN';
    if (role === 'registration_staff') return 'REG DESK';
    if (isCoordinator) return 'EVENT HEAD';
    if (isStaff) return 'STAFF';
    return null;
  };

  const badge = getRoleBadge();

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/participant/pass"
        className="p-2 rounded-lg bg-[#1a0000] border border-[#b91c1c]/60 text-[#b91c1c] hover:text-white transition-colors"
        title="My Scannable QR Pass"
      >
        <QrCode className="w-4 h-4" />
      </Link>

      <Link
        to={getDashboardPath()}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0c10] border border-[#b91c1c]/40 hover:border-[#b91c1c] transition-all"
      >
        <div className="w-6 h-6 rounded-full bg-[#1a0000] text-[#b91c1c] font-mono font-bold text-xs flex items-center justify-center border border-[#b91c1c]/60">
          {participantProfile.fullName.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs font-mono font-bold text-white max-w-[90px] truncate hidden sm:inline">
          {participantProfile.fullName.split(' ')[0]}
        </span>
        {badge && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white hidden md:inline ${
            isSuperAdmin
              ? 'bg-[#b91c1c] shadow-[0_0_10px_rgba(185,28,28,0.8)] border border-red-500 font-extrabold'
              : 'bg-[#b91c1c]'
          }`}>
            {badge}
          </span>
        )}
      </Link>

      <button
        onClick={logout}
        className="p-2 rounded-lg bg-[#0a0c10] border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-600 transition-colors flex items-center gap-1.5 text-xs font-mono"
        title="Sign Out of TARAS"
      >
        <LogOut className="w-4 h-4 text-red-500" />
        <span className="hidden xl:inline text-[11px] font-bold">Logout</span>
      </button>
    </div>
  );
};
