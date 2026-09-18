import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, CheckCircle2, ChevronRight, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { db } from '../../config/firebase';

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  category?: string;
  timestamp?: string;
  createdAt?: string;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | string;
  authorRole?: string;
  active?: boolean;
}

interface LiveAnnouncementWidgetProps {
  limitCount?: number;
  showAllLink?: boolean;
  className?: string;
}

export const LiveAnnouncementWidget: React.FC<LiveAnnouncementWidgetProps> = ({
  limitCount = 3,
  showAllLink = true,
  className = '',
}) => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // 1. Immediate fetch from Firestore
    const initialFetch = async () => {
      try {
        const rawDocs = await db.getCollection('announcements');
        if (isMounted) {
          processAndSetAnnouncements(rawDocs || []);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('[LiveAnnouncementWidget] Firestore fetch error:', err);
        if (isMounted) {
          processAndSetAnnouncements([]);
          setLoading(false);
        }
      }
    };

    initialFetch();

    // 2. Real-time Firebase Listener for Live Broadcasts
    const unsubscribe = db.subscribeCollection('announcements', (liveDocs) => {
      if (!isMounted) return;
      if (liveDocs && liveDocs.length > 0) {
        processAndSetAnnouncements(liveDocs);
      } else {
        // If collection was cleared or has 0 active items
        processAndSetAnnouncements([]);
      }
      setLoading(false);
    });

    function processAndSetAnnouncements(items: any[]) {
      // Filter out inactive announcements
      const activeItems = items.filter((item) => item.active !== false);

      // Sort by timestamp descending
      const sorted = activeItems.sort((a, b) => {
        const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return tB - tA;
      });

      // Deduplicate by ID
      const seen = new Set();
      const unique: AnnouncementItem[] = [];
      for (const item of sorted) {
        const id = item.id || item.title;
        if (!seen.has(id)) {
          seen.add(id);
          unique.push({
            id: item.id || `ann-${Math.random()}`,
            title: item.title || 'Official Announcement',
            message: item.message || '',
            category: item.category || 'GENERAL',
            timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
            priority: item.priority || 'NORMAL',
            authorRole: item.authorRole || 'TARAS Desk',
            active: item.active !== false,
          });
        }
      }

      setAnnouncements(unique);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const activeDisplayList = announcements.slice(0, limitCount);

  return (
    <div className={`space-y-4 font-mono ${className}`}>
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-[#dc2626]/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative p-1.5 rounded-lg bg-[#1a0000] border border-[#dc2626]/60 text-[#dc2626]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-[#dc2626] uppercase tracking-widest block">
              TARAS LIVE BROADCAST MATRIX
            </span>
            <h3 className="text-base font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
              LIVE ANNOUNCEMENTS
              {announcements.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a0000] border border-[#dc2626]/60 text-[#ff4d4d]">
                  {announcements.length} ACTIVE
                </span>
              )}
            </h3>
          </div>
        </div>

        {showAllLink && (
          <Link
            to="/announcements"
            className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 hover:underline transition-colors"
          >
            <span>All Updates</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#dc2626]" />
          </Link>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-6 rounded-2xl bg-[#0a0c10] border border-slate-800 animate-pulse space-y-3">
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-800/60 rounded w-3/4" />
          <div className="h-3 bg-slate-800/40 rounded w-1/2" />
        </div>
      ) : activeDisplayList.length === 0 ? (
        /* Empty State: "You're all caught up." */
        <div className="p-6 sm:p-8 rounded-2xl bg-[#08090d] border border-slate-800/80 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#12141c] border border-slate-700 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wide">
            You're all caught up.
          </h4>
          <p className="text-xs text-slate-400 font-light max-w-sm mx-auto">
            No active broadcast alerts at this moment. Important event notices and schedule updates will stream live here.
          </p>
        </div>
      ) : (
        /* Active Announcements Cards */
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activeDisplayList.map((ann) => {
              const isUrgent = ann.priority === 'URGENT';
              const isHigh = ann.priority === 'HIGH';

              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 relative overflow-hidden ${
                    isUrgent
                      ? 'bg-[#1a0000]/90 border-[#dc2626] shadow-[0_0_25px_rgba(220,38,38,0.25)]'
                      : isHigh
                      ? 'bg-[#0f0707]/90 border-[#dc2626]/60'
                      : 'bg-[#0a0c10]/90 border-slate-800 hover:border-[#dc2626]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isUrgent
                            ? 'bg-[#dc2626] text-white'
                            : isHigh
                            ? 'bg-[#1a0000] text-[#ff4d4d] border border-[#dc2626]/60'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ann.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {ann.category}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#dc2626]" />
                      {new Date(ann.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {ann.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {ann.message}
                  </p>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Issued by: <strong className="text-slate-200">{ann.authorRole}</strong></span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAMED
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
