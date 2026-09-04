import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { MOCK_EVENTS } from '../data/events';
import { EventFilter } from '../components/events/EventFilter';
import { EventGrid } from '../components/events/EventGrid';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Trophy, Zap, Shield, Sparkles, ArrowRight } from 'lucide-react';

export const EventsHub: React.FC = () => {
  const { openRegistration } = useOutletContext<{ openRegistration: () => void }>();
  const [eventsList, setEventsList] = useState<any[]>(MOCK_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  useEffect(() => {
    // Real-time Firestore sync for event registration status & capacity
    const unsub = db.subscribeCollection('events', (liveDocs) => {
      if (liveDocs.length > 0) {
        // Merge live Firestore fields (e.g. registrationOpen, maxTeams) with local base data
        const merged = MOCK_EVENTS.map((mockEv) => {
          const live = liveDocs.find((d) => d.id === mockEv.id);
          return live ? { ...mockEv, ...live } : mockEv;
        });
        setEventsList(merged);
      }
    });

    return () => unsub();
  }, []);

  const filteredEvents = useMemo(() => {
    return eventsList.filter((event) => {
      // Category check
      if (selectedCategory !== 'ALL' && event.category !== selectedCategory) {
        return false;
      }
      // Type check
      if (selectedType !== 'ALL' && event.type !== selectedType && event.type !== 'BOTH') {
        return false;
      }
      // Search query check
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = (event.name || event.title || '').toLowerCase().includes(query);
        const matchesTheme = (event.theme || '').toLowerCase().includes(query);
        const matchesDesc = (event.shortDescription || event.description || '').toLowerCase().includes(query);
        const matchesVenue = (event.venue || '').toLowerCase().includes(query);
        return matchesName || matchesTheme || matchesDesc || matchesVenue;
      }

      return true;
    });
  }, [eventsList, searchQuery, selectedCategory, selectedType]);

  return (
    <div className="space-y-10 pb-24">
      {/* Level 1 & 2 Interconnected Web Network Visual Atmosphere */}
      <VisualAtmosphere
        environmentKey="events"
        badgeText="SYMPOSIUM COMPETITIONS HUB"
        title="EVENTS &amp; WORKSHOPS"
        subtitle="Explore technical paper presentations, circuit debugging sprints, hardware IoT hackathons, cine quizzes, encrypted treasure hunts, and industry masterclasses."
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Cinematic Spider-Man Web Track Banner ── */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0a0c10] via-[#120303] to-[#0a0c10] border border-[#dc2626]/40 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-web-grid opacity-20 pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <span className="font-mono-tech text-[10px] font-bold uppercase tracking-widest text-[#dc2626] bg-[#1a0000] px-2.5 py-1 rounded-full border border-[#dc2626]/30">
                CHAMPIONSHIP ARENA // 26 SEPT 2026
              </span>
              <h3 className="font-bebas text-2xl sm:text-3xl text-white tracking-wider uppercase">
                WEAVING HIGH-VOLTAGE ELECTRONICS &amp; CODING TRACKS
              </h3>
              <p className="text-xs text-slate-300 font-mono font-light leading-relaxed">
                Compete for ₹50,000+ in cash prizes, official merit certificates, and IEEE recognition across technical and non-technical domains.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={openRegistration}
                className="px-5 py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-950/50 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-white" /> Register Pass
              </button>
              <Link
                to="/timeline"
                className="px-5 py-2.5 rounded-xl bg-[#0a0c10] border border-slate-700 hover:border-white text-slate-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
              >
                Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* Instant Filter Bar */}
        <EventFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />

        {/* Grid Display */}
        <EventGrid events={filteredEvents} onRegisterClick={openRegistration} />
      </div>
    </div>
  );
};
