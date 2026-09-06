import React from 'react';
import { motion } from 'framer-motion';
import { TEAM_CATEGORIES, type TeamCategoryKey } from '../../data/teamData';

interface TeamCategoryNavProps {
  activeCategory: TeamCategoryKey;
  onSelectCategory: (category: TeamCategoryKey) => void;
}

export const TeamCategoryNav: React.FC<TeamCategoryNavProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <nav className="w-full flex justify-center py-2" aria-label="Team Categories">
      <div className="inline-flex p-1.5 rounded-2xl bg-[#0a0c10]/90 border border-slate-800 backdrop-blur-md max-w-full overflow-x-auto no-scrollbar shadow-2xl">
        {TEAM_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTeamCategoryHighlight"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1a0000] via-[#7f1d1d] to-[#1a0000] border border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 uppercase tracking-wider">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
