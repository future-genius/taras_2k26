import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { MOCK_ANNOUNCEMENTS } from '../data/announcements';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { useSpiderSense } from '../components/visual/SpiderSenseNotification';
import { Radio, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AnnouncementsPage: React.FC = () => {
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [announcements, setAnnouncements] = useState<any[]>(MOCK_ANNOUNCEMENTS);
  const { notify } = useSpiderSense();

  useEffect(() => {
    // Real-time listener for live dispatches
    const unsub = db.subscribeCollection('announcements', (liveDocs) => {
      if (liveDocs.length > 0) {
        // Merge with mock or replace with real firestore announcements sorted by date desc
        const sorted = [...liveDocs, ...MOCK_ANNOUNCEMENTS].sort(
          (a: any, b: any) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime()
        );
        // Deduplicate by ID
        const seen = new Set();
        const unique = sorted.filter((item: any) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        setAnnouncements(unique);
      }
    });

    return () => unsub();
  }, []);

  const filtered = filterPriority === 'ALL'
    ? announcements
    : announcements.filter((a) => a.priority === filterPriority);

  return (
    <div className="space-y-10 pb-20">
      {/* Level 1 & 2 Dynamic Network Broadcast Environment */}
      <VisualAtmosphere
        environmentKey="announcements"
        badgeText="SPIDER SENSE BROADCAST MATRIX"
        title="SYMPOSIUM BROADCASTS"
        subtitle="Real-time updates, seat matrix changes, template releases, and venue notifications."
        height="compact"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Test Notification Trigger */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            icon={<Sparkles className="w-4 h-4 text-[#b91c1c]" />}
            onClick={() => notify('SHORTLISTED', 'Team Shortlist Released', 'Paper-X-Verse Round 1 abstract shortlisted participants notified.')}
          >
            Trigger Spider Sense Alert
          </Button>
        </div>

        {/* Priority Filter */}
        <div className="flex justify-center gap-2">
          {['ALL', 'URGENT', 'HIGH', 'NORMAL'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                filterPriority === p
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800 hover:border-[#b91c1c]/40'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Announcements Stream */}
        <motion.div layout className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((ann) => (
              <motion.div
                key={ann.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className={`glass-panel rounded-xl p-5 border transition-colors space-y-3 shadow-lg ${
                  ann.priority === 'URGENT'
                    ? 'border-[#b91c1c] bg-[#1a0000]/80 shadow-[0_0_20px_rgba(185,28,28,0.2)]'
                    : 'border-[#b91c1c]/30 hover:border-[#b91c1c]/60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 shrink-0 ${ann.priority === 'URGENT' ? 'text-[#b91c1c] animate-pulse' : 'text-[#b91c1c]'}`} />
                    <h3 className="text-base font-bold text-white font-mono">{ann.title}</h3>
                  </div>
                  <Badge variant={ann.priority === 'URGENT' ? 'red' : 'slate'}>
                    {ann.category}
                  </Badge>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-light pl-6">{ann.message}</p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono pl-6">
                  <span>{ann.authorRole || 'Organizing Desk'}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#b91c1c]" />
                    {new Date(ann.timestamp).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
