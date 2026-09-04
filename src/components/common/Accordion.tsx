import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div
      className={`border rounded-xl overflow-hidden glass-panel transition-all duration-300 mb-3 ${
        isOpen ? 'border-[#3f0000]/60' : 'border-slate-800/60 hover:border-[#3f0000]/30'
      }`}
    >
      <button
        onClick={toggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7f1d1d] group"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-slate-100 text-sm md:text-base pr-4 group-hover:text-white transition-colors">
          {title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="shrink-0"
        >
          <ChevronDown
            className={`w-5 h-5 transition-colors ${
              isOpen ? 'text-[#b91c1c]' : 'text-slate-500'
            }`}
          />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="px-5 pb-5 pt-2 text-slate-300 text-sm md:text-base border-t border-[#1a0000]/60 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
