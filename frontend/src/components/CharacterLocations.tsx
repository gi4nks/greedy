import React from 'react';
import { LocationCharacter } from '@greedy/shared';

interface CharacterLocationsProps {
  locations?: LocationCharacter[];
  className?: string;
}

export default function CharacterLocations({ locations = [], className = '' }: CharacterLocationsProps): JSX.Element {
  if (!locations.length) {
    return <div className={className}>No location assignments</div>;
  }

  const getLocationIcon = (type: LocationCharacter['relationship_type']) => {
    switch (type) {
      case 'lives_at': return '🏠';
      case 'works_at': return '💼';
      case 'owns': return '👑';
      case 'frequents': return '🔄';
      case 'avoids': return '❌';
      default: return '👋'; // visits
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="font-semibold text-sm">Locations</h4>
      <div className="flex flex-wrap gap-2">
        {locations.map((loc) => (
          <div
            key={`${loc.location_id}-${loc.relationship_type}`}
            className={`badge gap-2 ${loc.is_current ? 'badge-primary' : 'badge-outline'}`}
          >
            <span>{getLocationIcon(loc.relationship_type)}</span>
            <span>{(loc as any).location_name}</span>
            {loc.is_current && <span className="text-xs">(Current)</span>}
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