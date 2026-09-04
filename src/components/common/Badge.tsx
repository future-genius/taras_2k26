import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'red' | 'crimson' | 'slate' | 'outline' | 'green' | 'amber';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'red',
  size = 'md',
  className,
}) => {
  const base = 'inline-flex items-center font-bold rounded-full tracking-widest uppercase border font-mono';

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-3 py-1 text-[10px]',
  };

  const variants = {
    red: 'bg-[#1a0000]/80 border-[#5b0000]/60 text-[#cc0000]',
    crimson: 'bg-[#3f0000]/70 border-[#7f1d1d]/50 text-white',
    slate: 'bg-slate-900/90 border-slate-700 text-slate-300',
    outline: 'bg-transparent border-[#5b0000]/60 text-[#991b1b]',
    green: 'bg-[#001a05]/80 border-green-500/50 text-green-400',
    amber: 'bg-[#1a0e00]/80 border-amber-500/50 text-amber-400',
  };

  return (
    <span className={twMerge(clsx(base, sizes[size], variants[variant], className))}>
      {children}
    </span>
  );
};
