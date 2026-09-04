import React from 'react';
import { MOCK_PROCEEDINGS } from '../data/proceedings';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { Download, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, cardEntrance } from '../motion/variants';

export const ProceedingsPage: React.FC = () => {
  return (
    <div className="space-y-10 pb-20">
      {/* Level 1 & 2 Archive Document Environment */}
      <VisualAtmosphere
        environmentKey="proceedings"
        badgeText="IEEE & JOURNAL ARCHIVES"
        title="SYMPOSIUM PROCEEDINGS"
        subtitle="ISBN indexed national proceedings, souvenir volumes, and peer-reviewed technical paper publications."
        height="compact"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
          {MOCK_PROCEEDINGS.map((proc) => (
            <motion.div
              key={proc.id}
              variants={cardEntrance}
              className="glass-panel-glow rounded-xl p-6 border border-[#b91c1c]/40 hover:border-[#b91c1c]/60 transition-colors space-y-4 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#b91c1c] block">
                    VOLUME {proc.year} • {proc.papersCount} PAPERS
                  </span>
                  <h3 className="text-xl font-bold text-white font-mono">{proc.title}</h3>
                </div>
                <Badge variant={proc.year === '2026' ? 'red' : 'crimson'}>
                  ISBN: {proc.isbn}
                </Badge>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed font-light">{proc.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-400 border-t border-white/10 font-mono">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#b91c1c]" />
                  <span>Editors: {proc.editors.join(', ')}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => alert(`Downloading ${proc.title}…`)}
                >
                  Download E-Souvenir PDF
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
