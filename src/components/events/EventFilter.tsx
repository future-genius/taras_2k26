import React from 'react';
import { Search, Filter } from 'lucide-react';

interface EventFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export const EventFilter: React.FC<EventFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
}) => {
  const categories = [
    { id: 'ALL', label: 'All Tracks' },
    { id: 'TECHNICAL', label: 'Technical' },
    { id: 'NON_TECHNICAL', label: 'Non-Technical' },
  ];

  const types = [
    { id: 'ALL', label: 'All Formats' },
    { id: 'INDIVIDUAL', label: 'Individual' },
    { id: 'TEAM', label: 'Team Based' },
  ];

  return (
    <div className="glass-panel p-4 md:p-6 rounded-2xl space-y-4 border border-[#1a0000]/40">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search input */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events by name, track, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a0c10] border border-[#1a0000]/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5b0000] focus:ring-1 focus:ring-[#5b0000] transition-all font-mono"
          />
        </div>

        {/* Format selector */}
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full pl-4 pr-8 py-2.5 bg-[#0a0c10] border border-[#1a0000]/60 rounded-xl text-sm text-white focus:outline-none focus:border-[#5b0000] transition-all appearance-none cursor-pointer font-mono"
          >
            {types.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0a0c10] text-white">
                {t.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1a0000]/40">
        <div className="flex items-center gap-1 text-xs font-mono text-slate-500 mr-2">
          <Filter className="w-3.5 h-3.5 text-[#b91c1c]" /> Filter Track:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onCategoryChange(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  isSelected
                    ? 'bg-[#3f0000] text-white shadow-md shadow-black border border-[#5b0000]/60'
                    : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800 hover:border-[#3f0000]/40'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
