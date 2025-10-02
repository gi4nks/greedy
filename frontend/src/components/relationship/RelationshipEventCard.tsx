import React from 'react';
import { RelationshipEvent } from '@greedy/shared';

interface RelationshipEventCardProps {
  event: RelationshipEvent;
  onEdit: (event: RelationshipEvent) => void;
  onDelete: (id: number) => void;
}

export const RelationshipEventCard: React.FC<RelationshipEventCardProps> = ({
  event,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-base-content mb-2">{event.description}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {event.impactValue !== 0 && (
                <div className={`badge ${event.impactValue > 0 ? 'badge-success' : 'badge-error'}`}>
                  Strength {event.impactValue > 0 ? '+' : ''}{event.impactValue}
                </div>
              )}
              {event.trustChange !== 0 && (
                <div className={`badge ${event.trustChange > 0 ? 'badge-success' : 'badge-error'}`}>
                  Trust {event.trustChange > 0 ? '+' : ''}{event.trustChange}%
                </div>
              )}
              {event.fearChange !== 0 && (
                <div className={`badge ${event.fearChange > 0 ? 'badge-success' : 'badge-error'}`}>
                  Fear {event.fearChange > 0 ? '+' : ''}{event.fearChange}%
                </div>
              )}
              {event.respectChange !== 0 && (
                <div className={`badge ${event.respectChange > 0 ? 'badge-success' : 'badge-error'}`}>
                  Respect {event.respectChange > 0 ? '+' : ''}{event.respectChange}%
                </div>
              )}
            </div>
            <p className="text-sm text-base-content/60">
              {new Date(event.date).toLocaleDateString()}
            </p>
          </div>
          <div className="card-actions">
            <button
              onClick={() => onEdit(event)}
              className="btn btn-secondary btn-xs"
            >
              Edit
            </button>
            <button
              onClick={() => { if (event.id) onDelete(event.id); }}
              className="btn btn-neutral btn-xs"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};