import React, { createContext, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Zap } from 'lucide-react';

interface LiveModeContextType {
  isLiveMode: boolean;
  toggleLiveMode: () => void;
}

const LiveModeContext = createContext<LiveModeContextType>({
  isLiveMode: false,
  toggleLiveMode: () => {},
});

export const LiveModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLiveMode, setIsLiveMode] = useState(false);

  const toggleLiveMode = () => setIsLiveMode((prev) => !prev);

  return (
    <LiveModeContext.Provider value={{ isLiveMode, toggleLiveMode }}>
      <div className={isLiveMode ? 'taras-live-mode-active' : ''}>
        {children}
      </div>
    </LiveModeContext.Provider>
  );
};

export const useLiveMode = () => useContext(LiveModeContext);

export const LiveModeToggleBtn: React.FC = () => {
  const { isLiveMode, toggleLiveMode } = useLiveMode();

  return (
    <button
      onClick={toggleLiveMode}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all duration-300 ${
        isLiveMode
          ? 'bg-[#1a0000] text-white border border-[#b91c1c] shadow-[0_0_15px_rgba(185,28,28,0.5)]'
          : 'bg-[#0a0c10] text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
      }`}
      title="Toggle TARAS Live Mode (26 Sept 2026 Active State)"
    >
      <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-[#b91c1c] animate-ping' : 'bg-slate-600'}`} />
      <Radio className={`w-3.5 h-3.5 ${isLiveMode ? 'text-[#b91c1c]' : 'text-slate-500'}`} />
      <span>{isLiveMode ? 'LIVE MODE ACTIVE' : 'LIVE MODE 26.09.2026'}</span>
    </button>
  );
};
