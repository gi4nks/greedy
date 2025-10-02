import React from 'react';
import { CharacterForm as CharacterFormType } from '@greedy/shared';

interface CharacterSpellsTabProps {
  formData: CharacterFormType;
  onFormDataChange: (data: CharacterFormType) => void;
}

export function CharacterSpellsTab({
  formData,
  onFormDataChange
}: CharacterSpellsTabProps): JSX.Element {
  const handleAddSpell = () => {
    const newSpells = [...(formData.spells || []), { level: 0 as const, name: '', prepared: false }];
    onFormDataChange({ ...formData, spells: newSpells });
  };

  const handleRemoveSpell = (index: number) => {
    const newSpells = (formData.spells || []).filter((_, i) => i !== index);
    onFormDataChange({ ...formData, spells: newSpells });
  };

  const handleSpellChange = (index: number, field: string, value: any) => {
    const newSpells = [...(formData.spells || [])];
    newSpells[index] = { ...newSpells[index], [field]: value };
    onFormDataChange({ ...formData, spells: newSpells });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold mb-3">Spellcasting</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="spellcasting-ability" className="block text-sm font-medium text-base-content mb-2">
            Spellcasting Ability
          </label>
          <select
            id="spellcasting-ability"
            value={formData.spellcastingAbility || ''}
            onChange={(e) => onFormDataChange({ ...formData, spellcastingAbility: e.target.value || undefined })}
            className="select select-bordered w-full"
          >
            <option value="">None</option>
            <option value="intelligence">Intelligence</option>
            <option value="wisdom">Wisdom</option>
            <option value="charisma">Charisma</option>
          </select>
        </div>
        <div>
          <label htmlFor="spell-save-dc" className="block text-sm font-medium text-base-content mb-2">
            Spell Save DC
          </label>
          <input
            id="spell-save-dc"
            type="number"
            min="0"
            value={formData.spellSaveDC || 0}
            onChange={(e) => onFormDataChange({ ...formData, spellSaveDC: parseInt(e.target.value) || 0 })}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label htmlFor="spell-attack-bonus" className="block text-sm font-medium text-base-content mb-2">
            Spell Attack Bonus
          </label>
          <input
            id="spell-attack-bonus"
            type="number"
            value={formData.spellAttackBonus || 0}
            onChange={(e) => onFormDataChange({ ...formData, spellAttackBonus: parseInt(e.target.value) || 0 })}
            className="input input-bordered w-full"
          />
        </div>
      </div>
      <div>
        <h5 className="text-md font-medium mb-2">Known Spells</h5>
        {(formData.spells || []).map((spell, index) => (
          <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-base-200 rounded">
            <select
              value={spell.level}
              onChange={(e) => handleSpellChange(index, 'level', parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)}
              className="select select-bordered"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                <option key={level} value={level}>
                  {level === 0 ? 'Cantrip' : `Level ${level}`}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Spell name"
              value={spell.name}
              onChange={(e) => handleSpellChange(index, 'name', e.target.value)}
              className="input input-bordered flex-1"
            />
            <label className="flex items-center">
              <input
                id={`spell-prepared-${index}`}
                type="checkbox"
                checked={spell.prepared}
                onChange={(e) => handleSpellChange(index, 'prepared', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor={`spell-prepared-${index}`}>Prepared</label>
            </label>
            <button
              type="button"
              onClick={() => handleRemoveSpell(index)}
              className="btn btn-error btn-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddSpell}
          className="btn btn-success btn-sm"
        >
          Add Spell
        </button>
      </div>
    </div>
  );
}