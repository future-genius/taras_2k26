import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VisualAtmosphere } from '../../components/visual/VisualAtmosphere';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Bell, CheckCheck, Radio, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  type: 'REGISTRATION' | 'VENUE' | 'SHORTLIST' | 'RESULT' | 'ANNOUNCEMENT';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const NotificationCenterPage: React.FC = () => {
  const { participantProfile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      type: 'REGISTRATION',
      title: 'Participant Account Verified',
      message: `Your TARAS 2K26 participant ID ${participantProfile?.participantId || ''} is active and verified.`,
      timestamp: '10 MINS AGO',
      read: false,
    },
    {
      id: 'n2',
      type: 'VENUE',
      title: 'Ground Floor Registration Desk Open',
      message: 'Venue Check-in desk is active at the Ground Floor Quadrangle. Keep your QR pass ready.',
      timestamp: '1 HOUR AGO',
      read: false,
    },
    {
      id: 'n3',
      type: 'ANNOUNCEMENT',
      title: 'Paper-X-Verse Abstract Submissions Extended',
      message: 'Technical Paper abstract uploads extended until 25 September 11:59 PM.',
      timestamp: '2 HOURS AGO',
      read: true,
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'REGISTRATION':
        return <ShieldCheck className="w-5 h-5 text-[#b91c1c]" />;
      case 'VENUE':
        return <Radio className="w-5 h-5 text-[#b91c1c] animate-pulse" />;
      case 'SHORTLIST':
        return <Sparkles className="w-5 h-5 text-white" />;
      case 'RESULT':
        return <Bell className="w-5 h-5 text-[#b91c1c]" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-[#b91c1c]" />;
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <VisualAtmosphere
        environmentKey="announcements"
        badgeText="SPIDER SENSE NOTIFICATIONS"
        title="NOTIFICATION CENTER"
        subtitle="Real-time alerts, venue check-in confirmations, shortlist updates, and certificate notifications."
        height="compact"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#b91c1c]" />
            <h3 className="text-lg font-bold text-white font-mono">YOUR NOTIFICATIONS</h3>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<CheckCheck className="w-4 h-4" />}
            onClick={markAllRead}
          >
            Mark All as Read
          </Button>
        </div>

        <motion.div layout className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`glass-panel p-5 rounded-2xl border transition-all space-y-2 relative overflow-hidden shadow-lg ${
                  !n.read
                    ? 'border-[#b91c1c] bg-[#1a0000]/60 shadow-[0_0_20px_rgba(185,28,28,0.2)]'
                    : 'border-white/10 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#0a0c10] border border-[#b91c1c]/40 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white font-mono">{n.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">{n.timestamp}</span>
                    </div>
                  </div>

                  <Badge variant={!n.read ? 'red' : 'slate'} size="sm">
                    {n.type}
                  </Badge>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-light pl-12">{n.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
