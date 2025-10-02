import React from 'react';
import { CombatEncounter } from '@greedy/shared';

interface CombatEncounterCardProps {
  encounter: CombatEncounter;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export const CombatEncounterCard: React.FC<CombatEncounterCardProps> = ({
  encounter,
  isSelected,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      className={`card bg-base-200 cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-primary' : 'hover:bg-base-300'
      }`}
      onClick={() => onSelect(encounter.id!)}
    >
      <div className="card-body">
        <h4 className="card-title text-lg">{encounter.name}</h4>
        <p className="text-sm text-base-content/70">
          Round: {encounter.round} | Status: {encounter.status}
        </p>
        <div className={`badge ${
          encounter.status === 'active' ? 'badge-success' :
          encounter.status === 'completed' ? 'badge-info' :
          'badge-warning'
        }`}>
          {encounter.status}
        </div>
        <div className="card-actions justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); if (encounter.id) onDelete(encounter.id); }}
            className="btn btn-neutral btn-xs"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};