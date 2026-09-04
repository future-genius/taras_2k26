import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeToUserTeams, getTeamJoinRequestsForLeader, getParticipantJoinRequests } from '../../services/teamService';
import { MOCK_EVENTS } from '../../data/events';
import { MOCK_ANNOUNCEMENTS } from '../../data/announcements';
import { VisualCard } from '../../components/visual/VisualCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import spideyEyes from '../../assets/spidey-eyes.jpg';
import { getParticipantCertificates } from '../../services/certificateService';
import { CertificatePreview } from '../../components/certificates/CertificatePreview';
import { CertificateDownloadButton } from '../../components/certificates/CertificateDownloadButton';
import { CertificateTemplate } from '../../components/certificates/CertificateTemplate';
import { TeamHub } from '../../components/team/TeamHub';
import type { CertificateRecord } from '../../types/certificate';
import type { EventTeam, TeamJoinRequest } from '../../types/team';
import {
  QrCode,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Radio,
  Award,
  Sparkles,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  BarChart3,
  Activity,
  TrendingUp,
  Eye,
  Download,
  Users,
  Copy,
  Check,
  X,
  Edit3,
  UserMinus,
} from 'lucide-react';

export const ParticipantDashboard: React.FC = () => {
  const {
    participantProfile,
    role,
    logout,
    leaveTeam,
    disbandTeam,
    approveJoinRequest,
    rejectJoinRequest,
    renameTeam,
    removeMemberFromTeam,
  } = useAuth();

  const navigate = useNavigate();

  // ── Guard: redirect non-participants to their correct terminal ──────────────
  useEffect(() => {
    if (!participantProfile) return;
    const r = (role as string || '').toLowerCase();
    if (r === 'registration_staff') {
      navigate('/registration', { replace: true });
    } else if (r === 'staff' || r === 'registration_team') {
      navigate('/staff/dashboard', { replace: true });
    } else if (r === 'coordinator' || r === 'event_head') {
      navigate('/coordinator/dashboard', { replace: true });
    } else if (r === 'admin' || r === 'super_admin' || r === 'president') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [participantProfile, role, navigate]);

  // Participant Certificates
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);

  // Participant Teams & Join Requests
  const [userTeams, setUserTeams] = useState<EventTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [leaderRequests, setLeaderRequests] = useState<TeamJoinRequest[]>([]);
  const [mySentRequests, setMySentRequests] = useState<TeamJoinRequest[]>([]);
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Rename & Member Removal state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [newTeamNameInput, setNewTeamNameInput] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [removingMemberUid, setRemovingMemberUid] = useState<string | null>(null);

  // Hidden download refs per certificate
  const certRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

    const fetchCerts = async () => {
      setLoadingCerts(true);
      try {
        const list = await getParticipantCertificates(
          participantProfile.participantId,
          participantProfile.uid
        );
        setCertificates(list);
      } catch (err) {
        console.warn('Error loading participant certificates:', err);
      } finally {
        setLoadingCerts(false);
      }
    };

    fetchCerts();
    fetchJoinRequests();

    // Subscribe to real-time team updates
    setLoadingTeams(true);
    const unsubTeams = subscribeToUserTeams(
      participantProfile.uid,
      (teams) => {
        setUserTeams(teams);
        setLoadingTeams(false);
      },
      (err) => {
        console.warn('Error in team subscription:', err);
        setLoadingTeams(false);
      }
    );

    return () => {
      unsubTeams();
    };
  }, [participantProfile?.uid]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const [approvingReqId, setApprovingReqId] = useState<string | null>(null);
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null);

  const handleApproveRequest = async (requestId: string) => {
    setApprovingReqId(requestId);
    setTeamError(null);
    try {
      await approveJoinRequest(requestId);
      await fetchJoinRequests();
    } catch (err: any) {
      console.error('ACTION: APPROVE_FAILED', {
        requestId,
        leaderUid: participantProfile?.uid,
        error: err,
        message: err.message,
      });
      setTeamError(err.message || 'Failed to approve join request.');
    } finally {
      setApprovingReqId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setRejectingReqId(requestId);
    setTeamError(null);
    try {
      await rejectJoinRequest(requestId);
      await fetchJoinRequests();
    } catch (err: any) {
      console.error('ACTION: REJECT_FAILED', {
        requestId,
        leaderUid: participantProfile?.uid,
        error: err,
        message: err.message,
      });
      setTeamError(err.message || 'Failed to reject join request.');
    } finally {
      setRejectingReqId(null);
    }
  };

  const handleStartRename = (teamId: string, currentName: string) => {
    setEditingTeamId(teamId);
    setNewTeamNameInput(currentName);
    setTeamError(null);
  };

  const handleSaveRename = async (teamId: string) => {
    if (!newTeamNameInput.trim()) return;
    setIsRenaming(true);
    setTeamError(null);
    try {
      await renameTeam(teamId, newTeamNameInput.trim());
      setEditingTeamId(null);
    } catch (err: any) {
      setTeamError(err.message || 'Failed to rename team.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRemoveMember = async (
    teamId: string,
    targetMemberUid: string,
    targetParticipantId: string,
    memberName: string
  ) => {
    if (!window.confirm(`Are you sure you want to remove "${memberName}" from the squad roster?`)) return;
    setRemovingMemberUid(targetMemberUid);
    setTeamError(null);
    try {
      await removeMemberFromTeam(teamId, targetMemberUid, targetParticipantId);
    } catch (err: any) {
      setTeamError(err.message || 'Failed to remove member.');
    } finally {
      setRemovingMemberUid(null);
    }
  };

  const handleLeaveOrDisbandTeam = async (teamId: string, isLeader: boolean, teamName: string) => {
    if (isLeader) {
      if (!window.confirm(`Are you sure you want to DISBAND and delete squad "${teamName}"?\n\nThis will permanently remove the team and cancel all pending join requests and squad member registrations.`)) return;
      setLeavingTeamId(teamId);
      setTeamError(null);
      try {
        await disbandTeam(teamId);
      } catch (err: any) {
        setTeamError(err.message || 'Failed to disband squad.');
      } finally {
        setLeavingTeamId(null);
      }
    } else {
      if (!window.confirm(`Are you sure you want to leave squad "${teamName}"?`)) return;
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

  if (!participantProfile) return null;

  const registeredEventObjects = MOCK_EVENTS.filter((e) =>
    participantProfile.registeredEvents.includes(e.id)
  );

  const getNextActionGuidance = () => {
    if (!participantProfile.venueCheckIn) {
      return {
        status: 'GATE ENTRY PENDING',
        title: 'Show your Digital Pass at the Venue Gate',
        instruction:
          'Present your Digital QR Pass to the Registration Desk staff at the Ground Floor Quadrangle to confirm campus entry.',
        actionLabel: 'Open Digital Pass',
        actionPath: '/participant/pass',
        badge: 'STEP 1: VENUE GATE CHECK-IN',
        variant: 'amber' as const,
      };
    }

    const registeredCount = participantProfile.registeredEvents.length;
    if (registeredCount === 0) {
      return {
        status: 'NO EVENTS REGISTERED',
        title: 'Choose your Competition Tracks',
        instruction:
          'You have completed campus gate entry! Select from technical paper presentations, circuit debugging, and hackathons.',
        actionLabel: 'Explore Events',
        actionPath: '/events',
        badge: 'SELECT TRACKS',
        variant: 'red' as const,
      };
    }

    const attendanceEntries = Object.entries(participantProfile.attendanceStatus || {});
    const presentEvents = attendanceEntries.filter(([, status]) => status === 'PRESENT');

    if (presentEvents.length === 0) {
      return {
        status: 'VENUE CHECKED IN ✓',
        title: 'Proceed to your Registered Event Halls',
        instruction:
          'Venue check-in complete! Head to your assigned department hall and present your Pass to the Event Coordinator for Hall Check-In.',
        actionLabel: 'View Schedule & Venues',
        actionPath: '/participant/schedule',
        badge: 'STEP 2: EVENT HALL CHECK-IN',
        variant: 'crimson' as const,
      };
    }

    if (certificates.length > 0 || participantProfile.certificateStatus === 'READY') {
      return {
        status: 'CERTIFICATE AVAILABLE ✓',
        title: 'Your Official E-Certificate is Issued',
        instruction:
          'Congratulations! Your official merit/participation certificate has been issued with unique cryptographic verification.',
        actionLabel: 'View My Certificates',
        actionPath: '#my-certificates-section',
        badge: 'STEP 4: CERTIFICATE ISSUED',
        variant: 'green' as const,
      };
    }

    return {
      status: 'IN COMPETITION / EVALUATING',
      title: 'Event Attendance Recorded',
      instruction: `You are checked in for ${presentEvents.length} event(s). Judges are currently scoring presentations and competitions. Official results will appear on the live podium page.`,
      actionLabel: 'Check Live Results',
      actionPath: '/results',
      badge: 'STEP 3: SCORING & RESULTS',
      variant: 'crimson' as const,
    };
  };

  const guidance = getNextActionGuidance();

  return (
    <div className="space-y-10 pb-24">
      {/* Custom Spider-Man Eyes Hero */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: '52vh' }}>
        <img
          src={spideyEyes}
          alt="TARAS 2K26 Spider-Man Noir Eyes"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ transform: 'scale(1.03)' }}
          loading="eager"
        />

        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#050608] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050608] via-[#050608]/80 to-transparent" />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 30% at 33% 50%, rgba(220,38,38,0.18) 0%, transparent 70%), ' +
              'radial-gradient(ellipse 55% 30% at 67% 50%, rgba(220,38,38,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,6,8,0.7) 100%)' }} />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-28 pb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold uppercase tracking-widest bg-black/70 border border-[#dc2626]/50 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] mb-5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse" />
            WELCOME BACK // {participantProfile.participantId}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-[#ff2b2b] via-[#ff6666] to-[#dc2626] bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(220,38,38,0.85)] filter">
              {participantProfile.fullName}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-light font-mono drop-shadow-lg">
            {participantProfile.college} &bull; {participantProfile.department} ({participantProfile.year} Year)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Guidance Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl transition-all ${
            guidance.variant === 'green'
              ? 'bg-[#060e08] border-green-500/60 shadow-green-950/20'
              : 'bg-[#0a0c10] border-[#dc2626]/70 shadow-[0_0_40px_rgba(220,38,38,0.12)]'
          }`}
        >
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant={guidance.variant === 'amber' ? 'red' : guidance.variant} size="sm">
                {guidance.badge}
              </Badge>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                WHAT DO I DO NOW?
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">{guidance.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 font-mono font-light leading-relaxed">
              {guidance.instruction}
            </p>
          </div>

          {guidance.actionPath.startsWith('#') ? (
            <a
              href={guidance.actionPath}
              className="px-6 py-3.5 rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap shadow-lg shadow-red-900/30 shrink-0 flex items-center gap-2"
            >
              {guidance.actionLabel} <ChevronRight className="w-4 h-4" />
            </a>
          ) : (
            <Link
              to={guidance.actionPath}
              className="px-6 py-3.5 rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap shadow-lg shadow-red-900/30 shrink-0 flex items-center gap-2"
            >
              {guidance.actionLabel} <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Quick Action Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link
            to="/participant/pass"
            className="p-4 rounded-xl bg-[#0a0c10] border border-[#dc2626] hover:border-[#f87171] transition-all flex flex-col items-center justify-center text-center shadow-lg shadow-[#dc2626]/20 group"
          >
            <QrCode className="w-6 h-6 text-[#b91c1c] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-white font-mono">My QR Pass</span>
            <span className="text-[9px] font-mono text-[#b91c1c]">Instant Scan</span>
          </Link>

          <a
            href="#my-squads-section"
            className="p-4 rounded-xl bg-[#0a0c10] border border-[#b91c1c]/40 hover:border-[#b91c1c] transition-all flex flex-col items-center justify-center text-center group"
          >
            <Users className="w-6 h-6 text-[#b91c1c] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-white font-mono">My Squads</span>
            <span className="text-[9px] font-mono font-bold text-amber-400">{userTeams.length} Squad(s)</span>
          </a>

          <Link
            to="/participant/my-events"
            className="p-4 rounded-xl bg-[#0a0c10] border border-slate-800 hover:border-[#b91c1c]/40 transition-all flex flex-col items-center justify-center text-center group"
          >
            <Calendar className="w-6 h-6 text-[#b91c1c] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-white font-mono">My Events</span>
            <span className="text-[9px] font-mono text-slate-400">{participantProfile.registeredEvents.length} Registered</span>
          </Link>

          <Link
            to="/participant/schedule"
            className="p-4 rounded-xl bg-[#0a0c10] border border-slate-800 hover:border-[#b91c1c]/40 transition-all flex flex-col items-center justify-center text-center group"
          >
            <Clock className="w-6 h-6 text-[#b91c1c] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-white font-mono">Schedule</span>
            <span className="text-[9px] font-mono text-slate-400">Timeline</span>
          </Link>

          <Link
            to="/participant/profile"
            className="p-4 rounded-xl bg-[#0a0c10] border border-slate-800 hover:border-[#b91c1c]/40 transition-all flex flex-col items-center justify-center text-center group"
          >
            <User className="w-6 h-6 text-[#b91c1c] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-white font-mono">My Profile</span>
            <span className="text-[9px] font-mono text-slate-400">Edit Details</span>
          </Link>

          <button
            onClick={logout}
            className="p-4 rounded-xl bg-[#0a0c10] border border-slate-800 hover:border-red-900 transition-all flex flex-col items-center justify-center text-center group"
          >
            <LogOut className="w-6 h-6 text-slate-500 group-hover:text-red-500 transition-colors mb-1.5" />
            <span className="text-xs font-bold text-slate-400 group-hover:text-red-400 font-mono">Logout</span>
            <span className="text-[9px] font-mono text-slate-500">Sign Out</span>
          </button>
        </div>

        {/* ── TEAM HUB SECTION ── */}
        <div id="my-squads-section" className="scroll-mt-24">
          <TeamHub />
        </div>

        {/* ── MY E-CERTIFICATES SECTION ── */}
        <div id="my-certificates-section" className="space-y-6 scroll-mt-24">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono text-[#b91c1c] uppercase tracking-widest font-bold">
                CRYPTOGRAPHIC CREDENTIALS
              </span>
              <h2 className="text-2xl font-black text-white font-mono flex items-center gap-2">
                <Award className="w-6 h-6 text-[#d97706]" /> MY OFFICIAL E-CERTIFICATES
              </h2>
            </div>
            <Badge variant={certificates.length > 0 ? 'green' : 'amber'}>
              {certificates.length} ISSUED
            </Badge>
          </div>

          {loadingCerts ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              Loading your certificates…
            </div>
          ) : certificates.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-3">
              <Award className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white font-mono">NO CERTIFICATES ISSUED YET</h4>
              <p className="text-slate-400 text-xs max-w-lg mx-auto font-mono leading-relaxed">
                E-certificates are generated by TARAS 2K26 administration after your event attendance and evaluation are confirmed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => {
                const cId = cert.certificateId || cert.certId || '';
                const isRev = cert.status === 'revoked' || cert.status === 'REVOKED';

                return (
                  <div
                    key={cId}
                    className="glass-panel p-6 rounded-3xl border border-[#b91c1c]/40 space-y-4 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#d97706] uppercase tracking-widest font-bold block">
                          {cert.certificateType}
                        </span>
                        <h3 className="text-lg font-extrabold text-white font-mono">{cert.eventName}</h3>
                      </div>
                      {isRev ? (
                        <Badge variant="red" size="sm">REVOKED</Badge>
                      ) : (
                        <Badge variant="green" size="sm">VALID RECORD ✓</Badge>
                      )}
                    </div>

                    <div className="space-y-1 font-mono text-xs text-slate-300 bg-[#0a0c10] p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Certificate ID:</span>
                        <span className="font-bold text-[#b91c1c]">{cId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Issued Date:</span>
                        <span>{new Date(cert.issuedAt || cert.issueDate || '').toLocaleDateString()}</span>
                      </div>
                      {cert.achievement && (
                        <div className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                          <span className="text-slate-500">Achievement:</span>
                          <span className="text-amber-400 font-bold">{cert.achievement}</span>
                        </div>
                      )}
                    </div>

                    {/* Hidden Full Canvas Element for Instant Local Download */}
                    <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
                      <CertificateTemplate
                        ref={(el) => {
                          certRefs.current[cId] = el;
                        }}
                        certificate={cert}
                      />
                    </div>

                    {!isRev && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewCert(cert)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                          className="flex-1 justify-center text-xs"
                        >
                          Preview
                        </Button>
                        <CertificateDownloadButton
                          targetRef={{ current: certRefs.current[cId] }}
                          certificateId={cId}
                          variant="glow"
                          size="sm"
                          className="flex-1 justify-center text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Registered Events Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono text-[#b91c1c] uppercase tracking-widest font-bold">MY SYMPOSIUM TRACKS</span>
              <h2 className="text-2xl font-black text-white font-mono">REGISTERED COMPETITIONS</h2>
            </div>

            <Link to="/events">
              <Button variant="outline" size="sm" icon={<ChevronRight className="w-4 h-4" />}>
                Browse All Events
              </Button>
            </Link>
          </div>

          {registeredEventObjects.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl text-center space-y-4 border border-white/10">
              <Sparkles className="w-10 h-10 text-[#b91c1c] mx-auto" />
              <h3 className="text-lg font-bold text-white font-mono">NO EVENTS REGISTERED YET</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                You haven't registered for any competitions yet. Explore our technical presentation tracks, circuit debugging, and hackathons.
              </p>
              <Link to="/events">
                <Button variant="glow" size="md">
                  Explore Events Hub
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEventObjects.map((ev) => {
                const attState = participantProfile.attendanceStatus[ev.id] || 'NOT_MARKED';
                const shortlistState = participantProfile.shortlistStatus[ev.id] || 'NOT_EVALUATED';

                return (
                  <VisualCard
                    key={ev.id}
                    title={ev.name}
                    subtitle={ev.shortDescription}
                    category={ev.category === 'TECHNICAL' ? 'technical' : 'non-technical'}
                    badge="CONFIRMED"
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 border-t border-white/10 pt-3">
                        <div className="flex items-center gap-1 truncate">
                          <Clock className="w-3.5 h-3.5 text-[#b91c1c]" /> {ev.duration}
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#b91c1c]" /> {ev.venue}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-mono">
                        <span className="text-slate-400">Attendance:</span>
                        <span className={`font-bold ${attState === 'PRESENT' ? 'text-green-400' : 'text-[#b91c1c]'}`}>
                          {attState}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Shortlist:</span>
                        <span className="font-bold text-white">{shortlistState}</span>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                        <Link to={`/events/${ev.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Event
                          </Button>
                        </Link>
                        <Link to="/participant/pass">
                          <Button variant="glow" size="sm" className="text-xs" icon={<QrCode className="w-3.5 h-3.5" />}>
                            View Pass
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </VisualCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {previewCert && (
        <CertificatePreview certificate={previewCert} onClose={() => setPreviewCert(null)} />
      )}
    </div>
  );
};
