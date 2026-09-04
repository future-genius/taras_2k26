import React, { useState } from 'react';
import { MOCK_TEAM } from '../data/team';
import { Badge } from '../components/common/Badge';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, cardEntrance } from '../motion/variants';

export const TeamPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FACULTY' | 'OFFICE_BEARER' | 'EVENT_COORDINATOR'>('FACULTY');
  const filteredTeam = MOCK_TEAM.filter((m) => m.category === activeTab);

  const tabs = [
    { id: 'FACULTY', label: 'Faculty Leadership' },
    { id: 'OFFICE_BEARER', label: 'Student Office Bearers' },
    { id: 'EVENT_COORDINATOR', label: 'Event Heads' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Level 1 & 2 Dark Professional Visual Atmosphere */}
      <VisualAtmosphere
        environmentKey="team"
        badgeText="ORGANIZING COMMITTEE"
        title="MEET THE TARAS TEAM"
        subtitle="Faculty Conveners, Student Office Bearers, and Event Coordinators managing TARAS 2K26."
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 border-b border-white/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold font-mono rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#0a0c10] border border-slate-800'
              }`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Team Cards */}
        <motion.div
          key={activeTab}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTeam.map((member) => (
            <motion.div
              key={member.id}
              variants={cardEntrance}
              className="glass-panel rounded-xl p-6 border border-[#b91c1c]/30 hover:border-[#b91c1c]/60 transition-colors space-y-4 flex flex-col justify-between group relative overflow-hidden shadow-lg"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#b91c1c]/20 to-transparent pointer-events-none rounded-tr-xl" />
              <div className="space-y-3">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-xl bg-[#0a0c10] border border-[#b91c1c]/50 flex items-center justify-center text-[#b91c1c] font-extrabold text-xl font-mono">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono group-hover:text-[#b91c1c] transition-colors">{member.name}</h3>
                  <span className="text-xs font-semibold text-[#b91c1c] block">{member.role}</span>
                  <span className="text-xs text-slate-400 block">{member.department}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-white/10 space-y-1 text-xs text-slate-300">
                {member.assignedEventName && (
                  <div className="text-[11px] font-mono text-[#b91c1c] mb-1">
                    Event: {member.assignedEventName}
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-[#b91c1c]" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-[#b91c1c]" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
