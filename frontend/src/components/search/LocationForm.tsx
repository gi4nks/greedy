import React, { useState } from 'react';
import { MarkdownPreview } from './MarkdownPreview';
import { TagManager } from './TagManager';

interface LocationFormProps {
  onCreate: (data: { name: string; description: string; notes: string; tags: string[] }) => void;
  onCancel: () => void;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  onCreate,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
    tags: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  const handleAddTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg">Add New Location</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="location-name-input" className="block text-sm font-medium text-base-content mb-2">Name</label>
            <input
              id="location-name-input"
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="location-description-textarea" className="block text-sm font-medium text-base-content mb-2">Description</label>
              <textarea
                id="location-description-textarea"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="textarea textarea-bordered w-full h-20"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="location-notes-textarea" className="block text-sm font-medium text-base-content mb-2">Notes (Markdown supported)</label>
              <textarea
                id="location-notes-textarea"
                placeholder="Notes (Markdown supported)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="textarea textarea-bordered w-full h-32"
                required
              />
            </div>
          </div>
          <TagManager
            tags={formData.tags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            inputId="location-tags-input"
          />
          <div className="modal-action">
            <button type="submit" className="btn btn-primary btn-sm">Add Location</button>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};