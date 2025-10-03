import React from 'react';
import { LocationQuest } from '@greedy/shared';

interface QuestLocationsProps {
  locations?: LocationQuest[];
  className?: string;
}

export default function QuestLocations({ locations = [], className = '' }: QuestLocationsProps): JSX.Element {
  if (!locations.length) {
    return <div className={className}>No location assignments</div>;
  }

  const getLocationIcon = (type: LocationQuest['relationship_type']) => {
    switch (type) {
      case 'starts_at': return '🚀';
      case 'ends_at': return '🏁';
      case 'leads_to': return '➡️';
      case 'involves': return '🔗';
      default: return '📍'; // takes_place_at
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="font-semibold text-sm">Locations</h4>
      <div className="flex flex-wrap gap-2">
        {locations.map((loc) => (
          <div
            key={`${loc.location_id}-${loc.relationship_type}`}
            className={`badge gap-2 ${loc.is_primary ? 'badge-primary' : 'badge-outline'}`}
          >
            <span>{getLocationIcon(loc.relationship_type)}</span>
            <span>{(loc as any).location_name}</span>
            {loc.is_primary && <span className="text-xs">(Primary)</span>}
          </div>
        ))}
      </div>
      {locations.some(l => l.notes) && (
        <div className="text-xs text-base-content/70">
          {locations
            .filter(l => l.notes)
            .map(l => `${(l as any).location_name}: ${l.notes}`)
            .join(' | ')}
        </div>
      )}
    </div>
  );
}