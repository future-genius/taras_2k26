import React, { useState } from 'react';
import { MOCK_FAQ } from '../data/faq';
import { Badge } from '../components/common/Badge';
import { AccordionItem } from '../components/common/Accordion';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Search } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['ALL', 'General', 'Registration', 'Events', 'Payment', 'Venue', 'Certificates'];

  const filteredFAQ = MOCK_FAQ.filter((item) => {
    if (selectedCategory !== 'ALL' && item.categoryName !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-10 pb-20">
      {/* Level 1 & 2 Minimal Web Atmosphere */}
      <VisualAtmosphere
        environmentKey="faq"
        badgeText="KNOWLEDGE BASE"
        title="FREQUENTLY ASKED QUESTIONS"
        subtitle="Everything you need to know about TARAS 2K26 registration, venue access, QR pass scanning, and event schedules."
        height="compact"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#b91c1c]" />
          <input
            type="text"
            placeholder="Search questions or keywords…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#0a0c10]/90 border border-[#b91c1c]/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#b91c1c] transition-colors shadow-lg"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800 hover:border-[#b91c1c]/40'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Accordion FAQ items */}
        <div className="space-y-0">
          {filteredFAQ.length === 0 ? (
            <div className="text-center py-12 text-slate-400 glass-panel rounded-xl text-sm font-mono border border-white/10">
              No questions found for "{searchQuery}"
            </div>
          ) : (
            filteredFAQ.map((faq) => (
              <AccordionItem key={faq.id} title={faq.question}>
                {faq.answer}
              </AccordionItem>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
