import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_TIMELINE } from '../../data/schedule';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Badge } from '../../components/common/Badge';
import { Clock, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export const ParticipantSchedulePage: React.FC = () => {
  const { participantProfile } = useAuth();
  const [filter, setFilter] = useState<'ALL' | 'MY_EVENTS' | 'TODAY' | 'UPCOMING' | 'COMPLETED'>('ALL');

  const filteredTimeline = MOCK_TIMELINE.filter((item) => {
    if (filter === 'MY_EVENTS') {
      return item.eventId ? participantProfile?.registeredEvents.includes(item.eventId) : true;
    }
    if (filter === 'COMPLETED') return item.status === 'COMPLETED';
    if (filter === 'UPCOMING') return item.status !== 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-10 pb-20">
      <VisualAtmosphere
        environmentKey="timeline"
        badgeText="PARTICIPANT TIMELINE"
        title="SYMPOSIUM SCHEDULE"
        subtitle="Track event start times, check-in windows, paper presentation slots, and valedictory ceremony."
        height="compact"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Schedule Filter Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'ALL', label: 'All Schedule' },
            { id: 'MY_EVENTS', label: 'My Registered Events' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                filter === btn.id
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800 hover:border-[#b91c1c]/40'
              }`}
            >
              {btn.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Schedule List */}
        <div className="space-y-4">
          {filteredTimeline.map((item) => {
            const isRegistered = item.eventId && participantProfile?.registeredEvents.includes(item.eventId);

            return (
              <div
                key={item.id}
                className={`glass-panel p-5 rounded-2xl border transition-all space-y-3 shadow-lg ${
                  isRegistered
                    ? 'border-[#b91c1c] bg-[#1a0000]/60 shadow-[0_0_20px_rgba(185,28,28,0.2)]'
                    : 'border-white/10'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#b91c1c] bg-[#0a0c10] px-3 py-1 rounded-full border border-slate-800">
                      STAGE 0{item.stage}
                    </span>
                    <h3 className="text-base font-bold text-white font-mono">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {isRegistered && (
                      <Badge variant="red" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> REGISTERED
                      </Badge>
                    )}
                    <Badge variant={item.status === 'COMPLETED' ? 'slate' : 'crimson'}>
                      {item.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-light">{item.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#b91c1c]">
                      <Calendar className="w-3.5 h-3.5" /> {item.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#b91c1c]" /> {item.time}
                    </span>
                  </div>

                  {item.venue && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-[#b91c1c]" /> {item.venue}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
