import React from 'react';
import { CombatEncounter, CombatParticipant } from '@greedy/shared';
import { CombatParticipantCard } from './CombatParticipantCard';

interface CombatParticipantsProps {
  encounter: CombatEncounter;
  participants: CombatParticipant[];
  onUpdateParticipant: (id: number, updates: Partial<CombatParticipant>) => void;
  onRemoveParticipant: (id: number) => void;
  onAddParticipant: () => void;
}

export const CombatParticipants: React.FC<CombatParticipantsProps> = ({
  encounter,
  participants,
  onUpdateParticipant,
  onRemoveParticipant,
  onAddParticipant,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-xl">👥 Participants ({participants.length})</h3>

        {participants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚔️</div>
            <p className="text-lg mb-4 text-base-content/70">No participants added yet</p>
            <button
              onClick={onAddParticipant}
              className="btn btn-primary btn-sm"
            >
              Add Participant
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {participants
              .sort((a: CombatParticipant, b: CombatParticipant) => b.initiative - a.initiative)
              .map((participant: CombatParticipant) => (
              <CombatParticipantCard
                key={participant.id}
                participant={participant}
                isActive={encounter.activeCombatantId === participant.id}
                onUpdateParticipant={onUpdateParticipant}
                onRemoveParticipant={onRemoveParticipant}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};