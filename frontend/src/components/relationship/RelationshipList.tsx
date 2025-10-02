import React from 'react';
import { NPCRelationship } from '@greedy/shared';
import { RelationshipCard } from './RelationshipCard';

interface RelationshipListProps {
  relationships: NPCRelationship[];
  selectedRelationshipId: number | null;
  onSelectRelationship: (id: number) => void;
  onEditRelationship: (relationship: NPCRelationship) => void;
  onDeleteRelationship: (id: number) => void;
  getCharacterName: (id: number) => string;
}

export const RelationshipList: React.FC<RelationshipListProps> = ({
  relationships,
  selectedRelationshipId,
  onSelectRelationship,
  onEditRelationship,
  onDeleteRelationship,
  getCharacterName,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title">NPC Relationships</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relationships.map((relationship: NPCRelationship) => (
            <RelationshipCard
              key={relationship.id}
              relationship={relationship}
              isSelected={selectedRelationshipId === relationship.id}
              onSelect={onSelectRelationship}
              onEdit={onEditRelationship}
              onDelete={onDeleteRelationship}
              getCharacterName={getCharacterName}
            />
          ))}
        </div>
        {relationships.length === 0 && (
          <div className="text-center py-8">
            <p className="text-base-content/60">No relationships found. Create your first relationship to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};