import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_EVENTS } from '../../data/events';
import { EventControlConsole } from '../../components/coordinator/EventControlConsole';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Users, Shield, Radio, Activity } from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const { participantProfile, user, logout, assignedEventIds } = useAuth();

  // Strict Event Scope: Coordinator can ONLY see and access assigned event tracks
  const assignedEvents = MOCK_EVENTS.filter((e) => assignedEventIds.includes(e.id));

  const [selectedEventId, setSelectedEventId] = useState<string>(assignedEvents[0]?.id || '');
  const currentEvent = assignedEvents.find((e) => e.id === selectedEventId) || assignedEvents[0];

  if (assignedEvents.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#1a0000] border border-[#b91c1c] text-center space-y-4 font-mono">
          <div className="w-14 h-14 rounded-2xl bg-[#2a0000] border border-[#b91c1c] flex items-center justify-center mx-auto text-[#b91c1c]">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            No Event Track Assigned
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your coordinator account is currently not assigned to an active TARAS 2K26 event track. Contact the TARAS President or Registration Team to configure your track assignment.
          </p>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={logout} className="text-xs font-mono">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24">
      <VisualAtmosphere
        environmentKey="eventsHub"
        badgeText="EVENT COORDINATOR CONSOLE"
        title="EVENT ATTENDANCE & ROUND 1 SELECTION"
        subtitle="Manage track attendance, verify venue check-ins, and record Round 1 selection decisions for your assigned event."
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

        {/* Track Operational Lifecycle Workflow */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#dc2626]" /> TRACK OPERATIONAL LIFECYCLE WORKFLOW
            </span>
            <span className="text-[10px] font-mono text-slate-400">Strict Track Boundary Engine</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { step: '01', name: 'Gate Verification', desc: 'Prerequisite venue clearance', status: 'ACTIVE' },
              { step: '02', name: 'Event Check-In', desc: 'Hall attendance present/absent', status: 'ACTIVE' },
              { step: '03', name: 'Round 1 Selection', desc: 'Selected / Not Selected', status: 'ACTIVE' },
              { step: '04', name: 'Official Sync', desc: 'Instant President sync', status: 'ACTIVE' },
            ].map((item) => (
              <div key={item.step} className="p-3 rounded-2xl bg-[#0a0c10] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#dc2626] font-bold">STEP {item.step}</span>
                  <span className="text-green-400 font-bold">● ACTIVE</span>
                </div>
                <div className="text-xs font-bold text-white font-mono">{item.name}</div>
                <p className="text-[10px] text-slate-400 font-mono leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Track Selector (Only if coordinator manages multiple assigned tracks) */}
        {assignedEvents.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">
              Assigned Tracks:
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
        )}

        {/* Event Control Console */}
        {currentEvent && (
          <EventControlConsole
            event={currentEvent}
            coordinatorUid={user?.uid || 'coordinator-uid'}
          />
        )}
      </div>
    </div>
  );
};
