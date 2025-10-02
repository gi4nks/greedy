import React from 'react';
import { NPCRelationship } from '@greedy/shared';
import Skeleton from '../../components/Skeleton';

interface RelationshipFormProps {
  formData: Partial<NPCRelationship>;
  editingId: number | null;
  characters: any[];
  charactersLoading: boolean;
  onFormDataChange: (data: Partial<NPCRelationship>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const RelationshipForm: React.FC<RelationshipFormProps> = ({
  formData,
  editingId,
  characters,
  charactersLoading,
  onFormDataChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-xl justify-center">
          {editingId ? 'Edit Relationship' : 'Create New Relationship'}
        </h3>

        <div className="space-y-6">
          {/* NPC Selection */}
          <div>
            <label htmlFor="relationship-npc" className="block text-sm font-medium text-base-content mb-2">NPC *</label>
            {charactersLoading ? (
              <Skeleton rows={1} />
            ) : (
              <select
                id="relationship-npc"
                value={formData.npcId || ''}
                onChange={(e) => onFormDataChange({ ...formData, npcId: parseInt(e.target.value) })}
                className="select select-bordered w-full"
                required
              >
                <option value="">Select NPC</option>
                {characters
                  .filter(char => char.character_type === 'npc')
                  .map(char => (
                    <option key={char.id} value={char.id}>
                      {char.name} {char.role ? `(${char.role})` : ''}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Character Selection */}
          <div>
            <label htmlFor="relationship-character" className="block text-sm font-medium text-base-content mb-2">Character *</label>
            {charactersLoading ? (
              <Skeleton rows={1} />
            ) : (
              <select
                id="relationship-character"
                value={formData.characterId || ''}
                onChange={(e) => onFormDataChange({ ...formData, characterId: parseInt(e.target.value) })}
                className="select select-bordered w-full"
                required
              >
                <option value="">Select Character</option>
                {characters
                  .filter(char => char.character_type === 'pc')
                  .map(char => (
                    <option key={char.id} value={char.id}>
                      {char.name} {char.class ? `(${char.class})` : ''}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Relationship Type */}
          <div>
            <label htmlFor="relationship-type" className="block text-sm font-medium text-base-content mb-2">Relationship Type</label>
            <select
              id="relationship-type"
              value={formData.relationshipType}
              onChange={(e) => onFormDataChange({ ...formData, relationshipType: e.target.value as any })}
              className="select select-bordered w-full"
            >
              <option value="ally">Ally</option>
              <option value="enemy">Enemy</option>
              <option value="neutral">Neutral</option>
              <option value="romantic">Romantic</option>
              <option value="family">Family</option>
              <option value="friend">Friend</option>
              <option value="rival">Rival</option>
              <option value="acquaintance">Acquaintance</option>
            </select>
          </div>

          {/* Strength, Trust, Fear, Respect */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="relationship-strength" className="block text-sm font-medium text-base-content mb-2">
                Strength (-10 to +10)
              </label>
              <input
                id="relationship-strength"
                type="number"
                value={formData.strength}
                onChange={(e) => onFormDataChange({ ...formData, strength: parseInt(e.target.value) })}
                className="input input-bordered w-full"
                min="-10"
                max="10"
              />
            </div>
            <div>
              <label htmlFor="relationship-trust" className="block text-sm font-medium text-base-content mb-2">
                Trust (0-100%)
              </label>
              <input
                id="relationship-trust"
                type="number"
                value={formData.trust}
                onChange={(e) => onFormDataChange({ ...formData, trust: parseInt(e.target.value) })}
                className="input input-bordered w-full"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label htmlFor="relationship-fear" className="block text-sm font-medium text-base-content mb-2">
                Fear (0-100%)
              </label>
              <input
                id="relationship-fear"
                type="number"
                value={formData.fear}
                onChange={(e) => onFormDataChange({ ...formData, fear: parseInt(e.target.value) })}
                className="input input-bordered w-full"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label htmlFor="relationship-respect" className="block text-sm font-medium text-base-content mb-2">
                Respect (0-100%)
              </label>
              <input
                id="relationship-respect"
                type="number"
                value={formData.respect}
                onChange={(e) => onFormDataChange({ ...formData, respect: parseInt(e.target.value) })}
                className="input input-bordered w-full"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="relationship-notes" className="block text-sm font-medium text-base-content mb-2">Notes</label>
            <textarea
              id="relationship-notes"
              value={formData.notes || ''}
              onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
              rows={3}
              className="textarea textarea-bordered w-full"
              placeholder="Additional notes about this relationship"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="card-actions justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={charactersLoading}
          >
            {editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );
};