import React from 'react';
import { motion } from 'framer-motion';
import { EVENT_CATEGORY_VISUALS } from '../../config/visualAssets';

interface VisualCardProps {
  title: string;
  subtitle?: string;
  category?: 'technical' | 'non-technical' | 'workshop' | 'hackathon' | 'general';
  imageUrl?: string;
  badge?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  glow?: boolean;
}

export const VisualCard: React.FC<VisualCardProps> = ({
  title,
  subtitle,
  category = 'general',
  imageUrl,
  badge,
  children,
  onClick,
  className = '',
  glow = true,
}) => {
  const categoryConfig = EVENT_CATEGORY_VISUALS[category] || EVENT_CATEGORY_VISUALS.technical;
  const bgImage = imageUrl || categoryConfig.image;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-[#0a0c10]/90 border border-white/10 backdrop-blur-xl transition-all duration-300 ${
        glow ? 'hover:border-[#dc2626]/70 hover:shadow-[0_12px_36px_rgba(220,38,38,0.3)]' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Dynamic Cyber Sheen Sweep on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-30" />

      {/* High-tech Corner Brackets on hover */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-transparent group-hover:border-[#dc2626] transition-colors duration-300 z-20" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-transparent group-hover:border-[#dc2626] transition-colors duration-300 z-20" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-transparent group-hover:border-[#dc2626] transition-colors duration-300 z-20" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-transparent group-hover:border-[#dc2626] transition-colors duration-300 z-20" />

      {/* LEVEL 3 — Component Visual Layer */}
      <div className="relative h-44 w-full overflow-hidden">
        {/* Card Artwork Image */}
        <img
          src={bgImage}
          alt={title}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110 brightness-90 contrast-110"
        />

        {/* Black Gradient Mask Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/60 to-transparent" />

        {/* Category Specific Red Tint */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-color-dodge transition-opacity duration-300 group-hover:opacity-75"
          style={{ background: categoryConfig.pattern }}
        />

        {/* LEVEL 4 — Micro Web Lines Overlay */}
        <div className="absolute inset-0 bg-web-grid opacity-20 group-hover:opacity-50 transition-opacity" />

        {/* Badge Header */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1a0000]/95 text-white border border-[#dc2626]/50 shadow-md group-hover:border-[#dc2626] transition-colors">
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-5 relative z-10 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors flex items-center justify-between">
            <span>{title}</span>
            <span className="text-[#dc2626] -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-sm font-mono font-bold">
              &rarr;
            </span>
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed font-light">
              {subtitle}
            </p>
          )}
        </div>

        {children && <div className="mt-4">{children}</div>}
      </div>

      {/* Bottom Glowing Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dc2626]/0 to-transparent group-hover:via-[#dc2626] transition-all duration-500" />
    </motion.div>
  );
};
