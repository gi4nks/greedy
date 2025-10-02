import React from 'react';
import { CharacterForm as CharacterFormType } from '@greedy/shared';

interface CharacterCombatTabProps {
  formData: CharacterFormType;
  onFormDataChange: (data: CharacterFormType) => void;
}

export function CharacterCombatTab({
  formData,
  onFormDataChange
}: CharacterCombatTabProps): JSX.Element {
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold mb-3">Combat Statistics</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="hit-points" className="block text-sm font-medium text-base-content mb-2">
            Hit Points
          </label>
          <input
            id="hit-points"
            type="number"
            min="0"
            value={formData.hitPoints || 0}
            onChange={(e) => onFormDataChange({ ...formData, hitPoints: parseInt(e.target.value) || 0 })}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label htmlFor="max-hit-points" className="block text-sm font-medium text-base-content mb-2">
            Max Hit Points
          </label>
          <input
            id="max-hit-points"
            type="number"
            min="0"
            value={formData.maxHitPoints || 0}
            onChange={(e) => onFormDataChange({ ...formData, maxHitPoints: parseInt(e.target.value) || 0 })}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label htmlFor="armor-class" className="block text-sm font-medium text-base-content mb-2">
            Armor Class
          </label>
          <input
            id="armor-class"
            type="number"
            min="0"
            value={formData.armorClass || 10}
            onChange={(e) => onFormDataChange({ ...formData, armorClass: parseInt(e.target.value) || 10 })}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label htmlFor="speed" className="block text-sm font-medium text-base-content mb-2">Speed</label>
          <input
            id="speed"
            type="number"
            min="0"
            value={formData.speed || 30}
            onChange={(e) => onFormDataChange({ ...formData, speed: parseInt(e.target.value) || 30 })}
            className="input input-bordered w-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="initiative" className="block text-sm font-medium text-base-content mb-2">
            Initiative
          </label>
          <input
            id="initiative"
            type="number"
            value={formData.initiative || 0}
            onChange={(e) => onFormDataChange({ ...formData, initiative: parseInt(e.target.value) || 0 })}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label htmlFor="proficiency-bonus" className="block text-sm font-medium text-base-content mb-2">
            Proficiency Bonus
          </label>
          <input
            id="proficiency-bonus"
            type="number"
            min="0"
            max="6"
            value={formData.proficiencyBonus || 2}
            onChange={(e) => onFormDataChange({ ...formData, proficiencyBonus: parseInt(e.target.value) || 2 })}
            className="input input-bordered w-full"
          />
        </div>
      </div>
    </div>
  );
}