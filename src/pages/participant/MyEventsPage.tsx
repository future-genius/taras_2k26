import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, firestore } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MOCK_EVENTS } from '../../data/events';
import type { EventTeam } from '../../types/team';
import type { EventRegistration } from '../../types/registration';
import type { TARASEvent } from '../../types/event';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { VisualCard } from '../../components/visual/VisualCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { RegistrationWizardModal } from '../../components/registration/RegistrationWizardModal';
import {
  Clock,
  MapPin,
  QrCode,
  Sparkles,
  Award,
  Users,
  Copy,
  CheckCircle2,
  AlertCircle,
  LogOut,
  CreditCard,
  Lock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export const MyEventsPage: React.FC = () => {
  const { participantProfile, leaveTeam } = useAuth();
  const [teamsMap, setTeamsMap] = useState<Record<string, EventTeam>>({});
  const [registrationsMap, setRegistrationsMap] = useState<Record<string, EventRegistration>>({});
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);
  const [teamActionError, setTeamActionError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Registration Modal state
  const [selectedEventForModal, setSelectedEventForModal] = useState<TARASEvent | null>(null);
  const [selectedRegForModal, setSelectedRegForModal] = useState<EventRegistration | null>(null);

  const fetchParticipantData = async () => {
    if (!participantProfile?.uid) return;
    try {
      // 1. Fetch user teams
      const allTeams = await db.getCollection('teams');
      const pTeams = (allTeams as unknown as EventTeam[]).filter((t) =>
        t.memberUids?.includes(participantProfile.uid)
      );
      const tMap: Record<string, EventTeam> = {};
      pTeams.forEach((t) => {
        if (t.eventId) {
          tMap[t.eventId] = t;
        }
        if (t.teamId) {
          tMap[t.teamId] = t;
        }
      });
      setTeamsMap(tMap);

      // 2. Fetch user registrations
      const regsRef = collection(firestore, 'registrations');
      const q = query(regsRef, where('uid', '==', participantProfile.uid));
      const snap = await getDocs(q);
      const rMap: Record<string, EventRegistration> = {};
      snap.docs.forEach((d) => {
        const reg = d.data() as EventRegistration;
        rMap[reg.eventId] = reg;
      });
      setRegistrationsMap(rMap);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchParticipantData();
  }, [participantProfile?.uid]);

  if (!participantProfile) return null;

  const registeredEventObjects = MOCK_EVENTS.filter(
    (e) => participantProfile.registeredEvents.includes(e.id) || registrationsMap[e.id]
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    setLeavingTeamId(teamId);
    setTeamActionError(null);
    try {
      await leaveTeam(teamId);
      await fetchParticipantData();
    } catch (err: any) {
      setTeamActionError(err.message || 'Failed to leave team.');
    } finally {
      setLeavingTeamId(null);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <VisualAtmosphere
        environmentKey="participantDashboard"
        badgeText="REGISTERED SYMPOSIUM TRACKS"
        title="MY REGISTRATIONS &amp; PAYMENTS"
        subtitle="View registration status, payment verification state, squad rosters, and digital entry passes."
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 font-mono">
        {teamActionError && (
          <div className="p-4 rounded-2xl bg-[#1a0000] border border-[#b91c1c] text-xs font-mono text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <span>{teamActionError}</span>
          </div>
        )}

        {registeredEventObjects.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/10">
            <Sparkles className="w-12 h-12 text-[#b91c1c] mx-auto" />
            <h3 className="text-xl font-bold text-white font-mono">NO REGISTERED EVENTS</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Explore all 6 technical and non-technical competitions in the Events Hub and complete your entry registration.
            </p>
            <Link to="/events">
              <Button variant="glow" size="lg">
                Explore Events Hub Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registeredEventObjects.map((ev) => {
              const regDoc = registrationsMap[ev.id];
              const attState = participantProfile.attendanceStatus[ev.id] || 'NOT_MARKED';
              const shortlistState = participantProfile.shortlistStatus[ev.id] || 'NOT_EVALUATED';
              const teamDoc = teamsMap[ev.id];
              const isLeader = teamDoc?.leaderUid === participantProfile.uid;

              const pStat = regDoc?.paymentStatus || (regDoc?.status === 'CONFIRMED' ? 'VERIFIED' : 'PENDING');
              const isVerified = pStat === 'VERIFIED' || regDoc?.status === 'CONFIRMED';

              return (
                <VisualCard
                  key={ev.id}
                  title={ev.name}
                  subtitle={ev.shortDescription}
                  category={ev.category === 'TECHNICAL' ? 'technical' : 'non-technical'}
                  badge={ev.type === 'TEAM' ? 'TEAM TRACK' : 'INDIVIDUAL'}
                >
                  <div className="space-y-4 text-xs font-mono">
                    <p className="italic text-[#b91c1c]">"{ev.theme}"</p>

                    <div className="grid grid-cols-2 gap-2 text-slate-300 border-t border-white/10 pt-3">
                      <div className="flex items-center gap-1 truncate">
                        <Clock className="w-3.5 h-3.5 text-[#b91c1c]" /> {ev.duration}
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#b91c1c]" /> {ev.venue}
                      </div>
                    </div>

                    {/* Payment Status Card */}
                    <div className="p-4 rounded-2xl bg-[#0a0c10] border border-[#b91c1c]/40 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#b91c1c]" /> PAYMENT LIFECYCLE
                        </span>
                        <Badge variant={pStat === 'VERIFIED' ? 'green' : pStat === 'REJECTED' ? 'crimson' : 'amber'}>
                          {pStat === 'PENDING' ? '⏳ PENDING REVIEW' : pStat === 'VERIFIED' ? '✓ PAYMENT VERIFIED' : '✕ REJECTED'}
                        </Badge>
                      </div>

                      {regDoc && (
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Registration ID:</span>
                            <span className="font-bold text-[#b91c1c]">{regDoc.registrationId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Expected Fee:</span>
                            <span className="text-white font-bold">₹{regDoc.feeAmount || 200}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Submitted UTR:</span>
                            <span className="text-amber-300 font-bold">{regDoc.utrNumber || 'N/A'}</span>
                          </div>

                          {regDoc.rejectionReason && (
                            <div className="p-2.5 rounded-xl bg-[#1a0000] border border-red-800 text-red-300 mt-2">
                              <strong>Rejection Reason:</strong> {regDoc.rejectionReason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Team Details Block */}
                    {ev.type === 'TEAM' && teamDoc && (
                      <div className="p-4 rounded-2xl bg-[#0a0c10] border border-[#b91c1c]/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#b91c1c]" />
                            <span className="font-bold text-white text-xs">{teamDoc.teamName}</span>
                          </div>
                          <Badge variant={teamDoc.members.length >= teamDoc.minTeamSize ? 'green' : 'amber'} size="sm">
                            {teamDoc.members.length >= teamDoc.minTeamSize ? 'READY' : 'FORMING'}
                          </Badge>
                        </div>

                        {/* Join Code Display */}
                        <div className="flex items-center justify-between text-xs bg-[#1a0000] p-2.5 rounded-xl border border-[#b91c1c]/30">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Team Join Code:</span>
                            <span className="font-bold text-white tracking-wider text-sm">{teamDoc.teamCode}</span>
                          </div>
                          <button
                            onClick={() => handleCopyCode(teamDoc.teamCode)}
                            className="p-1.5 rounded-lg bg-[#0a0c10] text-[#b91c1c] hover:text-white border border-[#b91c1c]/40 transition-colors flex items-center gap-1 text-[10px]"
                          >
                            {copiedCode === teamDoc.teamCode ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedCode === teamDoc.teamCode ? 'Copied' : 'Copy'}
                          </button>
                        </div>

                        {/* Team Roster */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>SQUAD ROSTER ({teamDoc.members.length}/{teamDoc.maxTeamSize})</span>
                            <span>Min Required: {teamDoc.minTeamSize}</span>
                          </div>
                          <div className="space-y-1">
                            {teamDoc.members.map((m) => (
                              <div
                                key={m.uid}
                                className="p-2 rounded-lg bg-[#06080c] border border-slate-800 flex items-center justify-between text-[11px]"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-bold text-white truncate">{m.fullName}</span>
                                  {m.isLeader && <Badge variant="crimson" size="sm">CAPTAIN</Badge>}
                                </div>
                                <span className="text-[10px] text-slate-500 shrink-0">{m.participantId}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Leave Team Trigger */}
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => handleLeaveTeam(teamDoc.teamId)}
                            disabled={leavingTeamId === teamDoc.teamId}
                            className="text-[10px] text-slate-400 hover:text-[#b91c1c] flex items-center gap-1 transition-colors"
                          >
                            <LogOut className="w-3 h-3" />
                            {leavingTeamId === teamDoc.teamId ? 'Leaving…' : isLeader ? 'Disband / Leave Team' : 'Leave Team'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/events/${ev.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full justify-center text-xs">
                          Event Details
                        </Button>
                      </Link>

                      {!isVerified ? (
                        <Button
                          variant="glow"
                          size="sm"
                          onClick={() => {
                            setSelectedEventForModal(ev);
                            setSelectedRegForModal(regDoc || null);
                          }}
                          className="text-xs bg-[#b91c1c]"
                        >
                          {pStat === 'REJECTED' ? 'RESUBMIT PAYMENT' : 'SUBMIT PAYMENT PROOF'}
                        </Button>
                      ) : (
                        <Link to="/participant/pass">
                          <Button variant="glow" size="sm" className="text-xs" icon={<QrCode className="w-3.5 h-3.5" />}>
                            Digital Pass
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </VisualCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Registration & Payment Proof Wizard Modal */}
      {selectedEventForModal && (
        <RegistrationWizardModal
          isOpen={!!selectedEventForModal}
          onClose={() => {
            setSelectedEventForModal(null);
            setSelectedRegForModal(null);
            fetchParticipantData();
          }}
          event={selectedEventForModal}
          existingRegistration={selectedRegForModal}
          userTeams={Object.values(teamsMap)}
        />
      )}
    </div>
  );
};
