import React, { useState } from 'react';
import { MOCK_GALLERY } from '../data/gallery';
import { Badge } from '../components/common/Badge';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { VisualCard } from '../components/visual/VisualCard';
import { Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, cardEntrance } from '../motion/variants';

export const GalleryPage: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const categories = ['ALL', 'Events', 'People', 'Behind the Scenes', 'TARAS History'];
  const filtered = selectedCat === 'ALL' ? MOCK_GALLERY : MOCK_GALLERY.filter((g) => g.category === selectedCat);

  return (
    <div className="space-y-10 pb-20">
      {/* Level 1 & 2 Image-Driven Showcase Environment */}
      <VisualAtmosphere
        environmentKey="gallery"
        badgeText="SYMPOSIUM ARCHIVE"
        title="TARAS MEDIA GALLERY"
        subtitle="Moments captured across inaugurals, hardware lab sprints, quiz buzzer finals, and trophy celebrations."
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedCat === cat
                  ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-lg shadow-[#b91c1c]/20'
                  : 'bg-[#0a0c10] text-slate-400 hover:text-white border border-slate-800 hover:border-[#b91c1c]/40'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCat}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((item) => (
              <motion.div key={item.id} variants={cardEntrance}>
                <VisualCard
                  title={item.title}
                  subtitle={item.caption}
                  category="general"
                  badge={item.category}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-white/10">
                    <span className="text-[#b91c1c]">{item.year} ARCHIVE</span>
                    <span className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> High-Res
                    </span>
                  </div>
                </VisualCard>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
