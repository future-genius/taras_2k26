import React from 'react';
import { useParams, useOutletContext, Navigate } from 'react-router-dom';
import { MOCK_EVENTS } from '../data/events';
import { EventDetailView } from '../components/events/EventDetailView';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';

export const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { openRegistration } = useOutletContext<{ openRegistration: () => void }>();

  const event = MOCK_EVENTS.find((e) => e.id === eventId || e.slug === eventId);

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  return (
    <div className="space-y-8 pb-16">
      <VisualAtmosphere
        environmentKey="event-detail"
        badgeText={`TARAS 2K26 TRACK // ${event.category}`}
        title={event.name}
        subtitle={event.shortDescription}
        height="compact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EventDetailView event={event} onRegisterClick={openRegistration} />
      </div>
    </div>
  );
};
