import React from 'react';
import { CombatEncounter } from '@greedy/shared';
import { CombatEncounterCard } from './CombatEncounterCard';

interface CombatEncounterListProps {
  encounters: CombatEncounter[];
  selectedEncounterId: number | null;
  onSelectEncounter: (id: number) => void;
  onDeleteEncounter: (id: number) => void;
}

export const CombatEncounterList: React.FC<CombatEncounterListProps> = ({
  encounters,
  selectedEncounterId,
  onSelectEncounter,
  onDeleteEncounter,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title">Combat Encounters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {encounters.map((encounter: CombatEncounter) => (
            <CombatEncounterCard
              key={encounter.id}
              encounter={encounter}
              isSelected={selectedEncounterId === encounter.id}
              onSelect={onSelectEncounter}
              onDelete={onDeleteEncounter}
            />
          ))}
        </div>
        {encounters.length === 0 && (
          <div className="text-center py-8">
            <p className="text-base-content/60">No combat encounters found. Create your first encounter!</p>
          </div>
        )}
      </div>
    </div>
  );
};