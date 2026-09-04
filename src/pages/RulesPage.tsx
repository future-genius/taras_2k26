import React, { useState } from 'react';
import { MOCK_RULES } from '../data/rules';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { ShieldAlert } from 'lucide-react';

export const RulesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredRules = selectedCategory === 'ALL'
    ? MOCK_RULES
    : MOCK_RULES.filter((r) => r.category === selectedCategory);

  return (
    <div className="space-y-10 pb-20">
      {/* Level 1 & 2 Tactical Environment Visual Layer */}
      <VisualAtmosphere
        environmentKey="rules"
        badgeText="SYMPOSIUM GUIDELINES"
        title="RULES & REGULATIONS"
        subtitle="Official guidelines governing entry, team conduct, venue verification, and digital certificate eligibility for TARAS 2K26."
        height="compact"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800 hover:border-[#b91c1c]/40'
            }`}
          >
            ALL
          </button>
          {MOCK_RULES.map((sec) => (
            <button
              key={sec.category}
              onClick={() => setSelectedCategory(sec.category)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedCategory === sec.category
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800 hover:border-[#b91c1c]/40'
              }`}
            >
              {sec.category.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Rules List */}
        <div className="space-y-6">
          {filteredRules.map((sec) => (
            <Card key={sec.category} hoverEffect={false}>
              <h3 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <ShieldAlert className="w-5 h-5 text-[#b91c1c]" />
                {sec.category} Regulations
              </h3>
              <ul className="space-y-3 text-slate-300 text-sm leading-relaxed font-light">
                {sec.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a0000] border border-[#b91c1c]/60 text-[#b91c1c] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
