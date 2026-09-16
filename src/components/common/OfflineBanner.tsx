import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 inset-x-0 z-[100] bg-[#1a0000] border-b border-[#dc2626] text-white px-4 py-2.5 shadow-2xl flex items-center justify-center gap-3 font-mono text-xs"
        >
          <div className="w-2 h-2 rounded-full bg-[#dc2626] animate-ping" />
          <WifiOff className="w-4 h-4 text-[#dc2626] shrink-0" />
          <span>You are currently offline. Please check your internet connection before submitting registrations or payments.</span>
          <button
            onClick={() => window.location.reload()}
            className="px-2.5 py-1 rounded bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-[10px] uppercase transition-colors flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
