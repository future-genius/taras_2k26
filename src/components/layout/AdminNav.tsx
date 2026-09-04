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
    <div className="border-b border-[#b91c1c]/30 bg-[#050608]/90 backdrop-blur-md sticky top-16 z-30 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto py-2.5 no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-[#b91c1c]' : 'text-slate-500'}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>

          <Link
            to="/admin/participants/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-white bg-[#b91c1c] hover:bg-[#991b1b] transition-colors whitespace-nowrap shrink-0 shadow-md shadow-[#b91c1c]/20"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Add Participant
          </Link>
        </div>
      </div>
    </div>
  );
};
