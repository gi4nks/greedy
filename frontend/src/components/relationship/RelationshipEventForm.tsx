import React from 'react';
import { RelationshipEvent } from '@greedy/shared';

interface RelationshipEventFormProps {
  formData: Partial<RelationshipEvent>;
  editingId: number | null;
  onFormDataChange: (data: Partial<RelationshipEvent>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const RelationshipEventForm: React.FC<RelationshipEventFormProps> = ({
  formData,
  editingId,
  onFormDataChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-xl justify-center">
          {editingId ? 'Edit Relationship Event' : 'Add Relationship Event'}
        </h3>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <label htmlFor="event-description" className="block text-sm font-medium text-base-content mb-2">Description *</label>
            <textarea
              id="event-description"
              required
              value={formData.description || ''}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              rows={3}
              className="textarea textarea-bordered w-full"
              placeholder="Describe what happened in this relationship event"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="event-date" className="block text-sm font-medium text-base-content mb-2">Date *</label>
            <input
              id="event-date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => onFormDataChange({ ...formData, date: e.target.value })}
              className="input input-bordered w-full"
            />
          </div>

          {/* Impact Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="event-strength" className="block text-sm font-medium text-base-content mb-2">
                Strength Change (-10 to +10)
              </label>
              <input
                id="event-strength"
                type="number"
                value={formData.impactValue}
                onChange={(e) => onFormDataChange({ ...formData, impactValue: parseInt(e.target.value) })}
                className="input input-bordered w-full"
                min="-10"
                max="10"
              />
            </div>
            <div>
              <label htmlFor="event-trust" className="block text-sm font-medium text-base-content mb-2">
                Trust Change (-100 to +100)
              </label>
              <input
                id="event-trust"
                type="number"
                value={formData.trustChange}
                onChange={(e) => onFormDataChange({ ...formData, trustChange: parseInt(e.target.value) })}
                className="input input-bordered w-full"
                min="-100"
                max="100"
              />
            </div>
            <div>
              <label htmlFor="event-fear" className="block text-sm font-medium text-base-content mb-2">
                Fear Change (-100 to +100)
              </label>
              <input
                id="event-fear"
                type="number"
                value={formData.fearChange}
                onChange={(e) => onFormDataChange({ ...formData, fearChange: parseInt(e.target.value) })}
                className="input input-bordered w-full"
                min="-100"
                max="100"
              />
            </div>
            <div>
              <label htmlFor="event-respect" className="block text-sm font-medium text-base-content mb-2">
                Respect Change (-100 to +100)
              </label>
              <input
                id="event-respect"
                type="number"
                value={formData.respectChange}
                onChange={(e) => onFormDataChange({ ...formData, respectChange: parseInt(e.target.value) })}
                className="input input-bordered w-full"
                min="-100"
                max="100"
              />
            </div>
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
          >
            {editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );
};