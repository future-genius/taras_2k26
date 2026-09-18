import React from 'react';
import { Link } from 'react-router-dom';
import type { TARASEvent } from '../../types/event';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { VisualCard } from '../visual/VisualCard';
import { Clock, MapPin, Users, Award, ChevronRight } from 'lucide-react';

interface EventCardProps {
  event: TARASEvent;
  onRegisterClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const categoryKey = event.category === 'TECHNICAL' ? 'technical' : 'non-technical';

  return (
    <VisualCard
      title={event.name}
      subtitle={event.shortDescription}
      category={categoryKey}
      badge={event.category.replace('_', ' ')}
      imageUrl={event.bannerImage || event.image}
    >
      <div className="space-y-3">
        {/* Theme & Tagline */}
        <p className="text-xs font-mono italic text-[#b91c1c]">"{event.theme}"</p>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 border-t border-white/10 pt-3 font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="w-3.5 h-3.5 text-[#b91c1c] shrink-0" />
            <span className="truncate">{event.duration}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#b91c1c] shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 text-[#b91c1c] font-bold pt-1">
            <Award className="w-3.5 h-3.5 text-[#b91c1c] shrink-0" />
            <span>Top Prize: {event.prizes[0]?.amount || 'Trophies + Certificates'}</span>
          </div>
          {event.eventHead && (
            <div className="col-span-2 text-[11px] font-mono text-slate-300 bg-[#0a0c10] p-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-1">
              <span>Event Head: <strong className="text-white">{event.eventHead.name}</strong></span>
              <span className="text-[#b91c1c] font-bold">{event.eventHead.phone}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-white/10">
          <Link to={`/events/${event.slug}`} className="w-full block">
            <Button variant="glow" size="sm" className="w-full justify-center font-bold" icon={<ChevronRight className="w-3.5 h-3.5" />}>
              Details
            </Button>
          </Link>
        </div>
      </div>
    </VisualCard>
  );
};
