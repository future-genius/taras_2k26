import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  ShieldCheck,
  UserCheck,
  Flag,
  Radio,
  Clock,
  Trophy,
  FileSpreadsheet,
  PlusCircle,
  BarChart3,
  Shield,
  Crown,
  Mail,
  Award,
  Sparkles,
} from 'lucide-react';

export const AdminNav: React.FC = () => {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();

  const links = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ...(isSuperAdmin
      ? [{ label: '👑 President Command', path: '/admin/president', icon: <Crown className="w-4 h-4 text-amber-400" /> }]
      : []),
    { label: 'Participants', path: '/admin/participants', icon: <Users className="w-4 h-4" /> },
    { label: 'Registrations', path: '/admin/registrations', icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Events', path: '/admin/events', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Staff', path: '/admin/staff', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Event Heads', path: '/admin/coordinators', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Teams', path: '/admin/teams', icon: <Flag className="w-4 h-4" /> },
    { label: 'Announcements', path: '/admin/announcements', icon: <Radio className="w-4 h-4" /> },
    { label: 'Schedules', path: '/admin/schedules', icon: <Clock className="w-4 h-4" /> },
    { label: 'Results', path: '/admin/results', icon: <Trophy className="w-4 h-4" /> },
    { label: 'Certificates', path: '/admin/certificates', icon: <Award className="w-4 h-4" /> },
    { label: 'Communications', path: '/admin/communications', icon: <Mail className="w-4 h-4" /> },
    { label: 'Reports', path: '/admin/reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Audit Log', path: '/admin/audit', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="border-y border-[#dc2626]/40 bg-[#07090d]/95 backdrop-blur-2xl sticky top-[68px] z-40 mb-8 shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#1a0000] via-[#0d0f14] to-[#07090d] text-white border border-[#ff2b2b] shadow-[0_0_20px_rgba(220,38,38,0.5)] scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-[#dc2626]/30'
                  }`}
                >
                  <span className={isActive ? 'text-[#ff2b2b] animate-pulse' : 'text-slate-400'}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>

          <Link
            to="/admin/participants/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#ff2b2b] hover:to-[#dc2626] transition-all whitespace-nowrap shrink-0 shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-[#ff2b2b]/50 hover:scale-105"
          >
            <PlusCircle className="w-4 h-4 text-white animate-pulse" /> Add Participant
          </Link>
        </div>
      </div>
    </div>
  );
};
