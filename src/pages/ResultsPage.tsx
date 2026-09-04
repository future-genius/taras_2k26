import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import type { EventResult } from '../types/eventDay';
import { MOCK_RESULTS } from '../data/results';
import { Badge } from '../components/common/Badge';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Trophy, Medal, Award, Star, Search, Filter, Users, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, cardEntrance } from '../motion/variants';

export const ResultsPage: React.FC = () => {
  const [liveResults, setLiveResults] = useState<EventResult[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const docs = await db.queryWhere('results', 'status', 'PUBLISHED');
        if (docs.length > 0) {
          setLiveResults(docs as unknown as EventResult[]);
        }
      } catch {
        // Fallback to static results if Firestore offline
      }
    };
    fetchResults();
  }, []);

  const rawResults: EventResult[] = liveResults.length > 0
    ? liveResults
    : MOCK_RESULTS.map((m) => ({
        resultId: m.id,
        eventId: m.id,
        eventName: m.eventName,
        category: m.category,
        publishedAt: m.publishedAt,
        winner: { targetId: 'mock-1', name: m.winner.name, college: m.winner.college, score: 95 },
        runnerUp: { targetId: 'mock-2', name: m.runnerUp.name, college: m.runnerUp.college, score: 88 },
        specialMention: m.specialMention ? { targetId: 'mock-3', name: m.specialMention.name, college: m.specialMention.college, score: 82 } : undefined,
        rankings: [
          { targetId: 'mock-1', name: m.winner.name, college: m.winner.college, totalScore: 95, rank: 1, achievement: 'WINNER' },
          { targetId: 'mock-2', name: m.runnerUp.name, college: m.runnerUp.college, totalScore: 88, rank: 2, achievement: 'RUNNER_UP' },
          ...(m.specialMention ? [{ targetId: 'mock-3', name: m.specialMention.name, college: m.specialMention.college, totalScore: 82, rank: 3, achievement: 'SPECIAL_MENTION' as const }] : []),
        ],
        status: 'PUBLISHED',
        createdAt: m.publishedAt,
        updatedAt: m.publishedAt,
      }));

  const filteredResults = rawResults.filter((res) => {
    const matchesCategory = activeCategory === 'ALL' || res.category.toUpperCase() === activeCategory.toUpperCase();
    const matchesSearch =
      res.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.winner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.winner.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.runnerUp.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-10 pb-24">
      <VisualAtmosphere
        environmentKey="results"
        badgeText="SYMPOSIUM PODIUM"
        title="OFFICIAL RESULTS & PODIUM"
        subtitle="Live official declarations of winners, runner-ups, and ranked finalists for TARAS 2K26."
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search & Category Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search event, winner, or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0a0c10] border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#b91c1c]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['ALL', 'TECHNICAL', 'NON-TECHNICAL', 'WORKSHOP'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
                    : 'text-slate-400 hover:text-white bg-[#0a0c10] border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          {filteredResults.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-500 font-mono text-xs rounded-3xl border border-slate-800">
              No published results matching your search criteria.
            </div>
          ) : (
            filteredResults.map((res) => {
              const isExpanded = expandedResultId === res.resultId;
              return (
                <motion.div
                  key={res.resultId}
                  variants={cardEntrance}
                  className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-[#b91c1c]/40 space-y-6 shadow-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="crimson">{res.category}</Badge>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                          OFFICIALLY PUBLISHED
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight uppercase">
                        {res.eventName}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {res.publishedAt ? new Date(res.publishedAt).toLocaleDateString() : 'Official Declaration'}
                    </span>
                  </div>

                  {/* Top 3 Podium Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1st Place / Winner */}
                    <div className="p-5 rounded-2xl bg-[#1a0000] border-2 border-[#b91c1c] space-y-3 shadow-lg shadow-[#b91c1c]/20 relative overflow-hidden">
                      <div className="absolute top-2 right-2 text-amber-500/20">
                        <Trophy className="w-16 h-16" />
                      </div>
                      <div className="flex items-center justify-between text-[#b91c1c] font-mono font-bold text-xs uppercase relative z-10">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Trophy className="w-4 h-4 text-amber-400" /> 1st PLACE
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#b91c1c] text-white text-[10px]">WINNER</span>
                      </div>
                      <div className="relative z-10">
                        <h4 className="font-black text-white text-lg font-mono leading-tight">{res.winner.name}</h4>
                        <p className="text-xs text-slate-300 font-light mt-1">{res.winner.college}</p>
                        {res.winner.members && res.winner.members.length > 0 && (
                          <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-white/10">
                            Members: {res.winner.members.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2nd Place / Runner Up */}
                    <div className="p-5 rounded-2xl bg-[#0a0c10] border border-slate-700/80 space-y-3 relative overflow-hidden">
                      <div className="absolute top-2 right-2 text-slate-600/10">
                        <Medal className="w-16 h-16" />
                      </div>
                      <div className="flex items-center justify-between text-slate-300 font-mono font-bold text-xs uppercase relative z-10">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Medal className="w-4 h-4 text-slate-300" /> 2nd PLACE
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">RUNNER UP</span>
                      </div>
                      <div className="relative z-10">
                        <h4 className="font-black text-white text-lg font-mono leading-tight">{res.runnerUp.name}</h4>
                        <p className="text-xs text-slate-300 font-light mt-1">{res.runnerUp.college}</p>
                        {res.runnerUp.members && res.runnerUp.members.length > 0 && (
                          <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-white/10">
                            Members: {res.runnerUp.members.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3rd Place / Special Mention */}
                    {res.specialMention ? (
                      <div className="p-5 rounded-2xl bg-[#0a0c10] border border-amber-900/40 space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between text-amber-500 font-mono font-bold text-xs uppercase relative z-10">
                          <span className="flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-500" /> SPECIAL MENTION
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px]">HONORABLE</span>
                        </div>
                        <div className="relative z-10">
                          <h4 className="font-black text-white text-lg font-mono leading-tight">{res.specialMention.name}</h4>
                          <p className="text-xs text-slate-300 font-light mt-1">{res.specialMention.college}</p>
                          {res.specialMention.members && res.specialMention.members.length > 0 && (
                            <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-white/10">
                              Members: {res.specialMention.members.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-[#0a0c10]/40 border border-slate-800/60 flex flex-col items-center justify-center text-xs text-slate-500 font-mono">
                        <Award className="w-6 h-6 mb-1 text-slate-700" />
                        No Special Mention Declared
                      </div>
                    )}
                  </div>

                  {/* Leaderboard Collapsible Drawer */}
                  {res.rankings && res.rankings.length > 0 && (
                    <div className="border-t border-white/10 pt-4">
                      <button
                        onClick={() => setExpandedResultId(isExpanded ? null : res.resultId)}
                        className="flex items-center justify-between w-full text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#b91c1c]" />
                          View Complete Finalist Rankings ({res.rankings.length} evaluated)
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 overflow-x-auto rounded-2xl border border-slate-800"
                          >
                            <table className="w-full text-left text-xs font-mono">
                              <thead className="bg-[#0a0c10] text-slate-400 border-b border-slate-800">
                                <tr>
                                  <th className="p-3">Rank</th>
                                  <th className="p-3">Participant / Team</th>
                                  <th className="p-3">College</th>
                                  <th className="p-3 text-right">Score</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 bg-[#06080c]">
                                {res.rankings.map((rk) => (
                                  <tr key={rk.targetId} className="hover:bg-white/5">
                                    <td className="p-3 font-bold text-[#b91c1c]">#{rk.rank}</td>
                                    <td className="p-3">
                                      <span className="font-bold text-white">{rk.name}</span>
                                      {rk.teamMembers && (
                                        <div className="text-[10px] text-slate-500">
                                          {rk.teamMembers.join(', ')}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-slate-300">{rk.college}</td>
                                    <td className="p-3 text-right font-bold text-white">{rk.totalScore}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
};
