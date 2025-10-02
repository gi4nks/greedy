import React from 'react';
import { NPCRelationship } from '@greedy/shared';
import { COMPONENT_COLORS } from '../../config/theme';

interface RelationshipDetailsProps {
  relationship: NPCRelationship;
  getCharacterName: (id: number) => string;
}

export const RelationshipDetails: React.FC<RelationshipDetailsProps> = ({
  relationship,
  getCharacterName,
}) => {
  const getRelationshipColor = (strength: number) => {
    if (strength >= 5) return COMPONENT_COLORS.status.success;
    if (strength <= -5) return COMPONENT_COLORS.status.error;
    return COMPONENT_COLORS.status.warning;
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type) {
      case 'ally': return 'badge-success';
      case 'enemy': return 'badge-error';
      case 'romantic': return 'badge-warning';
      case 'family': return 'badge-info';
      case 'friend': return 'badge-primary';
      case 'rival': return 'badge-secondary';
      case 'acquaintance': return 'badge-neutral';
      default: return 'badge-ghost';
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title">
          {getCharacterName(relationship.characterId)} ↔ {getCharacterName(relationship.npcId)}
        </h3>
        <div className="space-y-3">
          <div>
            <span className="font-semibold">Type:</span>
            <div className={`badge ${getRelationshipTypeColor(relationship.relationshipType)} ml-2`}>
              {relationship.relationshipType}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Strength:</span>
              <p className={`text-lg font-bold ${getRelationshipColor(relationship.strength)}`}>
                {relationship.strength > 0 ? '+' : ''}{relationship.strength}
              </p>
            </div>
            <div>
              <span className="font-semibold">Trust:</span>
              <p className="text-lg">{relationship.trust}%</p>
            </div>
            <div>
              <span className="font-semibold">Fear:</span>
              <p className="text-lg">{relationship.fear}%</p>
            </div>
            <div>
              <span className="font-semibold">Respect:</span>
              <p className="text-lg">{relationship.respect}%</p>
            </div>
          </div>

          {relationship.notes && (
            <div>
              <span className="font-semibold">Notes:</span>
              <p className="text-sm text-base-content/70 mt-1">{relationship.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};