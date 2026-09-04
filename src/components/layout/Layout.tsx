import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { SpiderCanvas } from '../spider-web/SpiderCanvas';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PageTransition } from '../common/PageTransition';
import { CommandPalette } from '../common/CommandPalette';
import { CustomCursor } from '../common/CustomCursor';
import { SpiderSenseProvider } from '../visual/SpiderSenseNotification';
import { LiveModeProvider } from '../visual/LiveModeToggle';
import { QRPassVisual } from '../visual/QRPassVisual';
import { ParticipantMobileBottomNav } from './ParticipantNav';
import { Shield, CheckCircle2 } from 'lucide-react';

export const Layout: React.FC = () => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const location = useLocation();

  // Global Ctrl+K / Cmd+K shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsPaletteOpen((prev) => !prev);
    }
    if (e.key === 'Escape') {
      setIsPaletteOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close palette on route change
  useEffect(() => {
    setIsPaletteOpen(false);
  }, [location.pathname]);

  return (
    <LiveModeProvider>
      <SpiderSenseProvider>
        <div className="min-h-screen flex flex-col bg-[#050608] text-slate-100 relative selection:bg-[#3f0000] selection:text-white">
          {/* Interactive Spider Web particle canvas */}
          <SpiderCanvas density={50} />

          {/* Custom Desktop Cursor */}
          <CustomCursor />

          {/* Cmd+K Command Palette */}
          <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

          {/* Header Navigation */}
          <Header
            onOpenRegistrationPlaceholder={() => setIsRegisterModalOpen(true)}
            onOpenPalette={() => setIsPaletteOpen(true)}
          />

          {/* Main Content Viewport with page transitions */}
          <main className="flex-grow pt-24 relative z-10">
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname}>
                <Outlet context={{ openRegistration: () => setIsRegisterModalOpen(true) }} />
              </PageTransition>
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <ParticipantMobileBottomNav />

          {/* Footer */}
          <Footer />

          {/* Phase 1 & 2 Registration & Digital Pass Preview Modal */}
          <Modal
            isOpen={isRegisterModalOpen}
            onClose={() => setIsRegisterModalOpen(false)}
            title="TARAS 2K26 Participant Universe Identity"
          >
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-xl bg-[#1a0000]/60 border border-[#5b0000]/40 flex items-start gap-3">
                <Shield className="w-6 h-6 text-[#b91c1c] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">TARAS Digital Pass Architecture</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Below is the preview of your individual TARAS symposium digital pass. Full registration features, live event check-in, and team formation are integrated into <strong>Phase 2 (Participant Platform)</strong>.
                  </p>
                </div>
              </div>

              {/* Live Digital QR Pass Component */}
              <div className="py-2">
                <QRPassVisual />
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#b91c1c]">
                  Phase 2 Platform Capabilities
                </h5>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#991b1b] shrink-0" />
                    <span>Scannable QR Pass with Live Venue Access Status</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#991b1b] shrink-0" />
                    <span>Real-time Event Shortlist & Certificate Wallet</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#991b1b] shrink-0" />
                    <span>Team Code Invites & Multi-event Scheduling</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="glow" size="md" onClick={() => setIsRegisterModalOpen(false)}>
                  Got it, Explore Public Universe
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </SpiderSenseProvider>
    </LiveModeProvider>
  );
};
