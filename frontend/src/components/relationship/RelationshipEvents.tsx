import React from 'react';
import { RelationshipEvent } from '@greedy/shared';
import { RelationshipEventCard } from './RelationshipEventCard';

interface RelationshipEventsProps {
  events: RelationshipEvent[];
  onEditEvent: (event: RelationshipEvent) => void;
  onDeleteEvent: (id: number) => void;
}

export const RelationshipEvents: React.FC<RelationshipEventsProps> = ({
  events,
  onEditEvent,
  onDeleteEvent,
}) => {
  return (
    <div className="lg:col-span-2 card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title">Relationship History</h3>
        <div className="space-y-4">
          {events.map((event: RelationshipEvent) => (
            <RelationshipEventCard
              key={event.id}
              event={event}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
            />
          ))}
          {events.length === 0 && (
            <div className="text-center py-8">
              <p className="text-base-content/60">No relationship events recorded. Add the first event!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};