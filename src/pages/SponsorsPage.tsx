import React from 'react';
import { MOCK_SPONSORS } from '../data/sponsors';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { ExternalLink, Handshake, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, cardEntrance } from '../motion/variants';

export const SponsorsPage: React.FC = () => {
  const categories = ['TITLE', 'PLATINUM', 'GOLD', 'TECHNICAL_PARTNER', 'ASSOCIATE'];

  return (
    <div className="space-y-10 pb-20">
      {/* Level 1 & 2 Clean Cinematic Background Environment */}
      <VisualAtmosphere
        environmentKey="sponsors"
        badgeText="INDUSTRY COLLABORATORS"
        title="TARAS 2K26 SPONSORS"
        subtitle="We collaborate with leading semiconductor, wireless simulation, and hardware technology organizations."
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-10">
          {categories.map((cat) => {
            const sponsorsInCat = MOCK_SPONSORS.filter((s) => s.category === cat);
            if (sponsorsInCat.length === 0) return null;
            return (
              <div key={cat} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b91c1c]" />
                  <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                    {cat.replace('_', ' ')} SPONSORS
                  </h3>
                </div>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  {sponsorsInCat.map((sp) => (
                    <motion.div
                      key={sp.id}
                      variants={cardEntrance}
                      className="glass-panel rounded-xl p-6 border border-[#b91c1c]/30 hover:border-[#b91c1c]/60 transition-colors space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-white font-mono tracking-wider">
                          {sp.logoPlaceholder}
                        </span>
                        <Badge variant="crimson">{sp.category.replace('_', ' ')}</Badge>
                      </div>
                      <h4 className="text-base font-bold text-[#b91c1c]">{sp.name}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">{sp.description}</p>
                      {sp.websiteUrl && (
                        <div className="pt-2 border-t border-white/10">
                          <a
                            href={sp.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#b91c1c] hover:text-[#cc0000] transition-colors"
                          >
                            Visit Website <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Become a Sponsor CTA */}
        <div className="glass-panel-glow p-8 md:p-12 rounded-3xl text-center space-y-4 border border-[#b91c1c]/40">
          <Handshake className="w-10 h-10 text-[#b91c1c] mx-auto" />
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono uppercase">
            PARTNER WITH TARAS 2K26
          </h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed font-light">
            Sponsor our technical paper presentations, hackathons, and workshops for direct access to 1,200+ top engineering delegates.
          </p>
          <a href="mailto:taras2k26@gmail.com">
            <Button variant="glow" size="md" icon={<Mail className="w-4 h-4" />}>
              Contact Sponsorship Committee
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};
