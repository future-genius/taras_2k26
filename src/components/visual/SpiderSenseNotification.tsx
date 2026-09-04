import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Radio, CheckCircle, BellRing, Sparkles, X } from 'lucide-react';

export type SpiderSenseType = 'SHORTLISTED' | 'VENUE UPDATED' | 'EVENT STARTING' | 'ATTENDANCE CONFIRMED' | 'CERTIFICATE READY' | 'SYSTEM BROADCAST';

export interface SpiderSenseNotice {
  id: string;
  type: SpiderSenseType;
  title: string;
  message: string;
  timestamp: string;
}

interface SpiderSenseContextType {
  notify: (type: SpiderSenseType, title: string, message: string) => void;
  notifications: SpiderSenseNotice[];
  dismiss: (id: string) => void;
}

const SpiderSenseContext = createContext<SpiderSenseContextType | undefined>(undefined);

export const SpiderSenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<SpiderSenseNotice[]>([
    {
      id: 'init-1',
      type: 'EVENT STARTING',
      title: 'TARAS 2K26 Countdown Active',
      message: 'Symposium registrations opening for 26 September 2026.',
      timestamp: 'NOW',
    },
  ]);

  const notify = useCallback((type: SpiderSenseType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotice: SpiderSenseNotice = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setNotifications((prev) => [newNotice, ...prev.slice(0, 4)]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <SpiderSenseContext.Provider value={{ notify, notifications, dismiss }}>
      {children}
      {/* Spider Sense Visual Toast Container */}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        <AnimatePresence mode="popLayout">
          {notifications.map((notice) => (
            <SpiderSenseToast key={notice.id} notice={notice} onDismiss={() => dismiss(notice.id)} />
          ))}
        </AnimatePresence>
      </div>
    </SpiderSenseContext.Provider>
  );
};

export const useSpiderSense = () => {
  const context = useContext(SpiderSenseContext);
  if (!context) {
    throw new Error('useSpiderSense must be used within a SpiderSenseProvider');
  }
  return context;
};

const SpiderSenseToast: React.FC<{ notice: SpiderSenseNotice; onDismiss: () => void }> = ({ notice, onDismiss }) => {
  const getIcon = () => {
    switch (notice.type) {
      case 'SHORTLISTED':
        return <Sparkles className="w-5 h-5 text-[#b91c1c] animate-pulse" />;
      case 'VENUE UPDATED':
        return <Radio className="w-5 h-5 text-[#b91c1c] animate-ping" />;
      case 'EVENT STARTING':
        return <BellRing className="w-5 h-5 text-white" />;
      case 'ATTENDANCE CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'CERTIFICATE READY':
        return <Sparkles className="w-5 h-5 text-[#b91c1c]" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-[#b91c1c]" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="pointer-events-auto relative overflow-hidden rounded-xl bg-[#0a0c10]/95 border border-[#b91c1c]/50 p-4 shadow-[0_10px_30px_rgba(185,28,28,0.25)] backdrop-blur-2xl"
    >
      {/* Spider Sense Pulse Ring */}
      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#b91c1c] animate-pulse" />
      <div className="absolute inset-0 bg-web-grid opacity-15 pointer-events-none" />

      <div className="flex items-start gap-3 relative z-10">
        <div className="p-2 rounded-lg bg-[#1a0000] border border-[#b91c1c]/40 shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#b91c1c] bg-[#1a0000]/60 px-2 py-0.5 rounded border border-[#5b0000]/40">
              SPIDER SENSE // {notice.type}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{notice.timestamp}</span>
          </div>

          <h4 className="text-sm font-bold text-white mt-1 leading-snug truncate">{notice.title}</h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-light">{notice.message}</p>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800/60 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
