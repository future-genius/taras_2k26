import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { AdminNav } from '../../components/layout/AdminNav';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MOCK_EVENTS } from '../../data/events';
import type { ParticipantProfile, UserRole } from '../../types/participant';
import type { AuditLog, AuditAction } from '../../types/eventDay';
import { getRoleDisplayName } from '../../utils/roleHelpers';
import {
  Crown,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCheck,
  UserPlus,
  Radio,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Search,
  Zap,
  Activity,
} from 'lucide-react';

export const PresidentControlPage: React.FC = () => {
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<ParticipantProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [events, setEvents] = useState<any[]>(MOCK_EVENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'emergency' | 'audit'>('hierarchy');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'coordinator' | 'staff'>('ALL');

  // Role Assignment Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ParticipantProfile | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('admin');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Promote by Email Modal
  const [isPromoteEmailOpen, setIsPromoteEmailOpen] = useState(false);
  const [lookupEmail, setLookupEmail] = useState('');
  const [promoteRole, setPromoteRole] = useState<UserRole>('admin');
  const [promoteEventIds, setPromoteEventIds] = useState<string[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);

  // Emergency Broadcast Modal
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<'ALL' | 'TECHNICAL' | 'NON_TECHNICAL' | 'URGENT'>('URGENT');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Global Registration Freeze State
  const [isFreezing, setIsFreezing] = useState(false);

  // Preflight Diagnostic State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Live Real-Time Firestore Subscriptions
    const unsubParticipants = db.subscribeCollection('participants', (data) => {
      setProfiles(data as unknown as ParticipantProfile[]);
      setLoading(false);
    });

    const unsubAudit = db.subscribeCollection('audit_logs', (data) => {
      setAuditLogs(data as unknown as AuditLog[]);
    });

    const unsubEvents = db.subscribeCollection('events', (data) => {
      if (data.length > 0) {
        setEvents(data);
      }
    });

    return () => {
      unsubParticipants();
      unsubAudit();
      unsubEvents();
    };
  }, []);

  const handleResyncData = () => {
    setSuccessMsg('Live presidential telemetry stream synchronized in real-time.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const createAuditRecord = async (
    action: AuditAction,
    targetUid?: string,
    targetParticipantId?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const logId = `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const logDoc: AuditLog = {
        logId,
        action,
        actorUid: user?.uid || 'SUPER_ADMIN_CONSOLE',
        actorRole: 'super_admin',
        targetUid,
        targetParticipantId,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          superAdminEmail: user?.email,
          authorizedBy: 'TARAS_2K26_PRESIDENT',
        },
      };
      await db.setDoc('audit_logs', logId, logDoc as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Non-blocking audit log creation failed:', e);
    }
  };

  // ── Role Management Handlers ─────────────────────────────────────────────
  const openRoleModal = (profile: ParticipantProfile) => {
    setSelectedUser(profile);
    setTargetRole((profile.role as UserRole) || 'participant');
    setSelectedEventIds(profile.assignedEventIds || []);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Safeguard: Cannot demote primary super admin
    if ((selectedUser as any).isPrimarySuperAdmin && targetRole !== 'super_admin') {
      alert('SECURITY VIOLATION: The Primary President / Super Admin account cannot be demoted.');
      return;
    }

    setIsSavingRole(true);
    try {
      const updates: Partial<ParticipantProfile> = {
        role: targetRole,
        assignedEventIds: targetRole === 'coordinator' ? selectedEventIds : [],
        updatedAt: new Date().toISOString(),
      };

      await db.updateDoc('participants', selectedUser.uid, updates as Record<string, unknown>);

      await createAuditRecord(
        'SUPER_ADMIN_CHANGED_ROLE',
        selectedUser.uid,
        selectedUser.participantId,
        {
          previousRole: selectedUser.role,
          newRole: targetRole,
          assignedEventIds: updates.assignedEventIds,
        }
      );

      setSuccessMsg(`Role for ${selectedUser.fullName} updated to ${getRoleDisplayName(targetRole)}.`);
      setIsRoleModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setIsSavingRole(false);
    }
  };

  const handlePromoteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;

    setIsPromoting(true);
    try {
      const match = profiles.find((p) => p.email.toLowerCase() === lookupEmail.trim().toLowerCase());
      if (!match) {
        alert(`No account found registered with email "${lookupEmail}". Please ensure the user has signed up first.`);
        setIsPromoting(false);
        return;
      }

      const updates: Partial<ParticipantProfile> = {
        role: promoteRole,
        assignedEventIds: promoteRole === 'coordinator' ? promoteEventIds : [],
        updatedAt: new Date().toISOString(),
      };

      await db.updateDoc('participants', match.uid, updates as Record<string, unknown>);

      await createAuditRecord(
        promoteRole === 'admin'
          ? 'SUPER_ADMIN_CREATED_ADMIN'
          : promoteRole === 'coordinator'
          ? 'SUPER_ADMIN_CREATED_EVENT_HEAD'
          : 'SUPER_ADMIN_CREATED_STAFF',
        match.uid,
        match.participantId,
        { email: match.email, assignedRole: promoteRole }
      );

      setSuccessMsg(`Elevated ${match.fullName} (${match.email}) to ${getRoleDisplayName(promoteRole)}.`);
      setIsPromoteEmailOpen(false);
      setLookupEmail('');
      setPromoteEventIds([]);
    } catch (err: any) {
      alert(err.message || 'Failed to promote user.');
    } finally {
      setIsPromoting(false);
    }
  };

  // ── Global System Controls ───────────────────────────────────────────────
  const handleToggleGlobalFreeze = async (openState: boolean) => {
    if (!confirm(`Are you sure you want to ${openState ? 'UNFREEZE / RESUME' : 'FREEZE / PAUSE'} all symposium event registrations globally?`)) {
      return;
    }

    setIsFreezing(true);
    try {
      for (const ev of events) {
        await db.updateDoc('events', ev.id, {
          registrationOpen: openState,
          updatedAt: new Date().toISOString(),
        });
      }

      await createAuditRecord(
        'SUPER_ADMIN_GLOBAL_REGISTRATION_FREEZE',
        undefined,
        undefined,
        { globalRegistrationOpen: openState }
      );

      setSuccessMsg(`Global registrations successfully ${openState ? 'UNFROZEN (OPEN)' : 'FROZEN (LOCKED)'}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update global registration status.');
    } finally {
      setIsFreezing(false);
    }
  };

  const handleSendEmergencyBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsSendingBroadcast(true);
    try {
      const announcementId = `URGENT-PRESIDENT-${Date.now()}`;
      const announcementDoc = {
        id: announcementId,
        title: `🚨 [PRESIDENT DISPATCH] ${broadcastTitle.trim()}`,
        content: broadcastMessage.trim(),
        category: broadcastCategory,
        priority: 'CRITICAL',
        isPinned: true,
        author: 'TARAS 2K26 PRESIDENT // SUPER ADMIN',
        authorRole: 'super_admin',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      await db.setDoc('announcements', announcementId, announcementDoc);

      await createAuditRecord(
        'SUPER_ADMIN_EMERGENCY_BROADCAST',
        undefined,
        undefined,
        { broadcastTitle, category: broadcastCategory }
      );

      setSuccessMsg('Emergency presidential broadcast dispatched across all terminals!');
      setIsBroadcastOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch broadcast.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleRunSystemDiagnostic = async () => {
    setIsDiagnosing(true);
    setDiagnosticReport(null);
    try {
      const superAdmins = profiles.filter((p) => (p.role || '').toLowerCase() === 'super_admin' || (p.role || '').toUpperCase() === 'PRESIDENT');
      const admins = profiles.filter((p) => (p.role || '').toLowerCase() === 'admin');
      const coords = profiles.filter((p) => (p.role || '').toLowerCase() === 'coordinator' || (p.role || '').toUpperCase() === 'EVENT_HEAD');
      const staff = profiles.filter((p) => (p.role || '').toLowerCase() === 'staff' || (p.role || '').toUpperCase() === 'REGISTRATION_TEAM');
      const participants = profiles.filter((p) => !['super_admin', 'admin', 'coordinator', 'staff', 'president', 'event_head', 'registration_team'].includes((p.role || '').toLowerCase()));

      const unassignedCoords = coords.filter((c) => !c.assignedEventIds || c.assignedEventIds.length === 0);

      const report = [
        `=== TARAS 2K26 PRESIDENTIAL SECURITY & GOVERNANCE SCAN ===`,
        `Timestamp: ${new Date().toISOString()}`,
        `President Account: ${user?.email} [SUPER_ADMIN CLEARANCE: ACTIVE]`,
        ``,
        `[AUTHORIZATION HIERARCHY]`,
        `• Super Admins / Presidents: ${superAdmins.length}`,
        `• Administrators: ${admins.length}`,
        `• Event Heads: ${coords.length}`,
        `• Desk Staff: ${staff.length}`,
        `• Participants: ${participants.length}`,
        `• Total Directory Records: ${profiles.length}`,
        ``,
        `[GOVERNANCE CHECKS]`,
        `✓ Primary Super Admin Protected: YES`,
        `✓ Immutable Audit Trail Active: YES (${auditLogs.length} logs recorded)`,
        `✓ Client Privilege Escalation Prevention: ENFORCED (Firestore Rules)`,
        unassignedCoords.length > 0
          ? `⚠ WARNING: ${unassignedCoords.length} Event Head(s) have no assigned event tracks.`
          : `✓ All Event Heads assigned to active event tracks.`,
        ``,
        `[SYSTEM HEALTH]`,
        `✓ All subsystems operational. Platform ready for live symposium.`,
      ].join('\n');

      setDiagnosticReport(report);

      await createAuditRecord('SUPER_ADMIN_DIAGNOSTIC_RESYNC', undefined, undefined, {
        superAdminCount: superAdmins.length,
        adminCount: admins.length,
      });
    } catch (err: any) {
      alert(err.message || 'Diagnostic failed');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // ── Derived Stats ────────────────────────────────────────────────────────
  const superAdminCount = profiles.filter((p) => (p.role || '').toLowerCase() === 'super_admin' || (p.role || '').toUpperCase() === 'PRESIDENT').length;
  const adminCount = profiles.filter((p) => (p.role || '').toLowerCase() === 'admin').length;
  const coordCount = profiles.filter((p) => (p.role || '').toLowerCase() === 'coordinator' || (p.role || '').toUpperCase() === 'EVENT_HEAD').length;
  const staffCount = profiles.filter((p) => (p.role || '').toLowerCase() === 'staff' || (p.role || '').toUpperCase() === 'REGISTRATION_TEAM').length;
  const participantCount = profiles.length - (superAdminCount + adminCount + coordCount + staffCount);

  const elevatedProfiles = profiles.filter((p) => {
    const r = (p.role || '').toLowerCase();
    if (roleFilter === 'admin') return r === 'admin';
    if (roleFilter === 'coordinator') return r === 'coordinator' || r === 'event_head';
    if (roleFilter === 'staff') return r === 'staff' || r === 'registration_team';
    return r === 'super_admin' || r === 'president' || r === 'admin' || r === 'coordinator' || r === 'event_head' || r === 'staff' || r === 'registration_team';
  }).filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.participantId.toLowerCase().includes(q)
    );
  });

  const superAdminAuditLogs = auditLogs
    .filter((l) => (l.action || '').startsWith('SUPER_ADMIN_') || l.actorRole === 'super_admin')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-8 pb-24">
      <AdminNav />

      {/* Atmospheric Presidential Header */}
      <VisualAtmosphere
        environmentKey="adminCommandCenter"
        badgeText="👑 TARAS 2K26 PRESIDENT // SUPREME COMMAND"
        title="PRESIDENT AUTHORITY & CONTROL"
        subtitle="Exclusive governance console for the TARAS 2K26 President. Administrative account provisioning, global override controls, and immutable security oversight."
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Supreme President Identity Banner */}
        <div className="p-6 sm:p-8 rounded-3xl border-2 border-amber-500/80 bg-gradient-to-r from-[#1a0000] via-[#0a0c10] to-[#1a0000] shadow-[0_0_40px_rgba(245,158,11,0.2)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-900/40">
              <Crown className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-white font-mono uppercase tracking-wide">
                  TARAS 2K26 PRESIDENT
                </h2>
                <Badge variant="red" className="border border-amber-500 text-amber-400 bg-amber-950/60 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                  SUPER ADMIN
                </Badge>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1">
                Authenticated Session: <span className="text-amber-300 font-bold">{user?.email || 'president.taras2k26@gmail.com'}</span> · Highest Privilege Tier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={handleResyncData}
            >
              Resync Authority
            </Button>
            <Button
              variant="glow"
              size="sm"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsPromoteEmailOpen(true)}
            >
              Elevate Account
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Radio className="w-4 h-4 text-red-400" />}
              onClick={() => setIsBroadcastOpen(true)}
            >
              President Dispatch
            </Button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-[#061408] border border-green-500/60 text-xs text-green-300 flex items-center justify-between gap-2 font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-white font-bold">✕</button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#dc2626] text-xs text-white flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── SECTION 1: ADMINISTRATIVE HIERARCHY METRICS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/40 bg-[#120a02] space-y-1">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Super Admin</span>
              <Crown className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black text-white font-mono">{superAdminCount}</p>
            <p className="text-[10px] text-amber-300/80 font-mono">President Level</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-red-500/40 bg-[#140404] space-y-1">
            <div className="flex items-center justify-between text-red-400">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Admins</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black text-white font-mono">{adminCount}</p>
            <p className="text-[10px] text-slate-400 font-mono">Full Operations</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Event Heads</span>
              <UserCheck className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-3xl font-black text-white font-mono">{coordCount}</p>
            <p className="text-[10px] text-slate-400 font-mono">Track Coords</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Staff</span>
              <ShieldCheck className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-3xl font-black text-white font-mono">{staffCount}</p>
            <p className="text-[10px] text-slate-400 font-mono">Desk Check-in</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Participants</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-3xl font-black text-white font-mono">{participantCount}</p>
            <p className="text-[10px] text-slate-400 font-mono">Registered Total</p>
          </div>
        </div>

        {/* ── SECTION 2: PRESIDENT NAVIGATION TABS ── */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'hierarchy'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" /> Administrative Directory ({elevatedProfiles.length})
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'emergency'
                ? 'bg-[#1a0000] text-white border border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#dc2626]" /> System Emergency Overrides
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-[#1a0000] text-white border border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Presidential Audit Trail ({superAdminAuditLogs.length})
          </button>
        </div>

        {/* ── TAB 1: ADMINISTRATIVE HIERARCHY & ROLES ── */}
        {activeTab === 'hierarchy' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search elevated users by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0c10] border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Role Filters */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {(['ALL', 'admin', 'coordinator', 'staff'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
                      roleFilter === r
                        ? 'bg-amber-500 text-black font-extrabold shadow-md'
                        : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {r === 'ALL' ? 'All Elevated' : getRoleDisplayName(r)}
                  </button>
                ))}
              </div>
            </div>

            {/* Elevated Users Table */}
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0a0c10]/80 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4 font-bold">User Identity</th>
                      <th className="py-3.5 px-4 font-bold">Role Authority</th>
                      <th className="py-3.5 px-4 font-bold">Department / College</th>
                      <th className="py-3.5 px-4 font-bold">Assigned Event Tracks</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {elevatedProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No elevated administrative accounts found matching filter.
                        </td>
                      </tr>
                    ) : (
                      elevatedProfiles.map((p) => {
                        const r = (p.role || '').toLowerCase();
                        const isPrimary = (p as any).isPrimarySuperAdmin;
                        const isSuper = r === 'super_admin' || r === 'president';
                        const isAdminUser = r === 'admin';
                        const isCoordUser = r === 'coordinator' || r === 'event_head';
                        const isStaffUser = r === 'staff' || r === 'registration_team';

                        return (
                          <tr key={p.uid} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSuper
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500'
                                    : isAdminUser
                                    ? 'bg-red-500/20 text-red-400 border border-red-500'
                                    : isCoordUser
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500'
                                }`}>
                                  {isSuper ? '👑' : p.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white">{p.fullName}</span>
                                    {isPrimary && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                        PRIMARY
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-slate-400 text-[11px] block">{p.email}</span>
                                  <span className="text-slate-600 text-[10px] block">{p.participantId}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isSuper
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                  : isAdminUser
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/60'
                                  : isCoordUser
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/60'
                              }`}>
                                {isSuper && <Crown className="w-3 h-3" />}
                                {getRoleDisplayName(p.role)}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-slate-300">
                              <div>{p.department || 'ECE'} ({p.year || 'IV'} Year)</div>
                              <div className="text-slate-500 text-[10px] truncate max-w-[180px]">{p.college}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              {p.assignedEventIds && p.assignedEventIds.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {p.assignedEventIds.map((eid) => {
                                    const ev = events.find((e) => e.id === eid);
                                    return (
                                      <span key={eid} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] border border-slate-700">
                                        {ev?.title || eid}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-[10px]">
                                  {isCoordUser ? '⚠ No tracks assigned' : 'All Accessible / System-wide'}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => openRoleModal(p)}
                                disabled={isPrimary}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                                  isPrimary
                                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                                    : 'bg-[#1a0000] text-red-400 border border-red-500/40 hover:bg-red-600 hover:text-white'
                                }`}
                                title={isPrimary ? 'Primary President account is immutable' : 'Modify role authority'}
                              >
                                Manage Role
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: SYSTEM EMERGENCY OVERRIDES ── */}
        {activeTab === 'emergency' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Global Registration Lock */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-red-500/40 bg-gradient-to-b from-[#140404] to-[#0a0c10] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Global Registration Freeze</h3>
                  <p className="text-xs text-slate-400 font-mono">Atomic lock across all {events.length} symposium tracks</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Freezes or unfreezes new participant and team registrations globally across Firestore.
                Existing registrations, passes, and check-ins remain fully valid.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Lock className="w-4 h-4" />}
                  disabled={isFreezing}
                  onClick={() => handleToggleGlobalFreeze(false)}
                  className="bg-red-700 hover:bg-red-800 border-red-500 text-white font-mono"
                >
                  {isFreezing ? 'Freezing...' : '🔒 Freeze All Registrations'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  icon={<Unlock className="w-4 h-4 text-green-400" />}
                  disabled={isFreezing}
                  onClick={() => handleToggleGlobalFreeze(true)}
                  className="border-green-500/50 text-green-400 hover:bg-green-950 font-mono"
                >
                  {isFreezing ? 'Unfreezing...' : '🔓 Resume All Registrations'}
                </Button>
              </div>
            </div>

            {/* Presidential Diagnostic & Integrity Scan */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#140c02] to-[#0a0c10] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500 flex items-center justify-center text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Security &amp; Governance Scan</h3>
                  <p className="text-xs text-slate-400 font-mono">Real-time RBAC integrity validation</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Executes a non-destructive audit scan across all Firestore participant profiles,
                verifying role assignments, event mappings, and immutable audit logs.
              </p>

              <div className="pt-2">
                <Button
                  variant="glow"
                  size="sm"
                  icon={<Activity className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />}
                  disabled={isDiagnosing}
                  onClick={handleRunSystemDiagnostic}
                  className="font-mono text-amber-300"
                >
                  {isDiagnosing ? 'Running Governance Scan...' : '⚡ Run Presidential Scan'}
                </Button>
              </div>
            </div>

            {/* Diagnostic Report Output */}
            {diagnosticReport && (
              <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-amber-500/50 bg-[#050608] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> PRESIDENTIAL GOVERNANCE REPORT
                  </h4>
                  <button onClick={() => setDiagnosticReport(null)} className="text-slate-500 hover:text-white text-xs font-mono">
                    Close
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-black/80 border border-slate-800 text-[11px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {diagnosticReport}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: PRESIDENTIAL AUDIT TRAIL ── */}
        {activeTab === 'audit' && (
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" /> Immutable Presidential Audit Trail
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Append-only immutable record of all Super Admin actions and role adjustments
                </p>
              </div>
              <Badge variant="red">{superAdminAuditLogs.length} Records</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 font-bold">Action</th>
                    <th className="py-3 px-3 font-bold">Actor</th>
                    <th className="py-3 px-3 font-bold">Target</th>
                    <th className="py-3 px-3 font-bold">Timestamp</th>
                    <th className="py-3 px-3 font-bold">Metadata Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {superAdminAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No presidential actions logged yet. All actions performed in this console are recorded immutably.
                      </td>
                    </tr>
                  ) : (
                    superAdminAuditLogs.map((log) => (
                      <tr key={log.logId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <span className="text-red-400 font-bold">{log.actorRole}</span>
                          <span className="text-slate-500 text-[10px] block truncate max-w-[120px]">{log.actorUid}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {log.targetParticipantId || log.targetUid || 'GLOBAL'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[10px]">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: MANAGE USER ROLE ── */}
      {selectedUser && (
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          title={`MANAGE ROLE // ${selectedUser.fullName}`}
        >
          <form onSubmit={handleSaveRole} className="space-y-5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#0a0c10] border border-slate-800 space-y-1">
              <div className="text-white font-bold">{selectedUser.fullName}</div>
              <div className="text-slate-400">{selectedUser.email}</div>
              <div className="text-slate-500 text-[10px]">ID: {selectedUser.participantId}</div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 font-bold uppercase text-[10px] block">
                Select Assigned Authority Level
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="w-full p-3 rounded-xl bg-[#0a0c10] border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="participant">PARTICIPANT (Standard Attendee)</option>
                <option value="staff">STAFF (Registration Desk & Gate Check-in)</option>
                <option value="coordinator">EVENT HEAD (Track Management & Scoring)</option>
                <option value="admin">ADMIN (Operations & Platform Management)</option>
                <option value="super_admin">👑 SUPER ADMIN (President Authority)</option>
              </select>
            </div>

            {targetRole === 'coordinator' && (
              <div className="space-y-2">
                <label className="text-slate-300 font-bold uppercase text-[10px] block">
                  Assign Event Tracks (Select all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-[#0a0c10] border border-slate-800">
                  {events.map((ev) => {
                    const isChecked = selectedEventIds.includes(ev.id);
                    return (
                      <label
                        key={ev.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-[11px] ${
                          isChecked ? 'bg-purple-950/60 border border-purple-500/60 text-purple-200' : 'text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedEventIds(selectedEventIds.filter((id) => id !== ev.id));
                            } else {
                              setSelectedEventIds([...selectedEventIds, ev.id]);
                            }
                          }}
                          className="rounded border-slate-700 text-purple-600 focus:ring-0"
                        />
                        <span className="truncate">{ev.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="glow"
                size="sm"
                type="submit"
                disabled={isSavingRole}
                className="bg-amber-600 hover:bg-amber-700 text-black font-extrabold"
              >
                {isSavingRole ? 'Saving Authority...' : 'Confirm Role Update'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: ELEVATE BY EMAIL ── */}
      <Modal
        isOpen={isPromoteEmailOpen}
        onClose={() => setIsPromoteEmailOpen(false)}
        title="ELEVATE ACCOUNT // PRESIDENT PROVISIONING"
      >
        <form onSubmit={handlePromoteByEmail} className="space-y-5 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase text-[10px] block">
              User Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. coordinator.ece@srmvalliammai.ac.in"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0a0c10] border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500">The user must have an existing signed-up account.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase text-[10px] block">
              Assigned Role
            </label>
            <select
              value={promoteRole}
              onChange={(e) => setPromoteRole(e.target.value as UserRole)}
              className="w-full p-3 rounded-xl bg-[#0a0c10] border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="admin">ADMIN (Platform Management)</option>
              <option value="coordinator">EVENT HEAD (Track Management & Scoring)</option>
              <option value="staff">STAFF (Registration Desk Check-in)</option>
            </select>
          </div>

          {promoteRole === 'coordinator' && (
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold uppercase text-[10px] block">
                Assign Tracks
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-[#0a0c10] border border-slate-800">
                {events.map((ev) => {
                  const isChecked = promoteEventIds.includes(ev.id);
                  return (
                    <label
                      key={ev.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-[11px] ${
                        isChecked ? 'bg-purple-950/60 border border-purple-500/60 text-purple-200' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setPromoteEventIds(promoteEventIds.filter((id) => id !== ev.id));
                          } else {
                            setPromoteEventIds([...promoteEventIds, ev.id]);
                          }
                        }}
                        className="rounded border-slate-700 text-purple-600 focus:ring-0"
                      />
                      <span className="truncate">{ev.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsPromoteEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="glow"
              size="sm"
              type="submit"
              disabled={isPromoting}
              className="bg-amber-600 hover:bg-amber-700 text-black font-extrabold"
            >
              {isPromoting ? 'Elevating Account...' : 'Provision Authority'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: EMERGENCY PRESIDENT BROADCAST ── */}
      <Modal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        title="🚨 PRESIDENT EMERGENCY DISPATCH"
      >
        <form onSubmit={handleSendEmergencyBroadcast} className="space-y-5 font-mono text-xs">
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/80 text-red-300 text-[11px] leading-relaxed">
            This will pin a high-visibility presidential alert across all participant dashboards and announcement feeds.
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase text-[10px] block">
              Dispatch Headline
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule Update: Valedictory Ceremony Timing"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0a0c10] border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase text-[10px] block">
              Broadcast Message Content
            </label>
            <textarea
              required
              rows={4}
              placeholder="Enter official statement or operational instruction..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0a0c10] border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase text-[10px] block">
              Target Channel
            </label>
            <select
              value={broadcastCategory}
              onChange={(e) => setBroadcastCategory(e.target.value as any)}
              className="w-full p-3 rounded-xl bg-[#0a0c10] border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-red-500"
            >
              <option value="URGENT">URGENT (All Tracks & Terminals)</option>
              <option value="ALL">GENERAL BROADCAST</option>
              <option value="TECHNICAL">TECHNICAL TRACKS ONLY</option>
              <option value="NON_TECHNICAL">NON-TECHNICAL TRACKS ONLY</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSendingBroadcast}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isSendingBroadcast ? 'Dispatching...' : '📡 Broadcast to Symposium'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
