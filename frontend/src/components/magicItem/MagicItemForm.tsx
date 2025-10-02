import React, { useState } from 'react';
import { MagicItem } from '../../../../shared/types';

interface MagicItemFormProps {
  initialData?: Partial<MagicItem>;
  onSubmit: (data: Partial<MagicItem>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const MagicItemForm: React.FC<MagicItemFormProps> = ({
  initialData = { name: '', description: '' },
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<Partial<MagicItem>>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h3 className="card-title text-xl justify-center">
          {isEditing ? 'Edit Magic Item' : 'Create Magic Item'}
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="magic-item-name" className="block text-sm font-medium text-base-content mb-2">
                Name
              </label>
              <input
                id="magic-item-name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label htmlFor="magic-item-rarity" className="block text-sm font-medium text-base-content mb-2">
                Rarity
              </label>
              <input
                id="magic-item-rarity"
                value={formData.rarity || ''}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label htmlFor="magic-item-type" className="block text-sm font-medium text-base-content mb-2">
                Type
              </label>
              <input
                id="magic-item-type"
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input input-bordered w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="magic-item-description" className="block text-sm font-medium text-base-content mb-2">
                Description / Properties (Markdown)
              </label>
              <textarea
                id="magic-item-description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="textarea textarea-bordered w-full h-32"
              />
            </div>
          </div>
        </div>

        <div className="card-actions justify-end">
          <button type="submit" className="btn btn-primary btn-sm">
            {isEditing ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};