import React, { useState } from 'react';

interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  inputId?: string;
}

export const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
  inputId = "tags-input"
}) => {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    onAddTag(v);
    setTagInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-base-content mb-2">Tags</label>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="text"
          placeholder="Add tag"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="input input-bordered flex-1"
        />
        <button type="button" onClick={handleAddTag} className="btn btn-secondary btn-sm">Add Tag</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map(tag => (
          <div key={tag} className="badge badge-primary gap-2">
            {tag}
            <button onClick={() => onRemoveTag(tag)} className="btn btn-xs btn-ghost btn-circle">×</button>
          </div>
        ))}
      </div>
    </div>
  );
};