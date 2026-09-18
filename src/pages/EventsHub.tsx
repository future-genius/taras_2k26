import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { MOCK_EVENTS } from '../data/events';
import { useAuth } from '../context/AuthContext';
import { isInternalRegNo, isInternalStudent } from '../utils/college';
import { EventFilter } from '../components/events/EventFilter';
import { EventGrid } from '../components/events/EventGrid';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Trophy, Zap, Shield, Sparkles, ArrowRight, Info } from 'lucide-react';

export const EventsHub: React.FC = () => {
  const { openRegistration } = useOutletContext<{ openRegistration: () => void }>();
  const { participantProfile } = useAuth();
  const [eventsList, setEventsList] = useState<any[]>(MOCK_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  const regNo = participantProfile?.registrationNumber?.trim() || '';
  const isInternal = participantProfile ? (isInternalRegNo(regNo) || (regNo === '' && isInternalStudent(participantProfile.college))) : false;

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
      // Participant type eligibility check
      if (participantProfile) {
        if (isInternal) {
          if (!event.allowInternal && event.id !== 'taras-01-int') return false;
        } else {
          if (!event.allowExternal) return false;
        }
      }

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
  }, [eventsList, searchQuery, selectedCategory, selectedType, participantProfile, isInternal]);

  return (
    <div className="space-y-10 pb-24">
      {/* Level 1 & 2 Interconnected Web Network Visual Atmosphere */}
      <VisualAtmosphere
        environmentKey="events"
        badgeText="SYMPOSIUM COMPETITIONS HUB"
        title="EVENTS &amp; COMPETITIONS"
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
                CHAMPIONSHIP ARENA // 10 OCT 2026
              </span>
              <h3 className="font-bebas text-2xl sm:text-3xl text-white tracking-wider uppercase">
                WEAVING HIGH-VOLTAGE ELECTRONICS &amp; CODING TRACKS
              </h3>
              <p className="text-xs text-slate-300 font-mono font-light leading-relaxed">
                Compete for ₹50,000+ in cash prizes, official merit certificates, and IEEE recognition across technical and non-technical domains.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/timeline"
                className="px-5 py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-2"
              >
                View Symposium Schedule →
              </Link>
            </div>
          </div>
        </div>

        {/* SRM VEC Internal Participant Notice */}
        {participantProfile && isInternal && (
          <div className="p-4 rounded-2xl bg-green-950/40 border border-green-500/60 text-green-300 font-mono text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Info className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <strong className="text-white block font-bold">SRM VEC Internal Participant Detected</strong>
                <span>Registration Fee: <span className="text-green-400 font-bold">FREE (₹0)</span> — Eligible ONLY for Paper-X-Verse Internal.</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-green-900/60 text-green-300 text-[10px] font-bold border border-green-500/40 shrink-0">
              INTERNAL PARTICIPANT
            </span>
          </div>
        )}

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
