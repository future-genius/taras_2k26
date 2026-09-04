import React from 'react';
import { MOCK_TIMELINE } from '../data/schedule';
import { Badge } from '../components/common/Badge';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// Individual step component with scroll-reveal
const TimelineStep: React.FC<{ item: (typeof MOCK_TIMELINE)[0]; index: number }> = ({ item, index }) => {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.15 });

  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, x: -24 }}
      animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
      className="relative"
    >
      {/* Stage Indicator Node */}
      <div className="absolute -left-[31px] sm:-left-[47px] top-2 flex items-center justify-center w-8 h-8 rounded-full bg-[#050608] border-2 border-[#b91c1c] text-[#b91c1c] font-mono font-bold text-xs shadow-lg shadow-[#b91c1c]/20">
        {item.stage}
      </div>

      {/* Left Date Label (Desktop) */}
      <div className="hidden sm:block absolute -left-36 top-2.5 text-right w-24">
        <span className="text-xs font-bold text-[#b91c1c] block font-mono">{item.date}</span>
        <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
      </div>

      {/* Card Content */}
      <div className="glass-panel rounded-xl p-5 border border-[#b91c1c]/30 hover:border-[#b91c1c]/60 transition-colors space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-widest block font-mono">
              STAGE 0{item.stage} · {item.category.replace('_', ' ')}
            </span>
            <h3 className="text-lg font-bold text-white font-mono">{item.title}</h3>
          </div>
          <span
            className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider ${
              item.status === 'COMPLETED'
                ? 'bg-[#1a0000] text-[#b91c1c] border border-[#b91c1c]/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            {item.status}
          </span>
        </div>

        {/* Mobile date */}
        <div className="sm:hidden text-xs text-[#b91c1c] font-mono font-semibold flex items-center gap-3 border-y border-white/10 py-1.5">
          <span>{item.date}</span>
          <span className="text-[#b91c1c]">•</span>
          <span>{item.time}</span>
        </div>

        <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-light">{item.description}</p>

        {item.venue && (
          <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
            <MapPin className="w-3.5 h-3.5 text-[#b91c1c]" />
            <span>{item.venue}</span>
          </div>
        )}

        {item.highlights && (
          <div className="flex flex-wrap gap-2 pt-1">
            {item.highlights.map((h, i) => (
              <span key={i} className="text-[10px] font-semibold text-slate-300 bg-[#0a0c10] border border-[#b91c1c]/30 px-2 py-0.5 rounded-md">
                ✓ {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const TimelinePage: React.FC = () => {
  return (
    <div className="space-y-10 pb-20">
      {/* Level 1/2 Pathway Connected Spider Web Environment */}
      <VisualAtmosphere
        environmentKey="timeline"
        badgeText="SYMPOSIUM ROADMAP"
        title="TARAS 2K26 TIMELINE"
        subtitle="From portal opening to abstract screening, venue QR verification, technical tracks, and valedictory awards."
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Vertical timeline — dark red connecting line */}
        <div className="relative border-l-2 border-[#b91c1c]/40 ml-4 sm:ml-32 space-y-8 pl-6 sm:pl-10">
          {/* Animated line overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#b91c1c] via-[#7f1d1d] to-transparent pointer-events-none" />

          {MOCK_TIMELINE.map((item, index) => (
            <TimelineStep key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
