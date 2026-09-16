import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 320) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="back-to-top"
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={scrollToTop}
          className="fixed bottom-20 lg:bottom-8 right-5 z-40 p-3 rounded-2xl bg-[#0a0c10]/90 border border-[#dc2626]/60 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-[#1a0000] hover:border-[#dc2626] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] hover:scale-110 active:scale-95 transition-all backdrop-blur-md group cursor-pointer"
          aria-label="Scroll back to top of page"
          title="Back to top"
        >
          <ChevronUp className="w-5 h-5 text-[#dc2626] group-hover:text-white group-hover:-translate-y-0.5 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
