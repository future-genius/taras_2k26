import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#7f1d1d]/50 focus-visible:ring-2 focus-visible:ring-[#b91c1c]';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5 font-semibold',
  };

  const variants = {
    primary:
      'bg-[#7f1d1d] hover:bg-[#991b1b] text-white border border-[#5b0000]/80 shadow-lg shadow-black/60',
    glow:
      'bg-[#7f1d1d] hover:bg-[#991b1b] text-white shadow-lg shadow-black/80 hover:shadow-[#3f0000]/40 border border-[#5b0000]/60',
    secondary:
      'bg-[#0a0c10] hover:bg-[#1a0000]/60 text-slate-200 hover:text-white border border-slate-700 hover:border-[#5b0000]',
    outline:
      'border border-[#5b0000]/60 hover:border-[#7f1d1d]/80 bg-black/60 hover:bg-[#1a0000]/40 text-slate-200 hover:text-white backdrop-blur-md',
    ghost: 'text-slate-300 hover:text-white hover:bg-[#1a0000]/40',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={twMerge(clsx(baseStyles, sizes[size], variants[variant], className))}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </motion.button>
  );
};
