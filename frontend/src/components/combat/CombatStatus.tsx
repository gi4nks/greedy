import React from 'react';
import { CombatEncounter, CombatParticipant } from '@greedy/shared';

interface CombatStatusProps {
  encounter: CombatEncounter;
  participants: CombatParticipant[];
  onPreviousTurn: () => void;
  onNextTurn: () => void;
  onStartCombat: () => void;
  onEndCombat: () => void;
}

export const CombatStatus: React.FC<CombatStatusProps> = ({
  encounter,
  participants,
  onPreviousTurn,
  onNextTurn,
  onStartCombat,
  onEndCombat,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-xl">⚔️ Combat Status</h3>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{encounter.round}</div>
            <div className="text-sm text-base-content/70">Round</div>
          </div>

          {encounter.status === 'active' && (
            <div className="text-center">
              <div className="text-lg font-semibold text-base-content">
                {participants.find((p: CombatParticipant) => p.id === encounter.activeCombatantId)?.character?.name || 'Unknown'}
              </div>
              <div className="text-sm text-base-content/70">Current Turn</div>
            </div>
          )}

          <div className={`text-center p-2 rounded ${
            encounter.status === 'active' ? 'bg-success/20 text-success' :
            encounter.status === 'completed' ? 'bg-info/20 text-info' :
            'bg-warning/20 text-warning'
          }`}>
            {encounter.status.toUpperCase()}
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={onPreviousTurn}
              disabled={encounter.status !== 'active'}
              className="btn btn-outline btn-sm"
            >
              Previous
            </button>
            <button
              onClick={onNextTurn}
              disabled={encounter.status !== 'active'}
              className="btn btn-primary btn-sm"
            >
              Next
            </button>
          </div>

          {encounter.status === 'active' ? (
            <button
              onClick={onEndCombat}
              className="btn btn-neutral btn-sm w-full"
            >
              End Combat
            </button>
          ) : encounter.status === 'paused' ? (
            <button
              onClick={onStartCombat}
              className="btn btn-success btn-sm w-full"
            >
              Resume Combat
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};