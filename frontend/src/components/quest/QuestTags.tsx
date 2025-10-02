import React, { useRef } from 'react';

interface ChipProps {
  label: string;
  onRemove: () => void;
}

const Chip: React.FC<ChipProps> = ({ label, onRemove }) => {
  return (
    <div className="badge badge-primary gap-2">
      {label}
      <button onClick={onRemove} className="btn btn-xs btn-ghost btn-circle">×</button>
    </div>
  );
};

interface QuestTagsProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const QuestTags: React.FC<QuestTagsProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
}) => {
  const tagInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddTag = (): void => {
    const v = (tagInputRef.current?.value || '').trim();
    if (!v) return;
    if (!tags.includes(v)) {
      onAddTag(v);
    }
    if (tagInputRef.current) tagInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div>
      <label htmlFor="quest-tags" className="block text-sm font-medium text-base-content mb-2">Tags</label>
      <div className="flex items-center gap-2">
        <input
          ref={tagInputRef}
          id="quest-tags"
          type="text"
          placeholder="Add tag"
          className="input input-bordered flex-1"
          onKeyDown={handleKeyDown}
        />
        <button type="button" onClick={handleAddTag} className="btn btn-secondary btn-sm">Add Tag</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map(tag => (
          <Chip key={tag} label={tag} onRemove={() => onRemoveTag(tag)} />
        ))}
      </div>
    </div>
  );
};