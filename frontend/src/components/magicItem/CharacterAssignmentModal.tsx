import React, { useState, useMemo } from 'react';
import { Character } from '../../../../shared/types';

interface CharacterAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (characterIds: number[]) => void;
  characters: Character[];
  initiallySelectedIds: number[];
  isSaving?: boolean;
}

export const CharacterAssignmentModal: React.FC<CharacterAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  characters,
  initiallySelectedIds,
  isSaving = false,
}) => {
  const [selectedCharIds, setSelectedCharIds] = useState<number[]>(initiallySelectedIds);
  const [charSearch, setCharSearch] = useState('');
  const [charTypeFilter, setCharTypeFilter] = useState<'all' | 'pc' | 'npc'>('all');

  const filteredCharacters = useMemo(() => {
    const q = charSearch.trim().toLowerCase();
    const validCharacters = characters.filter(c => c.id !== undefined);
    let list = validCharacters;
    if (charTypeFilter !== 'all') list = list.filter(c => c.character_type === charTypeFilter);
    if (!q) return list;
    return list.filter(c => c.name.toLowerCase().includes(q));
  }, [characters, charSearch, charTypeFilter]);

  const handleSave = () => {
    onSave(selectedCharIds);
  };

  const handleSelectAll = () => {
    setSelectedCharIds(filteredCharacters.map(c => c.id!));
  };

  const handleClear = () => {
    setSelectedCharIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Assign Characters</h3>
        <div className="py-4">
          <div className="mb-3 flex gap-2">
            <input
              className="input input-bordered flex-1"
              placeholder="Search characters..."
              value={charSearch}
              onChange={(e) => setCharSearch(e.target.value)}
            />
            <select
              className="select select-bordered"
              value={charTypeFilter}
              onChange={(e) => setCharTypeFilter(e.target.value as 'all' | 'pc' | 'npc')}
            >
              <option value="all">All</option>
              <option value="pc">Players</option>
              <option value="npc">NPCs</option>
            </select>
            <button onClick={handleSelectAll} className="btn btn-secondary btn-sm">
              Select All
            </button>
            <button onClick={handleClear} className="btn btn-ghost btn-sm">
              Clear
            </button>
          </div>
          <div className="max-h-64 overflow-auto border border-base-300 rounded-box p-2 mb-4">
            {filteredCharacters.map(c => (
              <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-box cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={selectedCharIds.includes(c.id!)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCharIds(prev => [...prev, c.id!]);
                    } else {
                      setSelectedCharIds(prev => prev.filter(id => id !== c.id));
                    }
                  }}
                />
                <span className="flex-1">{c.name}</span>
                <span className="text-xs px-2 py-1 rounded bg-base-200">{c.character_type || 'pc'}</span>
              </label>
            ))}
            {filteredCharacters.length === 0 && (
              <div className="text-sm text-base-content/60 p-2">No characters found</div>
            )}
          </div>
        </div>
        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn btn-primary btn-sm">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};