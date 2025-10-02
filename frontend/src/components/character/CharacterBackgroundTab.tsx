import React, { useRef } from 'react';
import { CharacterForm as CharacterFormType } from '@greedy/shared';

interface CharacterBackgroundTabProps {
  formData: CharacterFormType;
  onFormDataChange: (data: CharacterFormType) => void;
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="badge badge-primary gap-2">
      {label}
      <button onClick={onRemove} className="btn btn-xs btn-ghost btn-circle">×</button>
    </div>
  );
}

export function CharacterBackgroundTab({
  formData,
  onFormDataChange
}: CharacterBackgroundTabProps): JSX.Element {
  const tagInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddTag = () => {
    const v = (tagInputRef.current?.value || '').trim();
    if (!v) return;
    if (!formData.tags?.includes(v)) {
      onFormDataChange({ ...formData, tags: [...(formData.tags || []), v] });
    }
    if (tagInputRef.current) tagInputRef.current.value = '';
  };

  const handleRemoveTag = (tag: string) => {
    onFormDataChange({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold mb-3">Background & Personality</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="personality-traits" className="block text-sm font-medium text-base-content mb-2">
            Personality Traits
          </label>
          <textarea
            id="personality-traits"
            value={formData.personalityTraits || ''}
            onChange={(e) => onFormDataChange({ ...formData, personalityTraits: e.target.value })}
            className="textarea textarea-bordered w-full h-24"
            placeholder="Describe your character's personality traits..."
          />
        </div>
        <div>
          <label htmlFor="ideals" className="block text-sm font-medium text-base-content mb-2">Ideals</label>
          <textarea
            id="ideals"
            value={formData.ideals || ''}
            onChange={(e) => onFormDataChange({ ...formData, ideals: e.target.value })}
            className="textarea textarea-bordered w-full h-24"
            placeholder="What does your character believe in..."
          />
        </div>
        <div>
          <label htmlFor="bonds" className="block text-sm font-medium text-base-content mb-2">Bonds</label>
          <textarea
            id="bonds"
            value={formData.bonds || ''}
            onChange={(e) => onFormDataChange({ ...formData, bonds: e.target.value })}
            className="textarea textarea-bordered w-full h-24"
            placeholder="What ties does your character have..."
          />
        </div>
        <div>
          <label htmlFor="flaws" className="block text-sm font-medium text-base-content mb-2">Flaws</label>
          <textarea
            id="flaws"
            value={formData.flaws || ''}
            onChange={(e) => onFormDataChange({ ...formData, flaws: e.target.value })}
            className="textarea textarea-bordered w-full h-24"
            placeholder="What are your character's weaknesses..."
          />
        </div>
      </div>
      <div>
        <label htmlFor="backstory" className="block text-sm font-medium text-base-content mb-2">
          Backstory
        </label>
        <textarea
          id="backstory"
          value={formData.backstory || ''}
          onChange={(e) => onFormDataChange({ ...formData, backstory: e.target.value })}
          className="textarea textarea-bordered w-full h-32"
          placeholder="Tell your character's story..."
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-base-content mb-2">
          Legacy Description
        </label>
        <textarea
          id="description"
          placeholder="Character description (Markdown supported)"
          value={formData.description || ''}
          onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
          className="textarea textarea-bordered w-full h-32"
        />
      </div>
      <div>
        <h5 className="text-md font-medium mb-2">Tags</h5>
        <div className="flex items-center mb-2">
          <label htmlFor="tag-input" className="sr-only">Add tag</label>
          <input
            ref={tagInputRef}
            id="tag-input"
            type="text"
            placeholder="Add tag"
            className="input input-bordered mr-2 flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          />
          <button type="button" onClick={handleAddTag} className="btn btn-secondary btn-sm">
            Add
          </button>
        </div>
        <div className="mt-2">
          {(formData.tags || []).map(tag => (
            <Chip key={tag} label={tag} onRemove={() => handleRemoveTag(tag)} />
          ))}
        </div>
      </div>
    </div>
  );
}