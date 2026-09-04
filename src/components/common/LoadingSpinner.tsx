import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16" role="status" aria-label={label}>
      {/* Animated TARAS network node */}
      <div className="relative w-12 h-12">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#3f0000] border-t-[#b91c1c] animate-spin" />
        {/* Inner static node */}
        <div className="absolute inset-2 rounded-full bg-[#0a0c10] border border-[#7f1d1d]/50 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#b91c1c] animate-red-pulse" />
        </div>
      </div>
      <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};
