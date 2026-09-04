import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { TARASEvent } from '../../types/event';
import type { EventTeam } from '../../types/team';
import { useAuth } from '../../context/AuthContext';
import { subscribeToUserTeams } from '../../services/teamService';
import { RegistrationWizardModal } from '../registration/RegistrationWizardModal';
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
} from 'lucide-react';

interface EventDetailViewProps {
  event: TARASEvent;
  onRegisterClick: () => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ event }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rounds' | 'rules' | 'coordinators'>('overview');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [userTeams, setUserTeams] = useState<EventTeam[]>([]);

  const { user, participantProfile } = useAuth();
  const navigate = useNavigate();

  const isAlreadyRegistered = participantProfile?.registeredEvents?.includes(event.id);
  const isTeamEvent = event.maxTeamSize > 1;
  const currentUid = user?.uid || participantProfile?.uid || '';

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

  // Teams are event-independent: any squad user belongs to is eligible (prioritizing captain squad)
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

    setIsWizardOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
      {/* Back Link */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#b91c1c] hover:text-[#cc0000] transition-colors uppercase tracking-wider font-mono"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Events Hub
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 relative overflow-hidden space-y-6 border border-[#b91c1c]/40">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant={event.category === 'TECHNICAL' ? 'red' : 'crimson'}>
              {event.category.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">{event.type}</Badge>
          </div>
          <span className="text-xs font-mono font-bold text-[#b91c1c] bg-[#1a0000] px-3 py-1 rounded-full border border-[#b91c1c]/40">
            TARAS 2K26 OFFICIAL TRACK
          </span>
        </div>

        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-mono uppercase">
            {event.name}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-[#b91c1c] italic font-mono">
            "{event.theme}"
          </p>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Team Format</span>
              <span className="text-sm font-bold text-white font-mono">
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
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Duration</span>
              <span className="text-sm font-bold text-white font-mono">{event.duration}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Top Prize</span>
              <span className="text-sm font-bold text-[#b91c1c] font-mono">{event.prizes[0]?.amount || 'Trophy'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a0000] border border-[#b91c1c]/40 text-[#b91c1c]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Date</span>
              <span className="text-sm font-bold text-white font-mono">26 Sept 2026</span>
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 relative z-10">
          <div className="text-xs font-mono text-slate-300">
            <span className="text-[#b91c1c] font-bold">Venue:</span> {event.venue}
          </div>

          {isAlreadyRegistered ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-green-400 flex items-center gap-1 font-bold">
                <Check className="w-4 h-4" /> CONFIRMED REGISTERED
              </span>
              <Link to="/participant/pass">
                <Button variant="glow" size="md">
                  View Pass & QR
                </Button>
              </Link>
            </div>
          ) : isTeamEvent && userTeams.length === 0 ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5 font-bold bg-[#1a0000] px-3 py-1.5 rounded-xl border border-amber-500/40">
                <AlertCircle className="w-4 h-4 text-amber-400" /> SQUAD REQUIRED
              </span>
              <Button
                variant="glow"
                size="md"
                onClick={() => navigate('/participant/dashboard#my-squads-section')}
                className="font-mono text-xs"
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview & Details' },
          { id: 'rounds', label: `Rounds Structure (${event.rounds.length})` },
          { id: 'rules', label: 'Rules & Criteria' },
          { id: 'coordinators', label: 'Student Coordinators' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold font-mono rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#1a0000] text-white shadow-md border border-[#b91c1c]'
                : 'text-slate-400 hover:text-white hover:bg-[#0a0c10]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#b91c1c]" /> About the Event
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
                {event.about}
              </p>
            </div>

            {/* Eligibility Grid */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#b91c1c]" /> Eligibility Criteria
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
              <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#b91c1c]" /> Prize Pool & Awards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {event.prizes.map((prize, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#0a0c10] border border-white/10 space-y-1 text-center"
                  >
                    <span className="text-xs font-bold text-[#b91c1c] block font-mono">{prize.position} Place</span>
                    <span className="text-xl font-black text-white font-mono">{prize.amount}</span>
                    {prize.perks && (
                      <span className="text-[11px] text-slate-400 block font-light">{prize.perks.join(' • ')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rounds Tab */}
        {activeTab === 'rounds' && (
          <div className="space-y-4">
            {event.rounds.map((round) => (
              <div key={round.number} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1a0000] border border-[#b91c1c]/60 text-[#b91c1c] flex items-center justify-center font-bold text-base shrink-0 font-mono">
                      0{round.number}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white font-mono">{round.name}</h4>
                      <span className="text-xs font-mono text-[#b91c1c]">Duration: {round.duration}</span>
                    </div>
                  </div>
                  {round.venue && (
                    <span className="text-xs font-mono text-slate-400 bg-[#0a0c10] px-3 py-1 rounded-full border border-slate-800">
                      {round.venue}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-light">{round.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-xl font-bold text-white font-mono">Event Rules & Guidelines</h3>
            <ul className="space-y-2.5 text-sm text-slate-300 font-light">
              {event.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#b91c1c] font-bold font-mono">0{idx + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Coordinators Tab */}
        {activeTab === 'coordinators' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {event.coordinators.map((coord, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">{coord.name}</h4>
                  <span className="text-xs text-[#b91c1c] font-semibold block font-mono">{coord.role}</span>
                </div>
                <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-white/10 font-mono">
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
        )}
      </div>
    </div>
  );
};
