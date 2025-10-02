import React, { useState } from 'react';
import { MarkdownPreview } from './MarkdownPreview';
import { TagManager } from './TagManager';

interface NpcFormProps {
  onCreate: (data: { name: string; role: string; description: string; tags: string[] }) => void;
  onCancel: () => void;
}

export const NpcForm: React.FC<NpcFormProps> = ({
  onCreate,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
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
        <h3 className="font-bold text-lg">Add New NPC</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="npc-name-input" className="block text-sm font-medium text-base-content mb-2">Name</label>
            <input
              id="npc-name-input"
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="npc-role-input" className="block text-sm font-medium text-base-content mb-2">Role</label>
            <input
              id="npc-role-input"
              type="text"
              placeholder="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="npc-description-textarea" className="block text-sm font-medium text-base-content mb-2">Description (Markdown supported)</label>
              <textarea
                id="npc-description-textarea"
                placeholder="Description (Markdown supported)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="textarea textarea-bordered w-full h-32"
                required
              />
            </div>
          </div>
          <TagManager
            tags={formData.tags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            inputId="npc-tags-input"
          />
          <div className="modal-action">
            <button type="submit" className="btn btn-primary btn-sm">Add NPC</button>
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