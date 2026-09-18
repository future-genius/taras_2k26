import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { TARASEvent } from '../../types/event';
import type { EventTeam } from '../../types/team';
import { useAuth } from '../../context/AuthContext';
import { subscribeToUserTeams } from '../../services/teamService';
import { db } from '../../config/firebase';
import { RegistrationWizardModal } from '../registration/RegistrationWizardModal';
import { isInternalRegNo, isInternalStudent } from '../../utils/college';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Clock,
  MapPin,
  Users,
  Trophy,
  Calendar,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Check,
  AlertCircle,
  Building2,
  Lock,
  Megaphone,
  Medal,
  Award,
  Maximize2,
  Eye,
  X,
} from 'lucide-react';

interface EventDetailViewProps {
  event: TARASEvent;
  onRegisterClick: () => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ event }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rounds' | 'rules' | 'coordinators' | 'announcements' | 'results'>('overview');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [userTeams, setUserTeams] = useState<EventTeam[]>([]);
  const [eventAnnouncements, setEventAnnouncements] = useState<any[]>([]);
  const [eventResult, setEventResult] = useState<any | null>(null);

  const { user, participantProfile } = useAuth();
  const navigate = useNavigate();

  const isAlreadyRegistered = participantProfile?.registeredEvents?.includes(event.id);
  const registeredEventCount = participantProfile?.registeredEvents?.length || 0;
  const isMaxLimitReached = registeredEventCount >= 3 && !isAlreadyRegistered;

  const isTeamEvent = event.maxTeamSize > 1;
  const currentUid = user?.uid || participantProfile?.uid || '';

  // Internal vs External checks
  const userRegNo = participantProfile?.registrationNumber?.trim() || '';
  const isInternal = participantProfile ? (isInternalRegNo(userRegNo) || (userRegNo === '' && isInternalStudent(participantProfile.college))) : false;
  const isInternalPaperPresentation = event.id === 'taras-01-int' || event.slug === 'paper-x-verse-internal';
  const isFreeEvent = isInternal && isInternalPaperPresentation;
  const isIneligible = participantProfile ? (isInternal ? !isInternalPaperPresentation : isInternalPaperPresentation) : false;

  // Load user teams real-time
  useEffect(() => {
    if (!currentUid) return;
    const uidsToWatch = new Set<string>([currentUid]);
    if (participantProfile?.uid) uidsToWatch.add(participantProfile.uid);
    if (user?.uid) uidsToWatch.add(user.uid);

    const teamsMap = new Map<string, EventTeam>();
    const unsubs: (() => void)[] = [];

    uidsToWatch.forEach((uid) => {
      const unsub = subscribeToUserTeams(uid, (teams) => {
        teams.forEach((t) => teamsMap.set(t.teamId, t));
        setUserTeams(Array.from(teamsMap.values()));
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [currentUid, participantProfile?.uid, user?.uid]);

  // Real-time listener for event-specific announcements
  useEffect(() => {
    const unsub = db.subscribeCollection('announcements', (docs) => {
      const filtered = docs.filter(
        (d: any) => d.eventId === event.id || d.targetEventId === event.id
      );
      setEventAnnouncements(filtered);
    });
    return () => unsub();
  }, [event.id]);

  // Real-time listener for event-specific results / winners
  useEffect(() => {
    const unsub = db.subscribeCollection('results', (docs) => {
      const found = docs.find(
        (d: any) => d.eventId === event.id && (d.status === 'PUBLISHED' || d.status === 'published')
      );
      setEventResult(found || null);
    });
    return () => unsub();
  }, [event.id]);

  // Eligible team logic
  const eligibleTeam = isTeamEvent
    ? userTeams.find(
        (t) =>
          t.leaderUid === currentUid ||
          (participantProfile?.uid && t.leaderUid === participantProfile.uid)
      ) ||
      userTeams[0] ||
      null
    : null;

  const handleAction = () => {
    if (!participantProfile && !user) {
      navigate('/participant/login');
      return;
    }

    if (isAlreadyRegistered) {
      navigate('/participant/my-events');
      return;
    }

    if (isMaxLimitReached) {
      return;
    }

    setIsWizardOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20 font-mono">
      {/* ── Breadcrumb Navigation ── */}
      <div className="flex items-center justify-between text-xs">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 font-bold text-[#b91c1c] hover:text-[#cc0000] transition-colors uppercase tracking-wider font-mono"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Events Hub
        </Link>
        <span className="text-slate-500 font-mono text-[10px] hidden sm:inline-block">
          Events Hub / {event.slug}
        </span>
      </div>

      {/* ── Top Event Image View Banner (Full Uncropped View) ── */}
      {(event.bannerImage || event.image) && (
        <div className="relative group rounded-3xl overflow-hidden border-2 border-[#b91c1c]/60 shadow-[0_0_35px_rgba(185,28,28,0.3)] bg-[#050608] flex items-center justify-center p-3 sm:p-6">
          <div
            onClick={() => setIsImageFullscreen(true)}
            className="w-full min-h-[300px] max-h-[550px] relative flex items-center justify-center overflow-hidden cursor-pointer"
          >
            <img
              src={event.bannerImage || event.image}
              alt={event.name}
              className="w-full h-full object-contain object-center max-h-[520px] rounded-2xl transition-transform duration-500 ease-out group-hover:scale-102"
            />

            {/* Top Badge Overlay */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#1a0000]/95 text-white border border-[#b91c1c]/80 backdrop-blur-md shadow-xl flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-[#b91c1c]" /> OFFICIAL EVENT IMAGE // {event.name}
              </span>
            </div>

            {/* Hover Expand Prompt */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10 rounded-2xl">
              <span className="px-5 py-2.5 rounded-xl bg-[#1a0000]/95 text-white border border-[#b91c1c] text-xs font-mono font-bold uppercase tracking-wider shadow-2xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <Maximize2 className="w-4 h-4 text-[#b91c1c]" /> Click to View Full Resolution Image
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {isImageFullscreen && (event.bannerImage || event.image) && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setIsImageFullscreen(false)}
        >
          <button
            onClick={() => setIsImageFullscreen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-[#1a0000] text-white border border-[#b91c1c] hover:bg-red-600 transition-colors z-50 shadow-2xl"
            title="Close Full Image View"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-[#b91c1c]/50 shadow-2xl">
            <img
              src={event.bannerImage || event.image}
              alt={event.name}
              className="w-full h-full object-contain max-h-[85vh] rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* ── Hero Header Card ── */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 relative overflow-hidden space-y-6 border border-[#b91c1c]/40">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant={event.category === 'TECHNICAL' ? 'red' : 'crimson'}>
              {event.category.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">{event.type}</Badge>
            {isFreeEvent && <Badge variant="green">FREE ENTRY</Badge>}
          </div>
          <span className="text-xs font-mono font-bold text-[#b91c1c] bg-[#1a0000] px-3 py-1 rounded-full border border-[#b91c1c]/40">
            TARAS 2K26 OFFICIAL TRACK
          </span>
        </div>

        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase font-mono">
            {event.name}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-[#b91c1c] italic">
            "{event.theme}"
          </p>
          <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed font-light pt-1">
            {event.shortDescription}
          </p>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Team Format</span>
              <span className="text-sm font-bold text-white">
                {event.minTeamSize === event.maxTeamSize
                  ? `${event.minTeamSize} Member`
                  : `${event.minTeamSize} - ${event.maxTeamSize} Members`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Duration</span>
              <span className="text-sm font-bold text-white">{event.duration}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Top Prize</span>
              <span className="text-sm font-bold text-[#b91c1c]">{event.prizes[0]?.amount || 'Trophy'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Registration Fee</span>
              <span className={`text-sm font-bold ${isFreeEvent ? 'text-green-400' : 'text-white'}`}>
                {isFreeEvent ? 'FREE (₹0)' : (event.registrationFee || '₹ 200 per participant')}
              </span>
            </div>
          </div>
        </div>

        {/* CTA & Registration Action Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 relative z-10">
          <div className="text-xs text-slate-300">
            <span className="text-[#b91c1c] font-bold">Venue:</span> {event.venue}
          </div>

          {isAlreadyRegistered ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-400 flex items-center gap-1 font-bold">
                <Check className="w-4 h-4" /> CONFIRMED REGISTERED
              </span>
              <Link to="/participant/pass">
                <Button variant="glow" size="md">
                  View Digital Pass &amp; QR
                </Button>
              </Link>
            </div>
          ) : isMaxLimitReached ? (
            <div className="flex items-center gap-2 bg-[#1a0000] px-4 py-2 rounded-xl border border-red-800">
              <Lock className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs font-bold text-red-400">
                You have reached the maximum limit of 3 events.
              </span>
            </div>
          ) : isTeamEvent && userTeams.length === 0 ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-xs text-amber-400 flex items-center gap-1.5 font-bold bg-[#1a0000] px-3 py-1.5 rounded-xl border border-amber-500/40">
                <AlertCircle className="w-4 h-4 text-amber-400" /> SQUAD REQUIRED
              </span>
              <Button
                variant="glow"
                size="md"
                onClick={() => navigate('/participant/dashboard#my-squads-section')}
                className="text-xs"
              >
                CREATE SQUAD IN TEAM HUB →
              </Button>
            </div>
          ) : (
            <Button
              variant="glow"
              size="lg"
              icon={<Zap className="w-5 h-5" />}
              onClick={handleAction}
            >
              {isTeamEvent
                ? eligibleTeam
                  ? `REGISTER SQUAD: ${eligibleTeam.teamName.toUpperCase()}`
                  : 'REGISTER SQUAD NOW'
                : `REGISTER FOR ${event.name.toUpperCase()}`}
            </Button>
          )}
        </div>
      </div>

      {/* 2-Step Registration & Payment Wizard Modal */}
      <RegistrationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        event={event}
        userTeams={userTeams}
      />

      {/* ── Tabs Navigation ── */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview & Details' },
          { id: 'rounds', label: `Rounds (${event.rounds.length})` },
          { id: 'rules', label: 'Rules & Criteria' },
          { id: 'coordinators', label: 'Event Head & Contact' },
          ...(eventAnnouncements.length > 0
            ? [{ id: 'announcements', label: `Announcements (${eventAnnouncements.length})` }]
            : []),
          ...(eventResult
            ? [{ id: 'results', label: 'Official Winner Declaration' }]
            : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#1a0000] text-white shadow-md border border-[#b91c1c]'
                : 'text-slate-400 hover:text-white hover:bg-[#0a0c10]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Panels ── */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#b91c1c]" /> About {event.name}
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
                {event.about}
              </p>
            </div>

            {/* Eligibility Grid */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#b91c1c]" /> Eligibility Guidelines
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300 font-light">
                {event.eligibility.map((el, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
                    <span>{el}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prize Pool Breakdown */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#b91c1c]" /> Prize Pool &amp; Awards
              </h3>
              <div className={`grid grid-cols-1 ${event.prizes.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
                {event.prizes.map((prize, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#0a0c10] border border-white/10 space-y-1 text-center"
                  >
                    <span className="text-xs font-bold text-[#b91c1c] block">{prize.position} Place</span>
                    <span className="text-xl font-black text-white">{prize.amount}</span>
                    {prize.perks && (
                      <span className="text-[11px] text-slate-400 block font-light">{prize.perks.join(' • ')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Details Display (FOR PAID EVENTS ONLY — ₹200) */}
            {!isFreeEvent && (
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#b91c1c]/50 bg-gradient-to-r from-[#0a0c10] via-[#120404] to-[#0a0c10] space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <Building2 className="w-5 h-5 text-[#b91c1c]" />
                  <div>
                    <h3 className="text-lg font-bold text-white">OFFICIAL BANK TRANSFER DETAILS (₹200)</h3>
                    <p className="text-[10px] text-slate-400">SRM VALLIAMMAI ENGINEERING COLLEGE • KATTANKULATHUR</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">NAME OF ACCOUNT</span>
                    <span className="text-white font-bold">VALLIAMMAI ENGINEERING COLLEGE</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">NAME OF BANK</span>
                    <span className="text-white font-bold">CITY UNION BANK LTD</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">BANK ACCOUNT NO</span>
                    <span className="text-white font-bold text-sm text-[#b91c1c]">117109000031450</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">IFSC CODE NO</span>
                    <span className="text-white font-bold">CIUB0000117</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">BRANCH</span>
                    <span className="text-white font-bold">TAMBARAM BRANCH (EXTN COUNTER)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06080c] border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">MICR NO</span>
                    <span className="text-white font-bold">600054011</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rounds Tab */}
        {activeTab === 'rounds' && (
          <div className="space-y-4">
            {event.rounds.map((round) => (
              <div key={round.number} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1a0000] border border-[#b91c1c]/60 text-[#b91c1c] flex items-center justify-center font-bold text-base shrink-0">
                      0{round.number}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{round.name}</h4>
                      <span className="text-xs text-[#b91c1c]">Duration: {round.duration}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 bg-[#0a0c10] px-3 py-1 rounded-full border border-slate-800">
                    {round.venue || 'Venue details will be updated later.'}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-light">{round.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-xl font-bold text-white">Event Rules &amp; Guidelines — {event.name}</h3>
            <ul className="space-y-2.5 text-sm text-slate-300 font-light">
              {event.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#b91c1c] font-bold">0{idx + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Event Head & Coordinators Tab */}
        {activeTab === 'coordinators' && (
          <div className="space-y-6">
            {event.eventHead && (
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-[#b91c1c]/60 bg-gradient-to-r from-[#1a0000] via-[#0a0c10] to-[#0a0c10] space-y-4 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-[#b91c1c] uppercase tracking-wider">
                    OFFICIAL EVENT HEAD // {event.name}
                  </span>
                  <Badge variant="red">TRACK HEAD</Badge>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {event.eventHead.image && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[#b91c1c] shrink-0 shadow-xl bg-[#06080c]">
                      <img
                        src={event.eventHead.image}
                        alt={event.eventHead.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center w-full">
                    <div>
                      <h3 className="text-2xl font-black text-white">{event.eventHead.name}</h3>
                      <p className="text-xs text-slate-300 mt-1">Event Head — {event.name}</p>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#b91c1c]" />
                        <a href={`tel:+91${event.eventHead.phone}`} className="hover:text-white transition-colors">
                          +91 {event.eventHead.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#b91c1c]" />
                        <a href={`mailto:${event.eventHead.email}`} className="hover:text-white transition-colors truncate">
                          {event.eventHead.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center gap-3">
                  {event.eventHead.linkedin && (
                    <a
                      href={event.eventHead.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#0a0c10] border border-slate-700 hover:border-[#b91c1c] text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <span>LinkedIn Profile</span>
                    </a>
                  )}
                  {event.eventHead.instagram && (
                    <a
                      href={event.eventHead.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#0a0c10] border border-slate-700 hover:border-[#b91c1c] text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <span>Instagram Profile</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {(() => {
              const otherCoordinators = event.coordinators.filter(
                (coord) =>
                  !event.eventHead ||
                  coord.name.toUpperCase().trim() !== event.eventHead.name.toUpperCase().trim()
              );

              if (otherCoordinators.length === 0) return null;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {otherCoordinators.map((coord, i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">{coord.name}</h4>
                        <span className="text-xs text-[#b91c1c] font-semibold block">{coord.role}</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-white/10">
                        {coord.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[#b91c1c]" />
                            <span>{coord.phone}</span>
                          </div>
                        )}
                        {coord.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#b91c1c]" />
                            <span className="truncate">{coord.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#b91c1c]" /> Announcements for {event.name}
            </h3>
            {eventAnnouncements.map((ann, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-[#b91c1c]/40 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-[#b91c1c]">{ann.title || 'Official Update'}</span>
                  <span className="text-[10px] text-slate-400">{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-light">{ann.message || ann.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Results / Winners Tab */}
        {activeTab === 'results' && eventResult && (
          <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/50 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-black text-white">{event.name} — OFFICIAL WINNERS</h3>
              </div>
              <Badge variant="green">PUBLISHED</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {eventResult.winner && (
                <div className="p-4 rounded-2xl bg-[#1a0000] border-2 border-[#b91c1c] space-y-2">
                  <span className="text-xs font-bold text-amber-400 block">1st PLACE — WINNER</span>
                  <h4 className="text-lg font-black text-white">{eventResult.winner.name}</h4>
                  <p className="text-xs text-slate-300">{eventResult.winner.college}</p>
                </div>
              )}
              {eventResult.runnerUp && (
                <div className="p-4 rounded-2xl bg-[#0a0c10] border border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">2nd PLACE — RUNNER UP</span>
                  <h4 className="text-lg font-black text-white">{eventResult.runnerUp.name}</h4>
                  <p className="text-xs text-slate-300">{eventResult.runnerUp.college}</p>
                </div>
              )}
              {eventResult.specialMention && (
                <div className="p-4 rounded-2xl bg-[#0a0c10] border border-amber-900/40 space-y-2">
                  <span className="text-xs font-bold text-amber-500 block">SPECIAL MENTION</span>
                  <h4 className="text-lg font-black text-white">{eventResult.specialMention.name}</h4>
                  <p className="text-xs text-slate-300">{eventResult.specialMention.college}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
