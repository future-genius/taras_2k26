import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Zap, Clock, Info, Users, BookOpen, HelpCircle,
  MapPin, Briefcase, Radio, Trophy, Image, FileText, Phone, X, Search, Shield,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

const COMMANDS: CommandItem[] = [
  { id: 'home', label: 'Home', description: 'Main landing page', path: '/', icon: <Home className="w-4 h-4" /> },
  { id: 'events', label: 'Events', description: 'All competitions and workshops', path: '/events', icon: <Zap className="w-4 h-4" /> },
  { id: 'timeline', label: 'Timeline', description: 'Symposium schedule', path: '/timeline', icon: <Clock className="w-4 h-4" /> },
  { id: 'about', label: 'About', description: 'ECE Department & TARAS legacy', path: '/about', icon: <Info className="w-4 h-4" /> },
  { id: 'team', label: 'Team', description: 'Faculty & student organizers', path: '/team', icon: <Users className="w-4 h-4" /> },
  { id: 'rules', label: 'Rules', description: 'Symposium conduct guidelines', path: '/rules', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'faq', label: 'FAQ', description: 'Frequently asked questions', path: '/faq', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'venue', label: 'Venue', description: 'Campus directions & event areas', path: '/venue', icon: <MapPin className="w-4 h-4" /> },
  { id: 'announcements', label: 'Announcements', description: 'Live updates feed', path: '/announcements', icon: <Radio className="w-4 h-4" /> },
  { id: 'results', label: 'Results', description: 'Winners & podium declarations', path: '/results', icon: <Trophy className="w-4 h-4" /> },
  { id: 'gallery', label: 'Gallery', description: 'Photo archive', path: '/gallery', icon: <Image className="w-4 h-4" /> },
  { id: 'proceedings', label: 'Proceedings', description: 'ISBN papers & e-souvenir', path: '/proceedings', icon: <FileText className="w-4 h-4" /> },
  { id: 'contact', label: 'Contact', description: 'Reach the organizing team', path: '/contact', icon: <Phone className="w-4 h-4" /> },
  { id: 'admin', label: 'Admin Command Center', description: 'Phase 3 Master Command & Network Node Topology', path: '/announcements', icon: <Shield className="w-4 h-4 text-[#b91c1c]" /> },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const go = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        go(filtered[activeIndex].path);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filtered, activeIndex, go, onClose]
  );

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.children[activeIndex] as HTMLElement;
    if (active) active.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[8000]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Palette Panel */}
          <motion.div
            key="palette-panel"
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-[12vh] left-1/2 -translate-x-1/2 w-full max-w-lg z-[8001] shadow-2xl shadow-black"
            role="dialog"
            aria-label="Command Palette — Navigate TARAS 2K26"
          >
            <div className="bg-[#0a0c10] border border-[#3f0000]/80 rounded-2xl overflow-hidden">
              {/* Search input row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1a0000]/80">
                <Search className="w-4 h-4 text-[#7f1d1d] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Navigate to… (type a page name)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-[#1a0000] text-slate-500 hover:text-white transition-colors"
                  aria-label="Close palette"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results list */}
              <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500 font-mono">
                    No page found for "{query}"
                  </div>
                ) : (
                  filtered.map((cmd, i) => (
                    <button
                      key={cmd.id}
                      onClick={() => go(cmd.path)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        i === activeIndex
                          ? 'bg-[#3f0000]/70 text-white'
                          : 'text-slate-300 hover:bg-[#1a0000]/60 hover:text-white'
                      }`}
                    >
                      <span
                        className={`shrink-0 ${i === activeIndex ? 'text-[#b91c1c]' : 'text-[#7f1d1d]'}`}
                      >
                        {cmd.icon}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold font-mono">{cmd.label}</span>
                        <span className="block text-xs text-slate-500">{cmd.description}</span>
                      </span>
                      {i === activeIndex && (
                        <span className="shrink-0 text-[10px] font-mono text-[#7f1d1d] border border-[#3f0000] rounded px-1.5 py-0.5">
                          ↵
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-[#1a0000]/80 flex items-center gap-4 text-[10px] font-mono text-slate-600">
                <span><kbd className="text-slate-500">↑↓</kbd> navigate</span>
                <span><kbd className="text-slate-500">↵</kbd> go</span>
                <span><kbd className="text-slate-500">Esc</kbd> close</span>
                <span className="ml-auto text-[#3f0000]">TARAS 2K26</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
