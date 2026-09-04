import React from 'react';
import { motion } from 'framer-motion';
import { TARAS_VISUAL_ENVIRONMENTS, type PageVisualEnvironment } from '../../config/visualAssets';

interface VisualAtmosphereProps {
  environmentKey: keyof typeof TARAS_VISUAL_ENVIRONMENTS;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  children?: React.ReactNode;
  height?: 'full' | 'hero' | 'section' | 'compact';
  showWebGrid?: boolean;
}

export const VisualAtmosphere: React.FC<VisualAtmosphereProps> = ({
  environmentKey,
  title,
  subtitle,
  badgeText,
  children,
  height = 'hero',
  showWebGrid = true,
}) => {
  const env: PageVisualEnvironment = TARAS_VISUAL_ENVIRONMENTS[environmentKey] || TARAS_VISUAL_ENVIRONMENTS.home;

  const heightClasses = {
    full: 'min-h-screen py-20',
    hero: 'min-h-[75vh] lg:min-h-[85vh] pt-28 pb-16',
    section: 'min-h-[45vh] py-16',
    compact: 'min-h-[30vh] py-10',
  };

  return (
    <div className={`relative w-full overflow-hidden flex items-center justify-center ${heightClasses[height]}`}>
      {/* LEVEL 1 / LEVEL 2 — Background Artwork Layer with Image Blending */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">

        {/* Dark base fill so screen-blended images sit on pure black */}
        <div className="absolute inset-0 bg-[#050608]" />

        {/* Red eye-glow layer — sits UNDER the image for screen-mode glow */}
        {env.blendMode === 'screen' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 35% at 35% 48%, rgba(220,38,38,0.55) 0%, transparent 70%), radial-gradient(ellipse 60% 35% at 65% 48%, rgba(220,38,38,0.55) 0%, transparent 70%)',
            }}
          />
        )}

        {/* Base Background Image */}
        <img
          src={env.heroImage}
          alt={env.heroAlt}
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out brightness-90 contrast-110"
          style={{ mixBlendMode: (env.blendMode as React.CSSProperties['mixBlendMode']) || 'normal' }}
          loading="eager"
        />

        {/* Black Vignette & Fade Overlay — skip for screen-blended images */}
        {env.blendMode !== 'screen' && (
          <div
            className="absolute inset-0 bg-[#050608]"
            style={{ opacity: env.overlayOpacity }}
          />
        )}

        {/* Dark Red Atmospheric Tint Layer */}
        <div
          className="absolute inset-0 mix-blend-color-dodge pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(185, 28, 28, 0.45) 0%, rgba(127, 29, 29, 0.15) 50%, transparent 80%)',
            opacity: env.redTintOpacity * 2,
          }}
        />

        {/* Controlled Section Gradient Masking */}
        <div
          className="absolute inset-0"
          style={{ background: env.sectionAtmosphere }}
        />

        {/* Top Fade Edge */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050608] via-[#050608]/70 to-transparent" />

        {/* Bottom Fade Edge */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050608] via-[#050608]/80 to-transparent" />

        {/* LEVEL 4 — Micro Web Texture Overlay */}
        {showWebGrid && (
          <div className="absolute inset-0 bg-web-grid opacity-30 mix-blend-overlay pointer-events-none" />
        )}
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center">
        {badgeText && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold uppercase tracking-widest bg-[#1a0000]/80 border border-[#b91c1c]/40 text-[#f8fafc] shadow-[0_0_20px_rgba(185,28,28,0.3)] mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-[#b91c1c] animate-pulse" />
            {badgeText}
          </motion.div>
        )}

        {title && (
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl"
          >
            <span className="text-gradient-red">{title}</span>
          </motion.h1>
        )}

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed font-light"
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 w-full"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
};
