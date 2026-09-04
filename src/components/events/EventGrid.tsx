import React from 'react';
import type { TARASEvent } from '../../types/event';
import { EventCard } from './EventCard';
import { motion } from 'framer-motion';

interface EventGridProps {
  events: TARASEvent[];
  onRegisterClick: () => void;
}

export const EventGrid: React.FC<EventGridProps> = ({ events, onRegisterClick }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 px-4 glass-panel rounded-2xl">
        <h4 className="text-lg font-bold text-white mb-2">No Matching Events Found</h4>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Try resetting your category filter or search query to explore all available TARAS 2K26 technical and non-technical symposiums.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <EventCard event={event} onRegisterClick={onRegisterClick} />
        </motion.div>
      ))}
    </div>
  );
};
