import React from 'react';
import { CombatParticipant } from '@greedy/shared';
import { COMPONENT_COLORS } from '../../config/theme';

interface CombatParticipantCardProps {
  participant: CombatParticipant;
  isActive: boolean;
  onUpdateParticipant: (id: number, updates: Partial<CombatParticipant>) => void;
  onRemoveParticipant: (id: number) => void;
}

export const CombatParticipantCard: React.FC<CombatParticipantCardProps> = ({
  participant,
  isActive,
  onUpdateParticipant,
  onRemoveParticipant,
}) => {
  const getHpColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 75) return COMPONENT_COLORS.combat.health.full;
    if (percentage >= 50) return COMPONENT_COLORS.combat.health.injured;
    if (percentage >= 25) return COMPONENT_COLORS.combat.health.injured;
    return COMPONENT_COLORS.combat.health.critical;
  };

  return (
    <div
      className={`card border-2 transition-all duration-200 ${
        isActive
          ? 'border-primary bg-primary/5 shadow-lg'
          : `border-base-300 ${COMPONENT_COLORS.card.background}`
      }`}
    >
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {isActive && (
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            )}
            <div>
              <h4 className="card-title text-lg">{participant.character?.name || 'Unknown'}</h4>
              <div className="text-sm text-base-content/70">
                Initiative: {participant.initiative} | AC: {participant.armorClass}
              </div>
            </div>
          </div>
          <button
            onClick={() => { if (participant.id) onRemoveParticipant(participant.id); }}
            className="btn btn-error btn-xs"
          >
            Remove
          </button>
        </div>

        {/* HP Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">HP</span>
            <span className={`text-sm font-bold ${getHpColor(participant.currentHp, participant.maxHp)}`}>
              {participant.currentHp}/{participant.maxHp}
            </span>
          </div>
          <progress
            className="progress w-full"
            value={(participant.currentHp / participant.maxHp) * 100}
            max="100"
          ></progress>
        </div>

        {/* Action Economy */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className={`text-center p-2 rounded text-xs ${
            participant.hasAction ? COMPONENT_COLORS.status.success : 'bg-base-300 text-base-content/50'
          }`}>
            Action
          </div>
          <div className={`text-center p-2 rounded text-xs ${
            participant.hasBonusAction ? COMPONENT_COLORS.status.success : 'bg-base-300 text-base-content/50'
          }`}>
            Bonus
          </div>
          <div className={`text-center p-2 rounded text-xs ${
            participant.hasReaction ? COMPONENT_COLORS.status.success : 'bg-base-300 text-base-content/50'
          }`}>
            Reaction
          </div>
          <div className={`text-center p-2 rounded text-xs ${
            participant.hasMovement ? COMPONENT_COLORS.status.success : 'bg-base-300 text-base-content/50'
          }`}>
            Move
          </div>
        </div>

        {/* Notes */}
        <textarea
          value={participant.notes}
          onChange={(e) => {
            if (participant.id) {
              onUpdateParticipant(participant.id, { notes: e.target.value });
            }
          }}
          placeholder="Notes..."
          className="textarea textarea-bordered textarea-sm w-full"
          rows={2}
        />
      </div>
    </div>
  );
};