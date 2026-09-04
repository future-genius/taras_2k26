import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-8">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1a0000]/20 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 space-y-6"
      >
        {/* 404 Number */}
        <div className="relative">
          <span className="text-[160px] sm:text-[200px] font-black font-mono leading-none text-[#1a0000] select-none">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[40px] sm:text-[56px] font-black font-mono text-white tracking-tight">
            PAGE NOT FOUND
          </span>
        </div>

        {/* Divider */}
        <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#b91c1c] to-transparent mx-auto" />

        {/* Message */}
        <div className="space-y-2 max-w-md mx-auto">
          <p className="text-slate-300 text-sm leading-relaxed">
            The node you're looking for doesn't exist in the TARAS network.
          </p>
          <p className="text-slate-600 text-xs font-mono">
            This path is not part of the TARAS 2K26 web.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link to="/">
            <Button variant="glow" size="md" icon={<Home className="w-4 h-4" />}>
              Return to Home
            </Button>
          </Link>
          <button onClick={() => window.history.back()}>
            <Button variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
              Go Back
            </Button>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
