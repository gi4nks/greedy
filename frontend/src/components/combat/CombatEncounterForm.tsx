import React from 'react';
import { CombatEncounter } from '@greedy/shared';

interface CombatEncounterFormProps {
  formData: Partial<CombatEncounter>;
  onFormDataChange: (data: Partial<CombatEncounter>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const CombatEncounterForm: React.FC<CombatEncounterFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-xl justify-center">Create New Combat Encounter</h3>

        <div className="space-y-6">
          <div>
            <label htmlFor="encounter-name" className="block text-sm font-medium text-base-content mb-2">Encounter Name *</label>
            <input
              id="encounter-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              className="input input-bordered w-full"
              placeholder="Enter encounter name"
            />
          </div>
        </div>

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
          >
            Create Encounter
          </button>
        </div>
      </div>
    </form>
  );
};