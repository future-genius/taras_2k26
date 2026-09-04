import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToUserTeams,
  getTeamJoinRequestsForLeader,
  getParticipantJoinRequests,
} from '../../services/teamService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import type { EventTeam, TeamJoinRequest } from '../../types/team';
import {
  Users,
  Plus,
  UserPlus,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  UserMinus,
  LogOut,
  X,
  Lock,
  Calendar,
  Hash,
  ChevronRight,
  Info,
} from 'lucide-react';

export const TeamHub: React.FC = () => {
  const {
    participantProfile,
    createTeam,
    requestJoinTeam,
    approveJoinRequest,
    rejectJoinRequest,
    renameTeam,
    removeMemberFromTeam,
    disbandTeam,
    leaveTeam,
  } = useAuth();

  const [userTeams, setUserTeams] = useState<EventTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [leaderRequests, setLeaderRequests] = useState<TeamJoinRequest[]>([]);
  const [mySentRequests, setMySentRequests] = useState<TeamJoinRequest[]>([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Create form states
  const [newTeamName, setNewTeamName] = useState('');
  const [memberCount, setMemberCount] = useState(2);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action feedback states
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [approvingReqId, setApprovingReqId] = useState<string | null>(null);
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);

  const fetchJoinRequests = async () => {
    if (!participantProfile?.uid) return;
    try {
      const leaderReqs = await getTeamJoinRequestsForLeader(participantProfile.uid);
      setLeaderRequests(leaderReqs);
      const myReqs = await getParticipantJoinRequests(participantProfile.uid);
      setMySentRequests(myReqs);
    } catch (err) {
      console.warn('Error fetching join requests:', err);
    }
  };

  useEffect(() => {
    if (!participantProfile?.uid) return;

    fetchJoinRequests();

    setLoadingTeams(true);
    const unsub = subscribeToUserTeams(
      participantProfile.uid,
      (teams) => {
        setUserTeams(teams);
        setLoadingTeams(false);
      },
      (err) => {
        console.warn('Team subscription error:', err);
        setLoadingTeams(false);
      }
    );

    return () => unsub();
  }, [participantProfile?.uid]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    if (!memberCount || memberCount < 1) {
      setFormError('Member count must be at least 1.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      // Teams are event-independent: no event selection required
      await createTeam(newTeamName.trim(), memberCount);
      setNewTeamName('');
      setMemberCount(2);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      await requestJoinTeam(joinCodeInput.trim());
      setJoinCodeInput('');
      setIsJoinModalOpen(false);
      await fetchJoinRequests();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit join request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setApprovingReqId(requestId);
    setTeamError(null);
    try {
      await approveJoinRequest(requestId);
      await fetchJoinRequests();
    } catch (err: any) {
      setTeamError(err.message || 'Failed to approve join request.');
    } finally {
      setApprovingReqId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setRejectingReqId(requestId);
    setTeamError(null);
    try {
      await rejectJoinRequest(requestId);
      await fetchJoinRequests();
    } catch (err: any) {
      setTeamError(err.message || 'Failed to reject join request.');
    } finally {
      setRejectingReqId(null);
    }
  };

  const handleSaveRename = async (teamId: string) => {
    if (!renameInput.trim()) return;
    setIsRenaming(true);
    setTeamError(null);
    try {
      await renameTeam(teamId, renameInput.trim());
      setEditingTeamId(null);
    } catch (err: any) {
      setTeamError(err.message || 'Failed to rename team.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRemoveMember = async (teamId: string, memberUid: string, partId: string, name: string, isLocked: boolean) => {
    if (isLocked) {
      setTeamError('Cannot remove members: this squad is locked after event registration.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove "${name}" from the squad roster?`)) return;
    setRemovingUid(memberUid);
    setTeamError(null);
    try {
      await removeMemberFromTeam(teamId, memberUid, partId);
    } catch (err: any) {
      setTeamError(err.message || 'Failed to remove member.');
    } finally {
      setRemovingUid(null);
    }
  };

  const handleLeaveOrDisband = async (teamId: string, isLeader: boolean, teamName: string, isLocked: boolean) => {
    if (isLocked) {
      setTeamError(
        isLeader
          ? 'Cannot disband this squad — it has already registered for an event. Contact the TARAS Registration Team if needed.'
          : 'Cannot leave this squad — it has already registered for an event and is now locked.'
      );
      return;
    }

    if (isLeader) {
      if (!window.confirm(`Disband squad "${teamName}"?\n\nThis will permanently delete the team roster.`)) return;
      setLeavingTeamId(teamId);
      setTeamError(null);
      try {
        await disbandTeam(teamId);
      } catch (err: any) {
        setTeamError(err.message || 'Failed to disband team.');
      } finally {
        setLeavingTeamId(null);
      }
    } else {
      if (!window.confirm(`Leave squad "${teamName}"?`)) return;
      setLeavingTeamId(teamId);
      setTeamError(null);
      try {
        await leaveTeam(teamId);
      } catch (err: any) {
        setTeamError(err.message || 'Failed to leave squad.');
      } finally {
        setLeavingTeamId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono text-[#b91c1c] uppercase tracking-widest font-bold block">
            CENTRAL TEAM MANAGEMENT
          </span>
          <h2 className="text-2xl font-black text-white font-mono flex items-center gap-2">
            <Users className="w-6 h-6 text-[#b91c1c]" /> TEAM HUB
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Create or join a squad here — then register for events separately.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="glow"
            size="sm"
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="font-mono text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> CREATE TEAM
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormError(null);
              setIsJoinModalOpen(true);
            }}
            className="font-mono text-xs"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> JOIN EXISTING TEAM
          </Button>
        </div>
      </div>

      {/* How it works info strip */}
      <div className="p-3.5 rounded-2xl bg-[#06080c] border border-slate-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
          <span className="text-white font-bold block">How It Works:</span>
          <span className="block">
            <strong className="text-slate-200">1.</strong> Create a Squad here → share the team code with your members
          </span>
          <span className="block">
            <strong className="text-slate-200">2.</strong> Once your squad is complete → go to <Link to="/events" className="text-[#b91c1c] hover:underline">Events Hub</Link> to register your team for events
          </span>
          <span className="block">
            <strong className="text-slate-200">3.</strong> First registration: ₹150 × team member count. Subsequent events = ₹0
          </span>
        </div>
      </div>

      {teamError && (
        <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs font-mono text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
          <span>{teamError}</span>
          <button onClick={() => setTeamError(null)} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loadingTeams ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          Loading your team rosters…
        </div>
      ) : userTeams.length === 0 ? (
        /* Empty State */
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#1a0000] border-2 border-[#b91c1c] flex items-center justify-center text-[#b91c1c] mx-auto shadow-lg shadow-[#b91c1c]/20">
            <Users className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white font-mono uppercase">No Squads Yet</h3>
            <p className="text-xs text-slate-300 font-mono font-light leading-relaxed">
              Create your team first, share the join code, then register for events together. No event selection needed at this stage.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="glow"
              size="md"
              onClick={() => {
                setFormError(null);
                setIsCreateModalOpen(true);
              }}
              className="font-mono text-xs py-3 px-6 font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" /> CREATE SQUAD
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setFormError(null);
                setIsJoinModalOpen(true);
              }}
              className="font-mono text-xs py-3 px-6"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> JOIN EXISTING SQUAD
            </Button>
          </div>
        </div>
      ) : (
        /* Active Teams Roster Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {userTeams.map((team) => {
            const isLeader = team.leaderUid === participantProfile?.uid;
            const isLocked = !!team.eventRegistrationStarted;
            const memberCountAuth = team.memberCount || team.maxTeamSize;
            const joinedCount = team.members?.length || 1;
            const feeTotal = memberCountAuth * 150;

            return (
              <div
                key={team.teamId}
                className={`glass-panel-glow p-6 rounded-3xl border space-y-5 shadow-xl relative overflow-hidden transition-all ${
                  isLocked
                    ? 'border-amber-500/40 shadow-amber-950/10'
                    : 'border-[#b91c1c]/50'
                }`}
              >
                {/* Lock Badge Overlay */}
                {isLocked && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold">
                    <Lock className="w-3 h-3" /> LOCKED
                  </div>
                )}

                {/* Team Header */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4 pr-16">
                  <div>
                    {editingTeamId === team.teamId ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          className="px-3 py-1 rounded-xl bg-[#0a0c10] border border-[#b91c1c] text-white font-mono text-sm focus:outline-none"
                          placeholder="New Squad Name"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(team.teamId)}
                          disabled={isRenaming}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold"
                        >
                          {isRenaming ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingTeamId(null)}
                          className="px-2 py-1 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white font-mono">{team.teamName}</h3>
                        {isLeader && !isLocked && (
                          <button
                            onClick={() => {
                              setEditingTeamId(team.teamId);
                              setRenameInput(team.teamName);
                            }}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            title="Rename Squad"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={isLeader ? 'crimson' : 'outline'} size="sm">
                        {isLeader ? '★ CAPTAIN' : 'MEMBER'}
                      </Badge>
                      <Badge
                        variant={
                          isLocked
                            ? 'amber'
                            : joinedCount >= team.minTeamSize
                            ? 'green'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {isLocked ? 'REGISTERED' : joinedCount >= team.minTeamSize ? 'ACTIVE' : 'FORMING'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Fee Info */}
                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                  <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Declared Size</span>
                    <span className="text-white font-bold text-lg">{memberCountAuth}</span>
                    <span className="text-slate-500 text-[10px] block">members</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Registration Fee</span>
                    <span className={`font-bold text-lg ${isLocked ? 'text-green-400' : 'text-amber-400'}`}>
                      {isLocked ? '₹0' : `₹${feeTotal}`}
                    </span>
                    <span className="text-slate-500 text-[10px] block">
                      {isLocked ? 'Already paid' : `₹150 × ${memberCountAuth}`}
                    </span>
                  </div>
                </div>

                {/* Team Join Code Banner */}
                <div className="p-3.5 rounded-2xl bg-[#1a0000] border border-[#b91c1c]/40 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Squad Join Code</span>
                    <span className="font-bold text-white tracking-widest text-base">{team.teamCode}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(team.teamCode)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0a0c10] border border-[#b91c1c]/60 text-[#b91c1c] hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
                  >
                    {copiedCode === team.teamCode ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode === team.teamCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3" />
                      JOINED MEMBERS ({joinedCount} / {memberCountAuth} declared)
                    </span>
                    {joinedCount < memberCountAuth && !isLocked && (
                      <span className="text-amber-400 text-[10px]">
                        {memberCountAuth - joinedCount} spots remaining
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {team.members?.map((m) => (
                      <div
                        key={m.uid}
                        className="p-3 rounded-xl bg-[#06080c] border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {m.fullName}
                            {m.isLeader && <Badge variant="crimson" size="sm">CAPTAIN</Badge>}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {m.participantId} • {m.college}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 hidden sm:inline">{m.email}</span>
                          {!m.isLeader && isLeader && !isLocked && (
                            <button
                              onClick={() => handleRemoveMember(team.teamId, m.uid, m.participantId, m.fullName, isLocked)}
                              disabled={removingUid === m.uid}
                              className="px-2 py-1 rounded-lg bg-[#1a0000] border border-red-900/60 text-red-400 hover:text-white hover:border-red-600 transition-colors text-[10px] font-mono flex items-center gap-1 shrink-0"
                            >
                              <UserMinus className="w-3 h-3 text-red-500" />
                              {removingUid === m.uid ? 'Removing…' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Join Requests for Captain */}
                {isLeader && !isLocked && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-amber-400 font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                        PENDING JOIN REQUESTS (
                        {leaderRequests.filter((r) => r.teamId === team.teamId && r.status === 'PENDING').length}
                        )
                      </span>
                      <span className="text-slate-500 text-[10px]">Leader Review Required</span>
                    </div>

                    {leaderRequests.filter((r) => r.teamId === team.teamId && r.status === 'PENDING').length === 0 ? (
                      <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800 text-slate-500 text-[11px] font-mono text-center">
                        No pending join requests.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {leaderRequests
                          .filter((r) => r.teamId === team.teamId && r.status === 'PENDING')
                          .map((req) => (
                            <div
                              key={req.requestId}
                              className="p-3 rounded-xl bg-[#1a0a00] border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                            >
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  {req.fullName}
                                  <Badge variant="amber" size="sm">PENDING</Badge>
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {req.participantId} • {req.college}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleApprove(req.requestId)}
                                  disabled={approvingReqId === req.requestId || rejectingReqId === req.requestId}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  {approvingReqId === req.requestId ? 'Approving…' : 'APPROVE'}
                                </button>
                                <button
                                  onClick={() => handleReject(req.requestId)}
                                  disabled={approvingReqId === req.requestId || rejectingReqId === req.requestId}
                                  className="px-3 py-1.5 rounded-xl bg-[#1a0000] border border-red-800 text-red-400 hover:text-white hover:border-red-600 font-bold text-[11px] transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  {rejectingReqId === req.requestId ? 'Rejecting…' : 'REJECT'}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Locked Notice for Captain */}
                {isLeader && isLocked && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      Squad is locked — registered for at least one event. Member composition cannot change. Subsequent event registrations for this squad are <strong>free (₹0)</strong>.
                    </span>
                  </div>
                )}

                {/* Register for Events CTA */}
                <div className="pt-2 border-t border-white/10">
                  <Link
                    to="/events"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#dc2626]/10 hover:bg-[#dc2626]/20 border border-[#dc2626]/40 hover:border-[#dc2626]/70 text-[#dc2626] hover:text-white transition-all text-xs font-mono font-bold"
                  >
                    <Calendar className="w-4 h-4" />
                    {isLocked ? 'Register for More Events (₹0)' : 'Register This Squad for Events →'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[10px]">
                    Squad ID: <strong className="text-slate-300">{team.teamId}</strong>
                  </span>
                  <button
                    onClick={() => handleLeaveOrDisband(team.teamId, isLeader, team.teamName, isLocked)}
                    disabled={leavingTeamId === team.teamId}
                    className={`flex items-center gap-1 transition-colors font-mono font-bold text-[11px] ${
                      isLocked
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-red-400 hover:text-red-300'
                    }`}
                    title={isLocked ? 'Cannot leave/disband after event registration' : undefined}
                  >
                    <LogOut className={`w-3.5 h-3.5 ${isLocked ? 'text-slate-600' : 'text-red-500'}`} />
                    {leavingTeamId === team.teamId ? (isLeader ? 'Disbanding…' : 'Leaving…') : isLeader ? 'DISBAND SQUAD' : 'LEAVE SQUAD'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sent Join Requests Section */}
      {mySentRequests.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-white/10">
          <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> MY SENT JOIN REQUESTS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mySentRequests.map((req) => (
              <div
                key={req.requestId}
                className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Squad Code: {req.teamCode}</span>
                    <span className="font-bold text-white text-sm">{req.teamId}</span>
                  </div>
                  <Badge
                    variant={req.status === 'APPROVED' ? 'green' : req.status === 'REJECTED' ? 'crimson' : 'amber'}
                    size="sm"
                  >
                    {req.status === 'PENDING' ? '⏳ PENDING REVIEW' : req.status === 'APPROVED' ? '✓ APPROVED' : '✕ REJECTED'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Requested: {new Date(req.requestedAt).toLocaleDateString()}</span>
                  {req.status === 'PENDING' && <span className="text-amber-400">Waiting for Captain</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CREATE TEAM MODAL ── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="CREATE NEW TARAS SQUAD"
      >
        <form onSubmit={handleCreateTeamSubmit} className="space-y-5 font-mono text-xs">
          {/* Info banner */}
          <div className="p-3 rounded-xl bg-[#06080c] border border-slate-700 text-[11px] text-slate-300 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">No event selection required.</strong> Create your squad first, share the join code with team members, then go to Events Hub to register together.
            </span>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-[#1a0000] border border-[#b91c1c] text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1.5">Squad Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. TARAS Cyber Knights"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0a0c10] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#b91c1c] transition-colors"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Must be unique globally across all squads.</span>
          </div>

          <div>
            <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1.5">
              Total Member Count <span className="text-red-400">*</span>
              <span className="text-amber-400 ml-2 normal-case font-normal">(including yourself)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                required
                min={1}
                max={10}
                value={memberCount}
                onChange={(e) => setMemberCount(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2.5 bg-[#0a0c10] border border-slate-700 rounded-xl text-white text-center font-bold text-lg focus:outline-none focus:border-[#b91c1c] transition-colors"
              />
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <div>Fee: <span className="text-amber-400 font-bold">₹{memberCount * 150}</span> total</div>
                <div className="text-[10px]">(₹150 × {memberCount} members, paid at event registration)</div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              This locks in your team size for fee calculation. Cannot be changed after event registration.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="glow" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Squad…' : 'Create Squad →'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── JOIN TEAM MODAL ── */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="JOIN EXISTING TARAS SQUAD"
      >
        <form onSubmit={handleJoinTeamSubmit} className="space-y-4 font-mono text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-[#1a0000] border border-[#b91c1c] text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1.5">Enter Squad Join Code</label>
            <input
              type="text"
              required
              placeholder="e.g. TR-89A4ZX"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="w-full px-3 py-3 bg-[#0a0c10] border border-[#b91c1c]/50 rounded-xl text-white text-center font-bold tracking-widest text-base focus:outline-none focus:border-[#b91c1c]"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Ask your team captain for the join code (starts with TR-). A join request will be sent for captain approval.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsJoinModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="glow" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Join Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
