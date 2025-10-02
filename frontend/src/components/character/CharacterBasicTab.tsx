import React from 'react';
import { CharacterForm as CharacterFormType } from '@greedy/shared';

interface CharacterBasicTabProps {
  formData: CharacterFormType;
  editingId: number | null;
  adventures: Array<{ id: number; title: string }>;
  onFormDataChange: (data: CharacterFormType) => void;
}

export function CharacterBasicTab({
  formData,
  editingId,
  adventures,
  onFormDataChange
}: CharacterBasicTabProps): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="character-name" className="block text-sm font-medium text-base-content mb-2">
            Character Name
          </label>
          <input
            id="character-name"
            type="text"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            className="input input-bordered w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="race" className="block text-sm font-medium text-base-content mb-2">Race</label>
          <input
            id="race"
            type="text"
            value={formData.race || ''}
            onChange={(e) => onFormDataChange({ ...formData, race: e.target.value })}
            className="input input-bordered w-full"
            placeholder="e.g., Human, Elf, Dwarf"
          />
        </div>
        <div>
          <label htmlFor="background" className="block text-sm font-medium text-base-content mb-2">Background</label>
          <input
            id="background"
            type="text"
            value={formData.background || ''}
            onChange={(e) => onFormDataChange({ ...formData, background: e.target.value })}
            className="input input-bordered w-full"
            placeholder="e.g., Noble, Criminal, Entertainer"
          />
        </div>
        <div>
          <label htmlFor="alignment" className="block text-sm font-medium text-base-content mb-2">Alignment</label>
          <select
            id="alignment"
            value={formData.alignment || ''}
            onChange={(e) => onFormDataChange({ ...formData, alignment: e.target.value })}
            className="select select-bordered w-full"
          >
            <option value="">Select Alignment</option>
            <option value="Lawful Good">Lawful Good</option>
            <option value="Neutral Good">Neutral Good</option>
            <option value="Chaotic Good">Chaotic Good</option>
            <option value="Lawful Neutral">Lawful Neutral</option>
            <option value="True Neutral">True Neutral</option>
            <option value="Chaotic Neutral">Chaotic Neutral</option>
            <option value="Lawful Evil">Lawful Evil</option>
            <option value="Neutral Evil">Neutral Evil</option>
            <option value="Chaotic Evil">Chaotic Evil</option>
          </select>
        </div>
        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-base-content mb-2">
            Experience Points
          </label>
          <input
            id="experience"
            type="number"
            min="0"
            value={formData.experience || 0}
            onChange={(e) => onFormDataChange({ ...formData, experience: parseInt(e.target.value) || 0 })}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label htmlFor="adventure" className="block text-sm font-medium text-base-content mb-2">Adventure</label>
          <select
            id="adventure"
            value={formData.adventure_id || ''}
            onChange={(e) => onFormDataChange({ ...formData, adventure_id: e.target.value ? parseInt(e.target.value) : undefined })}
            className="select select-bordered w-full"
          >
            <option value="">No Adventure Assigned</option>
            {adventures.map(adventure => (
              <option key={adventure.id} value={adventure.id}>
                {adventure.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="character-type" className="block text-sm font-medium text-base-content mb-2">
            Character Type
          </label>
          <select
            id="character-type"
            value={formData.character_type || 'pc'}
            onChange={(e) => onFormDataChange({ ...formData, character_type: e.target.value as 'pc' | 'npc' | 'monster' })}
            className="select select-bordered w-full"
          >
            <option value="pc">Player Character</option>
            <option value="npc">Non-Player Character</option>
            <option value="monster">Monster</option>
          </select>
        </div>

      </div>
    </div>
  );
}