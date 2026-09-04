import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glow-red' | 'solid';
  hoverEffect?: boolean;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  hoverEffect = true,
  animate = false,
  className,
  ...props
}) => {
  const base = 'rounded-xl p-6 transition-all duration-300 relative overflow-hidden';

  const variants = {
    glass: 'glass-panel text-slate-100',
    'glow-red': 'glass-panel-glow text-slate-100',
    solid: 'bg-[#0a0c10]/95 border border-slate-800 text-slate-100',
  };

  const hover = hoverEffect
    ? 'hover:-translate-y-1 hover:border-[#5b0000]/60 hover:shadow-xl hover:shadow-black/80'
    : '';

  const classes = twMerge(clsx(base, variants[variant], hover, className));

  if (animate) {
    return (
      <motion.div
        className={classes}
        whileHover={hoverEffect ? { y: -4 } : undefined}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        {...(props as any)}
      >
        {/* Subtle dark-red corner thread accent */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#3f0000]/20 to-transparent pointer-events-none rounded-tr-xl" />
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} {...props}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#3f0000]/20 to-transparent pointer-events-none rounded-tr-xl" />
      {children}
    </div>
  );
};
