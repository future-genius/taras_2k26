import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_EVENTS } from '../../data/events';
import { EventControlConsole } from '../../components/coordinator/EventControlConsole';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { computeEventLeaderboard } from '../../services/analyticsService';
import { Users, Shield, Radio, Trophy, Activity } from 'lucide-react';

// ─── Live Leaderboard Component ───────────────────────────────────────────────
const CoordinatorLeaderboard: React.FC<{ eventId: string; eventName: string }> = ({
  eventId,
  eventName,
}) => {
  const { data: scorecards, loading } = useFirestoreCollection('scorecards', {
    whereField: 'eventId',
    whereValue: eventId,
  });

  const leaderboard = computeEventLeaderboard(scorecards as Record<string, unknown>[]);

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/30 space-y-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white font-mono">
              LIVE LEADERBOARD — {eventName}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Real-time ranking from submitted scorecards · auto-updates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-[10px] font-mono text-slate-400">
            {loading ? 'Syncing…' : `${leaderboard.length} ranked`}
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading live scores…" />
      ) : leaderboard.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs font-mono space-y-2">
          <Trophy className="w-8 h-8 mx-auto text-slate-700" />
          <p>No submitted scorecards for this event yet.</p>
          <p className="text-[10px] text-slate-600">Rankings will appear as judges submit scores.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.targetId}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                entry.rank === 1
                  ? 'bg-[#1a0000] border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.2)]'
                  : entry.rank === 2
                  ? 'bg-[#0e1017] border-slate-700'
                  : entry.rank === 3
                  ? 'bg-[#0a0c10] border-amber-900/40'
                  : 'bg-[#06080c] border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                    entry.rank === 1
                      ? 'bg-[#b91c1c] text-white'
                      : entry.rank === 2
                      ? 'bg-slate-300 text-black'
                      : entry.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  #{entry.rank}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-xs font-mono truncate">
                    {entry.targetName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Judge: {entry.judgeName}
                    {entry.submittedAt && (
                      <> · {new Date(entry.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-xl font-black font-mono ${entry.rank === 1 ? 'text-white' : 'text-slate-200'}`}>
                  {entry.totalScore}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">pts</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-base font-black text-white font-mono">{leaderboard.length}</div>
            <div className="text-[10px] font-mono text-slate-400">Ranked</div>
          </div>
          <div>
            <div className="text-base font-black text-white font-mono">{leaderboard[0]?.totalScore ?? 0}</div>
            <div className="text-[10px] font-mono text-amber-400">Top Score</div>
          </div>
          <div>
            <div className="text-base font-black text-white font-mono">
              {leaderboard.length > 0
                ? Math.round(leaderboard.reduce((s, e) => s + e.totalScore, 0) / leaderboard.length)
                : 0}
            </div>
            <div className="text-[10px] font-mono text-cyan-400">Avg Score</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const CoordinatorDashboard: React.FC = () => {
  const { participantProfile, user, logout, assignedEventIds } = useAuth();

  const assignedEvents = MOCK_EVENTS.filter(
    (e) => assignedEventIds.includes(e.id) || assignedEventIds.length === 0
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(assignedEvents[0]?.id || '');
  const currentEvent = assignedEvents.find((e) => e.id === selectedEventId) || assignedEvents[0];

  return (
    <div className="space-y-10 pb-24">
      <VisualAtmosphere
        environmentKey="eventsHub"
        badgeText="EVENT COORDINATOR CONSOLE"
        title="EVENT ATTENDANCE & SCORING"
        subtitle="Manage round-by-round attendance, verify prerequisite venue check-ins, and submit shortlisted finalists for your track."
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile & Controls Bar */}
        <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-[#b91c1c]/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1a0000] border-2 border-[#b91c1c] flex items-center justify-center text-[#b91c1c] shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white font-mono">{participantProfile?.fullName || 'Event Coordinator'}</h2>
                <Badge variant="red">COORDINATOR</Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Assigned Track Controls: {assignedEvents.map((e) => e.name).join(', ')}
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={logout} className="font-mono text-xs">
            Sign Out
          </Button>
        </div>

        {/* Strict Gate Check-In Prerequisite Banner */}
        <div className="p-4 rounded-2xl bg-[#1a0000]/80 border border-[#dc2626]/60 flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-200 font-light leading-relaxed font-mono">
            <strong className="text-white">Strict Gate Check-In Prerequisite:</strong> Event coordinators can only check in participants if their <span className="text-green-400 font-bold">venueCheckIn</span> (Gate Pass) has already been confirmed by the Ground Floor Registration Desk.
          </p>
        </div>

        {/* 6-Step Operational Workflow Tracker */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#dc2626]" /> TRACK OPERATIONAL LIFECYCLE WORKFLOW
            </span>
            <span className="text-[10px] font-mono text-slate-400">Sequential Event Milestone Engine</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            {[
              { step: '01', name: 'Event Check-In', desc: 'Verify gate prerequisite', status: 'ACTIVE' },
              { step: '02', name: 'Attendance', desc: 'Record PRESENT / ABSENT', status: 'ACTIVE' },
              { step: '03', name: 'Scoring', desc: 'Evaluate criteria rubrics', status: 'ACTIVE' },
              { step: '04', name: 'Score Lock', desc: 'Submit & lock scorecards', status: 'ACTIVE' },
              { step: '05', name: 'Rankings', desc: 'Deterministic leaderboard', status: 'ACTIVE' },
              { step: '06', name: 'Podium Publish', desc: 'Admin official declaration', status: 'LOCKED' },
            ].map((item) => (
              <div key={item.step} className="p-3 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#dc2626] font-bold">STEP {item.step}</span>
                  <span className={item.status === 'ACTIVE' ? 'text-green-400 font-bold' : 'text-slate-500'}>
                    {item.status === 'ACTIVE' ? '● READY' : '🔒 ADMIN'}
                  </span>
                </div>
                <div className="text-xs font-bold text-white font-mono">{item.name}</div>
                <p className="text-[10px] text-slate-400 font-mono leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Track Selector */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">
            Assigned Events:
          </span>
          {assignedEvents.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEventId(ev.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                currentEvent?.id === ev.id
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
                  : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${currentEvent?.id === ev.id ? 'text-[#b91c1c]' : 'text-slate-500'}`} />
              {ev.name}
            </button>
          ))}
        </div>

        {/* Event Control Console — existing Phase 8 component, untouched */}
        {currentEvent && (
          <EventControlConsole event={currentEvent} coordinatorUid={user?.uid || 'coordinator-uid'} />
        )}

        {/* Phase 9: Live Leaderboard */}
        {currentEvent && (
          <CoordinatorLeaderboard eventId={currentEvent.id} eventName={currentEvent.name} />
        )}
      </div>
    </div>
  );
};
