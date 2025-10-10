import React, { useState, useEffect } from 'react';
import { Character } from '../../hooks/useCharacters';

interface CharacterAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (characterIds: number[]) => void;
  characters: Character[];
  initiallySelectedIds: number[];
  isSaving: boolean;
}

export default function CharacterAssignmentModal({
  isOpen,
  onClose,
  onSave,
  characters,
  initiallySelectedIds,
  isSaving,
}: CharacterAssignmentModalProps): JSX.Element {
  const [selectedIds, setSelectedIds] = useState<number[]>(initiallySelectedIds);

  // Update selected IDs when initiallySelectedIds changes
  useEffect(() => {
    setSelectedIds(initiallySelectedIds);
  }, [initiallySelectedIds]);

  const handleCharacterToggle = (characterId: number) => {
    setSelectedIds(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  const handleSave = () => {
    onSave(selectedIds);
  };

  const handleCancel = () => {
    setSelectedIds(initiallySelectedIds); // Reset to initial state
    onClose();
  };

  if (!isOpen) return <></>;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Assign Magic Item to Characters</h3>

        <div className="space-y-4">
          <p className="text-sm text-base-content/70">
            Select the characters who should be assigned this magic item. You can select multiple characters.
          </p>

          {characters.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              No characters available. Create some characters first.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {characters.map(character => (
                <div
                  key={character.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-base-300 hover:bg-base-100 cursor-pointer"
                  onClick={() => handleCharacterToggle(character.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(character.id)}
                    onChange={() => handleCharacterToggle(character.id)}
                    className="checkbox checkbox-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{character.name}</div>
                    <div className="text-sm text-base-content/60">
                      {character.race && `Race: ${character.race}`} • Level {character.level}
                      {character.role && ` • ${character.role}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-sm text-base-content/60 mt-4">
            Selected: {selectedIds.length} character{selectedIds.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              'Save Assignments'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}