import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import type { EventTeam } from '../../types/team';
import type { ParticipantProfile } from '../../types/participant';
import type { EventRegistration } from '../../types/registration';
import { exportPresidentTeamReportToExcel, type ComprehensiveTeamData } from '../../services/excelExportService';
import { presidentOverrideRestorePending, presidentOverrideVerify } from '../../services/paymentService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { isInternalRegNo } from '../../utils/college';
import {
  Users,
  Search,
  Download,
  Filter,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar,
  Mail,
  Phone,
  Hash,
  ExternalLink,
  Shield,
  CreditCard,
  RotateCcw,
  Check,
} from 'lucide-react';

export const PresidentTeamOverview: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isProcessingOverride, setIsProcessingOverride] = useState(false);

  const handlePresidentRestorePending = async (registrationId: string) => {
    if (!user?.uid) return;
    if (!confirm('President Override: Are you sure you want to revoke rejection and restore this registration to PENDING?')) return;
    setIsProcessingOverride(true);
    try {
      await presidentOverrideRestorePending(registrationId, user.uid, 'President Override: Accidental rejection revoked');
      setActionMessage(`Registration ${registrationId} restored to PENDING.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'President Override failed.');
    } finally {
      setIsProcessingOverride(false);
    }
  };

  const handlePresidentOverrideVerify = async (registrationId: string) => {
    if (!user?.uid) return;
    if (!confirm('President Override: Are you sure you want to directly VERIFY this payment?')) return;
    setIsProcessingOverride(true);
    try {
      await presidentOverrideVerify(registrationId, user.uid, 'Verified via President Override');
      setActionMessage(`Registration ${registrationId} verified by President Override.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'President Override failed.');
    } finally {
      setIsProcessingOverride(false);
    }
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('ALL');
  const [selectedRegStatus, setSelectedRegStatus] = useState<string>('ALL');
  const [selectedPayStatus, setSelectedPayStatus] = useState<string>('ALL');
  const [selectedParticipantType, setSelectedParticipantType] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');
  const [selectedTeamSize, setSelectedTeamSize] = useState<'ALL' | 'SINGLE' | '2_3' | '4_PLUS'>('ALL');
  const [selectedRound1Result, setSelectedRound1Result] = useState<'ALL' | 'SELECTED' | 'NOT_SELECTED' | 'NOT_DECLARED'>('ALL');
  const [selectedRound2Result, setSelectedRound2Result] = useState<'ALL' | 'WINNER' | 'RUNNER_UP' | 'NOT_SELECTED' | 'NOT_DECLARED'>('ALL');

  // UI States
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [inspectedMember, setInspectedMember] = useState<{
    profile?: ParticipantProfile;
    fullName: string;
    participantId: string;
    teamName: string;
    role: string;
  } | null>(null);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    setLoading(true);

    const unsubTeams = onSnapshot(collection(firestore, 'teams'), (snap) => {
      const data = snap.docs.map((d) => d.data() as EventTeam);
      setTeams(data);
      setLoading(false);
    });

    const unsubParticipants = onSnapshot(collection(firestore, 'participants'), (snap) => {
      const data = snap.docs.map((d) => d.data() as ParticipantProfile);
      setParticipants(data);
    });

    const unsubRegistrations = onSnapshot(collection(firestore, 'registrations'), (snap) => {
      const data = snap.docs.map((d) => d.data() as EventRegistration);
      setRegistrations(data);
    });

    return () => {
      unsubTeams();
      unsubParticipants();
      unsubRegistrations();
    };
  }, []);

  // Map participants by UID for fast lookup
  const participantMap = new Map<string, ParticipantProfile>();
  participants.forEach((p) => participantMap.set(p.uid, p));

  // Build Comprehensive Team Data List
  const comprehensiveTeams: ComprehensiveTeamData[] = teams.map((team) => {
    const leader = participantMap.get(team.leaderUid);
    const members = (team.members || []).map((m) => {
      const profile = participantMap.get(m.uid);
      return {
        ...m,
        profile,
      };
    });

    const teamRegs = registrations.filter((r) => r.teamId === team.teamId);

    return {
      team,
      leader,
      members,
      registrations: teamRegs,
    };
  });

  // Unique Events List for Filter
  const allEventsList = Array.from(
    new Set(
      registrations
        .filter((r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED')
        .map((r) => r.eventName)
    )
  ).sort();

  // Audit Multi-Team Conflict (Detect any participant appearing in > 1 team)
  const userTeamCountMap = new Map<string, { count: number; name: string; email: string; teams: string[] }>();
  teams.forEach((t) => {
    (t.memberUids || []).forEach((mUid) => {
      const p = participantMap.get(mUid);
      const name = p?.fullName || mUid;
      const email = p?.email || 'N/A';
      if (!userTeamCountMap.has(mUid)) {
        userTeamCountMap.set(mUid, { count: 0, name, email, teams: [] });
      }
      const entry = userTeamCountMap.get(mUid)!;
      entry.count += 1;
      entry.teams.push(t.teamName);
    });
  });

  const multiTeamConflicts = Array.from(userTeamCountMap.entries())
    .filter(([_, data]) => data.count > 1)
    .map(([uid, data]) => ({ uid, ...data }));

  // Filtered Teams Computation
  const filteredTeams = comprehensiveTeams.filter(({ team, members, registrations }) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTeamName = team.teamName.toLowerCase().includes(q);
      const matchesTeamId = team.teamId.toLowerCase().includes(q);
      const matchesTeamCode = (team.teamCode || '').toLowerCase().includes(q);

      const matchesMember = members.some((m) => {
        const p = m.profile;
        return (
          m.fullName.toLowerCase().includes(q) ||
          m.participantId.toLowerCase().includes(q) ||
          (p?.email || '').toLowerCase().includes(q) ||
          (p?.phone || p?.phoneNumber || '').toLowerCase().includes(q) ||
          (p?.registrationNumber || '').toLowerCase().includes(q)
        );
      });

      const matchesEvent = registrations.some((r) => r.eventName.toLowerCase().includes(q));

      if (!matchesTeamName && !matchesTeamId && !matchesTeamCode && !matchesMember && !matchesEvent) {
        return false;
      }
    }

    // 2. Event Filter
    if (selectedEvent !== 'ALL') {
      const hasEvent = registrations.some(
        (r) => r.eventName === selectedEvent && r.status !== 'CANCELLED' && r.status !== 'REJECTED'
      );
      if (!hasEvent) return false;
    }

    // 3. Registration Status Filter
    if (selectedRegStatus !== 'ALL') {
      if (selectedRegStatus === 'CONFIRMED') {
        if (!registrations.some((r) => r.status === 'CONFIRMED')) return false;
      } else if (selectedRegStatus === 'PENDING') {
        if (!registrations.some((r) => r.status === 'PENDING_PAYMENT' || r.status === 'PAYMENT_VERIFICATION_PENDING')) return false;
      } else if (selectedRegStatus === 'LOCKED') {
        if (!team.eventRegistrationStarted) return false;
      } else if (selectedRegStatus === 'FORMING') {
        if (team.eventRegistrationStarted) return false;
      }
    }

    // 4. Payment Status Filter
    if (selectedPayStatus !== 'ALL') {
      const isVerified = registrations.some((r) => r.paymentStatus === 'VERIFIED');
      const isPending = registrations.some((r) => r.paymentStatus === 'PENDING' || r.status === 'PAYMENT_VERIFICATION_PENDING');
      const isNotRequired = registrations.some((r) => r.paymentStatus === 'NOT_REQUIRED');

      if (selectedPayStatus === 'VERIFIED' && !isVerified) return false;
      if (selectedPayStatus === 'PENDING' && !isPending) return false;
      if (selectedPayStatus === 'NOT_REQUIRED' && !isNotRequired) return false;
      if (selectedPayStatus === 'UNPAID' && (isVerified || isNotRequired)) return false;
    }

    // 5. Participant Type Filter
    if (selectedParticipantType !== 'ALL') {
      const hasType = members.some((m) => {
        const regNo = m.profile?.registrationNumber || '';
        const internal = isInternalRegNo(regNo);
        return selectedParticipantType === 'INTERNAL' ? internal : !internal;
      });
      if (!hasType) return false;
    }

    // 6. Team Size Filter
    if (selectedTeamSize !== 'ALL') {
      const count = members.length;
      if (selectedTeamSize === 'SINGLE' && count !== 1) return false;
      if (selectedTeamSize === '2_3' && (count < 2 || count > 3)) return false;
      if (selectedTeamSize === '4_PLUS' && count < 4) return false;
    }

    // 7. Round 1 Result Filter
    if (selectedRound1Result !== 'ALL') {
      const matchesR1 = registrations.some((r) => {
        if (selectedRound1Result === 'SELECTED') return r.round1Result === 'SELECTED';
        if (selectedRound1Result === 'NOT_SELECTED') return r.round1Result === 'NOT_SELECTED';
        if (selectedRound1Result === 'NOT_DECLARED') return !r.round1Result || (r.round1Result as string) === 'NOT_DECLARED';
        return true;
      });
      if (!matchesR1) return false;
    }

    // 8. Round 2 Final Result Filter
    if (selectedRound2Result !== 'ALL') {
      const matchesR2 = registrations.some((r) => {
        if (selectedRound2Result === 'WINNER') return r.round2Result === 'WINNER';
        if (selectedRound2Result === 'RUNNER_UP') return r.round2Result === 'RUNNER_UP';
        if (selectedRound2Result === 'NOT_SELECTED') return r.round2Result === 'NOT_SELECTED';
        if (selectedRound2Result === 'NOT_DECLARED') return !r.round2Result || (r.round2Result as string) === 'NOT_DECLARED';
        return true;
      });
      if (!matchesR2) return false;
    }

    return true;
  });

  // Total Statistics
  const totalTeamsCount = teams.length;
  const totalMembersCount = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  const verifiedTeamsCount = comprehensiveTeams.filter((ct) =>
    ct.registrations.some((r) => r.paymentStatus === 'VERIFIED')
  ).length;

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    setActionMessage(null);
    try {
      await exportPresidentTeamReportToExcel(filteredTeams, registrations);
      setActionMessage('Excel export downloaded successfully.');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to export Excel report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-[#061408] border border-green-500/60 text-xs font-mono text-green-300 flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-green-500 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Top Banner & Stats Overview */}
      <div className="p-6 rounded-3xl border border-amber-500/50 bg-gradient-to-br from-[#180808] via-[#090b10] to-[#120606] shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white font-mono tracking-wide">
              PRESIDENT TEAM MANAGEMENT & REPORTING
            </h2>
            <Badge variant="red" className="border border-amber-500 text-amber-300 bg-amber-950/80 font-bold">
              REAL-TIME FIRESTORE
            </Badge>
          </div>
          <p className="text-xs text-slate-300 font-mono mt-1 leading-relaxed max-w-2xl">
            Authoritative, real-time registry of all TARAS 2K26 squads and members. Complete multi-sheet Excel export for administration &amp; event heads.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="glow"
            size="md"
            icon={<Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />}
            disabled={isExporting}
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            {isExporting ? 'Generating Excel…' : 'Export Registrations Excel'}
          </Button>
        </div>
      </div>

      {/* Multi-Team Conflict Alert (If Legacy Bypasses Exist) */}
      {multiTeamConflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500 text-amber-200 font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>AUDIT WARNING: Multi-Team Membership Detected ({multiTeamConflicts.length} Conflict Accounts)</span>
          </div>
          <p className="text-[11px] text-amber-200/90">
            The following participants appear in multiple teams due to previous test data. New team creations and joins strictly enforce the 1-user = 1-team rule.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-36 overflow-y-auto pr-1">
            {multiTeamConflicts.map((c) => (
              <div key={c.uid} className="p-2 rounded-lg bg-black/60 border border-amber-500/40 text-[10px]">
                <strong className="text-white">{c.name}</strong> ({c.email})
                <div className="text-slate-400 truncate">Teams: {c.teams.join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-[#090c12]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Squads</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">{totalTeamsCount}</p>
          <p className="text-[10px] text-slate-400 font-mono">Formed & Registered</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-[#090c12]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Members</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">{totalMembersCount}</p>
          <p className="text-[10px] text-slate-400 font-mono">Enrolled Participants</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-[#090c12]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Verified Paid Teams</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">{verifiedTeamsCount}</p>
          <p className="text-[10px] text-slate-400 font-mono">Payment Verified</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-[#090c12]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Event Tracks</span>
            <Calendar className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">{allEventsList.length}</p>
          <p className="text-[10px] text-slate-400 font-mono">Registered Events</p>
        </div>
      </div>

      {/* Search & Comprehensive Filters Panel */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by team name, team code, member name, reg no, email, phone, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050608] border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Showing <strong className="text-white">{filteredTeams.length}</strong> of {totalTeamsCount} Teams</span>
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-2 border-t border-slate-800/60 text-xs font-mono">
          {/* Event Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Filter by Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full p-2 rounded-xl bg-[#07080b] border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Events ({allEventsList.length})</option>
              {allEventsList.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          </div>

          {/* Registration Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Reg Status
            </label>
            <select
              value={selectedRegStatus}
              onChange={(e) => setSelectedRegStatus(e.target.value)}
              className="w-full p-2 rounded-xl bg-[#07080b] border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed Registrations</option>
              <option value="PENDING">Pending Verification</option>
              <option value="LOCKED">Locked Squads</option>
              <option value="FORMING">Forming Squads</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Payment Status
            </label>
            <select
              value={selectedPayStatus}
              onChange={(e) => setSelectedPayStatus(e.target.value)}
              className="w-full p-2 rounded-xl bg-[#07080b] border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Payment States</option>
              <option value="VERIFIED">Verified Paid</option>
              <option value="PENDING">Verification Pending</option>
              <option value="NOT_REQUIRED">Free / Not Required</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          {/* Participant Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              College Type
            </label>
            <select
              value={selectedParticipantType}
              onChange={(e) => setSelectedParticipantType(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-[#07080b] border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Participants</option>
              <option value="INTERNAL">Internal (SRM Valliammai)</option>
              <option value="EXTERNAL">External Colleges</option>
            </select>
          </div>

          {/* Team Size Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Team Member Count
            </label>
            <select
              value={selectedTeamSize}
              onChange={(e) => setSelectedTeamSize(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-[#07080b] border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Team Sizes</option>
              <option value="SINGLE">Solo (1 Member)</option>
              <option value="2_3">2 – 3 Members</option>
              <option value="4_PLUS">4+ Members</option>
            </select>
          </div>

          {/* Round 1 Result Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Round 1 Result
            </label>
            <select
              value={selectedRound1Result}
              onChange={(e) => setSelectedRound1Result(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-[#07080b] border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Round 1 States</option>
              <option value="SELECTED">Selected for Next Round</option>
              <option value="NOT_SELECTED">Not Selected</option>
              <option value="NOT_DECLARED">Result Not Declared</option>
            </select>
          </div>

          {/* Round 2 Final Result Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Round 2 Final Result
            </label>
            <select
              value={selectedRound2Result}
              onChange={(e) => setSelectedRound2Result(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-[#07080b] border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Round 2 States</option>
              <option value="WINNER">Winner 🏆</option>
              <option value="RUNNER_UP">Runner-Up 🥈</option>
              <option value="NOT_SELECTED">Not Selected</option>
              <option value="NOT_DECLARED">Result Not Declared</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Teams & Members Data Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#07080b] text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 font-bold">Squad &amp; Leader</th>
                <th className="py-3.5 px-4 font-bold">Roster Size</th>
                <th className="py-3.5 px-4 font-bold">Registered Events (Max 3)</th>
                <th className="py-3.5 px-4 font-bold">Registration Status</th>
                <th className="py-3.5 px-4 font-bold">Payment Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Synchronizing live presidential telemetry...
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No teams found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredTeams.map(({ team, leader, members, registrations }) => {
                  const isExpanded = expandedTeamId === team.teamId;
                  const leaderName = leader?.fullName || members.find((m) => m.isLeader)?.fullName || 'N/A';
                  const leaderRegNo = leader?.registrationNumber || 'N/A';
                  const leaderEmail = leader?.email || 'N/A';
                  const leaderPhone = leader?.phone || leader?.phoneNumber || 'N/A';

                  const activeRegs = registrations.filter((r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED');
                  const isVerified = activeRegs.some((r) => r.paymentStatus === 'VERIFIED');
                  const isPending = activeRegs.some((r) => r.paymentStatus === 'PENDING' || r.status === 'PAYMENT_VERIFICATION_PENDING');
                  const isNotReq = activeRegs.some((r) => r.paymentStatus === 'NOT_REQUIRED');

                  return (
                    <React.Fragment key={team.teamId}>
                      <tr
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                          isExpanded ? 'bg-amber-950/20' : ''
                        }`}
                        onClick={() => setExpandedTeamId(isExpanded ? null : team.teamId)}
                      >
                        {/* Squad & Leader */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#1a0000] border border-[#dc2626]/70 flex items-center justify-center text-[#dc2626] font-bold text-xs shrink-0 shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                              {team.teamName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{team.teamName}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                                  {team.teamCode || team.teamId}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-300 block mt-0.5">
                                Captain: <strong className="text-white">{leaderName}</strong> ({leaderRegNo})
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {leaderEmail} • {leaderPhone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Roster Size */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-[#0c0e14] border border-slate-700 text-slate-200 font-bold text-xs inline-flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                            {members.length} / {team.memberCount} Members
                          </span>
                        </td>

                        {/* Registered Events (Max 3) */}
                        <td className="py-4 px-4">
                          {activeRegs.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {activeRegs.map((r) => (
                                <div key={r.registrationId} className="flex flex-col gap-0.5">
                                  <span
                                    className="px-2 py-0.5 rounded bg-[#100404] border border-red-900/60 text-slate-200 text-[10px] inline-flex items-center gap-1 max-w-[220px] truncate"
                                  >
                                    <Calendar className="w-3 h-3 text-red-500 shrink-0" />
                                    <span className="truncate">{r.eventName}</span>
                                  </span>
                                  <div className="flex flex-col gap-1">
                                    {/* Round 1 Result */}
                                    <div>
                                      {r.round1Result === 'SELECTED' ? (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 inline-block">
                                          R1: Selected for Next Round
                                        </span>
                                      ) : r.round1Result === 'NOT_SELECTED' ? (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 inline-block">
                                          R1: Not Selected for Next Round
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-slate-700 inline-block">
                                          R1: Result Not Declared
                                        </span>
                                      )}
                                    </div>

                                    {/* Round 2 / Final Result */}
                                    <div>
                                      {r.round2Result === 'WINNER' ? (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                                          R2: 🏆 Winner
                                        </span>
                                      ) : r.round2Result === 'RUNNER_UP' ? (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 inline-flex items-center gap-1">
                                          R2: 🥈 Runner-Up
                                        </span>
                                      ) : r.round2Result === 'NOT_SELECTED' ? (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 inline-block">
                                          R2: Not Selected
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-slate-700 inline-block">
                                          R2: Result Not Declared
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {activeRegs.length >= 3 && (
                                <span className="text-[9px] text-amber-400 font-bold">★ MAX 3 EVENTS LIMIT REACHED</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">No event registered yet</span>
                          )}
                        </td>

                        {/* Registration Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              team.eventRegistrationStarted
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/60'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {team.eventRegistrationStarted ? '🔒 LOCKED' : 'FORMING'}
                          </span>
                        </td>

                        {/* Payment Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isVerified
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60'
                                : isPending
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60'
                                : isNotReq
                                ? 'bg-blue-950/80 text-blue-300 border border-blue-500/60'
                                : 'bg-red-950/80 text-red-300 border border-red-500/60'
                            }`}
                          >
                            <CreditCard className="w-3 h-3" />
                            {isVerified
                              ? 'VERIFIED'
                              : isPending
                              ? 'VERIFICATION PENDING'
                              : isNotReq
                              ? 'FREE / NOT REQ'
                              : 'UNPAID'}
                          </span>
                        </td>

                        {/* Details Toggle Button */}
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTeamId(isExpanded ? null : team.teamId);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors inline-flex items-center gap-1 text-xs"
                          >
                            <span>{isExpanded ? 'Hide Members' : 'View Roster'}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Team Members Roster Sub-Table */}
                      {isExpanded && (
                        <tr className="bg-[#050608]/90">
                          <td colSpan={6} className="p-4 border-b border-slate-800">
                            <div className="p-4 rounded-2xl bg-[#090b10] border border-amber-500/30 space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                  <Users className="w-4 h-4 text-amber-400" />
                                  SQUAD MEMBERS ROSTER — {team.teamName} ({members.length} Members)
                                </h4>
                                <span className="text-[10px] text-slate-400">
                                  Created: {team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {members.map((m) => {
                                  const p = m.profile;
                                  const regNo = p?.registrationNumber || 'N/A';
                                  const internal = isInternalRegNo(regNo);

                                  return (
                                    <div
                                      key={m.uid}
                                      onClick={() =>
                                        setInspectedMember({
                                          profile: p,
                                          fullName: m.fullName || p?.fullName || 'N/A',
                                          participantId: m.participantId,
                                          teamName: team.teamName,
                                          role: m.isLeader ? 'Leader' : 'Member',
                                        })
                                      }
                                      className="p-3 rounded-xl bg-[#050608] border border-slate-800 hover:border-amber-500/60 transition-all cursor-pointer space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-white text-xs">{m.fullName || p?.fullName}</span>
                                          {m.isLeader && (
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                              LEADER
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[9.5px] text-slate-400">{m.participantId}</span>
                                      </div>

                                      <div className="text-[10.5px] text-slate-300">
                                        Reg No: <strong className="text-white">{regNo}</strong>
                                      </div>

                                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                                        <span>{p?.email || 'N/A'}</span>
                                        <span className={`font-bold ${internal ? 'text-emerald-400' : 'text-purple-400'}`}>
                                          {internal ? 'Internal' : 'External'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Presidential Payment Proof & Override Section */}
                              {activeRegs.length > 0 && (
                                <div className="pt-3 border-t border-slate-800 space-y-2">
                                  <h5 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                    PRESIDENTIAL PAYMENT PROOF OVERSIGHT & OVERRIDE
                                  </h5>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {activeRegs.map((reg) => {
                                      const proofId = reg.paymentProofId || (reg.paymentProof as any)?.paymentProofId || 'PAY-TARAS-LEGACY';
                                      const driveFileId = reg.googleDriveFileId || (reg.paymentProof as any)?.googleDriveFileId;
                                      const isRegRejected = reg.paymentStatus === 'REJECTED' || reg.status === 'REJECTED';

                                      return (
                                        <div key={reg.registrationId} className="p-3 rounded-xl bg-[#040507] border border-slate-800 space-y-2 text-[11px]">
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-white">{reg.eventName}</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                              reg.paymentStatus === 'VERIFIED'
                                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                : isRegRejected
                                                ? 'bg-red-950 text-red-300 border border-red-800'
                                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                                            }`}>
                                              {reg.paymentStatus || reg.status}
                                            </span>
                                          </div>

                                          <div className="text-slate-400 text-[10px] space-y-0.5">
                                            <div>Proof ID: <strong className="text-amber-300 font-mono">{proofId}</strong></div>
                                            <div>UTR: <strong className="text-white font-mono">{reg.utrNumber || 'N/A'}</strong></div>
                                            <div>Bank: <strong className="text-white font-mono">{reg.bankName || (reg.paymentProof as any)?.bankName || 'Not provided'}</strong></div>
                                            <div>Date: <strong className="text-white font-mono">{reg.transactionDate || (reg.paymentProof as any)?.transactionDate || 'Not provided'}</strong></div>
                                            <div>Timestamp: <strong className="text-slate-300">{reg.uploadedAtIST || reg.paymentSubmittedAt || 'N/A'}</strong></div>
                                            {reg.rejectionReason && (
                                              <div className="text-red-400 font-bold">Rejection Reason: {reg.rejectionReason}</div>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 flex-wrap">
                                            {driveFileId && (
                                              <a
                                                href={`https://drive.google.com/file/d/${driveFileId}/view`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-2 py-1 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300 hover:text-white text-[10px] font-bold inline-flex items-center gap-1"
                                              >
                                                <ExternalLink className="w-3 h-3" /> Drive Archive
                                              </a>
                                            )}

                                            {/* President Override Actions */}
                                            {isRegRejected && (
                                              <button
                                                type="button"
                                                disabled={isProcessingOverride}
                                                onClick={() => handlePresidentRestorePending(reg.registrationId)}
                                                className="px-2 py-1 rounded bg-amber-950/80 border border-amber-500/80 text-amber-300 hover:bg-amber-900 text-[10px] font-bold inline-flex items-center gap-1"
                                                title="Revoke accidental rejection and restore to PENDING"
                                              >
                                                <RotateCcw className="w-3 h-3 text-amber-400" /> Restore to Pending
                                              </button>
                                            )}

                                            {reg.paymentStatus !== 'VERIFIED' && (
                                              <button
                                                type="button"
                                                disabled={isProcessingOverride}
                                                onClick={() => handlePresidentOverrideVerify(reg.registrationId)}
                                                className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 hover:bg-emerald-900 text-[10px] font-bold inline-flex items-center gap-1"
                                                title="Directly verify payment via President authority"
                                              >
                                                <Check className="w-3 h-3 text-emerald-400" /> Override → Verify
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      {inspectedMember && (
        <Modal
          isOpen={!!inspectedMember}
          onClose={() => setInspectedMember(null)}
          title={`MEMBER INSPECTION // ${inspectedMember.fullName}`}
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#090b10] border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">{inspectedMember.fullName}</span>
                <Badge variant={inspectedMember.role === 'Leader' ? 'amber' : 'crimson'}>
                  {inspectedMember.role.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Squad: <strong className="text-amber-400">{inspectedMember.teamName}</strong>
              </p>
            </div>

            {inspectedMember.profile ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div className="p-3 rounded-lg bg-[#050608] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Registration Number</span>
                    <strong className="text-white text-xs">{inspectedMember.profile.registrationNumber || 'N/A'}</strong>
                  </div>

                  <div className="p-3 rounded-lg bg-[#050608] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">TARAS Participant ID</span>
                    <strong className="text-white text-xs">{inspectedMember.profile.participantId}</strong>
                  </div>

                  <div className="p-3 rounded-lg bg-[#050608] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Email Address</span>
                    <strong className="text-white text-xs">{inspectedMember.profile.email}</strong>
                  </div>

                  <div className="p-3 rounded-lg bg-[#050608] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Phone Number</span>
                    <strong className="text-white text-xs">{inspectedMember.profile.phone || inspectedMember.profile.phoneNumber || 'N/A'}</strong>
                  </div>

                  <div className="p-3 rounded-lg bg-[#050608] border border-slate-800 col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase">College / Institution</span>
                    <strong className="text-white text-xs">{inspectedMember.profile.college}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                Detailed profile document not synchronized. Basic registration record ID: {inspectedMember.participantId}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setInspectedMember(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
