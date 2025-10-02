import React from 'react';
import { NPCRelationship } from '@greedy/shared';
import { COMPONENT_COLORS } from '../../config/theme';

interface RelationshipCardProps {
  relationship: NPCRelationship;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onEdit: (relationship: NPCRelationship) => void;
  onDelete: (id: number) => void;
  getCharacterName: (id: number) => string;
}

export const RelationshipCard: React.FC<RelationshipCardProps> = ({
  relationship,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
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
    <div
      className={`card bg-base-200 cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-primary' : 'hover:bg-base-300'
      }`}
      onClick={() => onSelect(relationship.id!)}
    >
      <div className="card-body">
        <div className="flex justify-between items-start mb-2">
          <h4 className="card-title text-lg">
            {getCharacterName(relationship.characterId)} ↔ {getCharacterName(relationship.npcId)}
          </h4>
          <div className={`badge ${getRelationshipTypeColor(relationship.relationshipType)}`}>
            {relationship.relationshipType}
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <p className={`font-semibold ${getRelationshipColor(relationship.strength)}`}>
            Strength: {relationship.strength > 0 ? '+' : ''}{relationship.strength}
          </p>
          <p>Trust: {relationship.trust}%</p>
          <p>Fear: {relationship.fear}%</p>
          <p>Respect: {relationship.respect}%</p>
        </div>

        {relationship.notes && (
          <p className="text-sm text-base-content/70 mt-2">{relationship.notes}</p>
        )}
        {relationship.latestEvent && relationship.latestEvent.date && (
          <div className="mt-2 text-sm text-base-content/60">
            <strong>Recent:</strong> {relationship.latestEvent.description} ({new Date(relationship.latestEvent.date).toLocaleDateString()})
          </div>
        )}

        <div className="card-actions justify-end mt-4">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(relationship); }}
            className="btn btn-secondary btn-xs"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (relationship.id) onDelete(relationship.id); }}
            className="btn btn-neutral btn-xs"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};