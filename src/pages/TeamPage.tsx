import React, { useState, useMemo } from 'react';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { TeamHero } from '../components/team/TeamHero';
import { TeamCategoryNav } from '../components/team/TeamCategoryNav';
import { TeamProfileShowcase } from '../components/team/TeamProfileShowcase';
import {
  getMembersByCategory,
  type TeamCategoryKey,
} from '../data/teamData';
import teamBgDesktop from '../assets/team-bg-desktop.jpg';
import teamBgMobile from '../assets/team-bg-mobile.jpg';

export const TeamPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<TeamCategoryKey>('office-bearer');
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Get active members filtered by current category
  const activeMembers = useMemo(() => {
    return getMembersByCategory(activeCategory);
  }, [activeCategory]);

  // Category selection handler (resets showcase index)
  const handleSelectCategory = (category: TeamCategoryKey) => {
    if (category !== activeCategory) {
      setActiveCategory(category);
      setCurrentIndex(0);
    }
  };

  // Profile navigation handler
  const handleNavigateIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative min-h-screen bg-[#050608] text-white pb-24 overflow-hidden">
      {/* ── Fixed Device-Specific Responsive Background System ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* DESKTOP / LAPTOP BACKGROUND (> 768px): Regular TARAS 16:9 Cinematic Composition */}
        <div
          className="hidden md:block absolute inset-0 bg-cover bg-no-repeat bg-center opacity-75 brightness-95 contrast-110 transition-all duration-700"
          style={{ backgroundImage: `url(${teamBgDesktop})` }}
        />

        {/* MOBILE / PHONE BACKGROUND (<= 768px): Dedicated 9:16 Portrait Mobile Composition */}
        <div
          className="block md:hidden absolute inset-0 bg-cover bg-no-repeat bg-center opacity-85 brightness-100 contrast-110 transition-all duration-700"
          style={{ backgroundImage: `url(${teamBgMobile})` }}
        />

        {/* Controlled Dark Atmospheric Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050608]/75 via-[#050608]/40 to-[#050608]/85" />

        {/* Subtle Red Atmospheric Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(185, 28, 28, 0.25) 0%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative z-10 space-y-8">
        {/* ── Level 1 & 2 Dark Professional Visual Atmosphere Header ── */}
        <VisualAtmosphere
          environmentKey="team"
          badgeText="ORGANIZING COMMITTEE"
          title="MEET THE TARAS TEAM"
          subtitle="Faculty Conveners, Student Office Bearers, Event Heads, and Core Team managing TARAS 2K26."
          height="compact"
          transparentBg={true}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* ── Hero / Introduction Statement ── */}
          <TeamHero />

          {/* ── Category Navigation Bar ── */}
          <TeamCategoryNav
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
          />

          {/* ── Primary Editorial Profile Showcase ── */}
          <main className="w-full pt-2">
            <TeamProfileShowcase
              members={activeMembers}
              currentIndex={currentIndex}
              onNavigateIndex={handleNavigateIndex}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

