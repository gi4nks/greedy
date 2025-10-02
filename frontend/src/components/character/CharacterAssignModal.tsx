import React from 'react';
import { MagicItem } from '@greedy/shared';

interface CharacterAssignModalProps {
  isOpen: boolean;
  magicItems: MagicItem[];
  editingId: number | null;
  onAssign: (itemId: number, characterId: number) => void;
  onClose: () => void;
}

export function CharacterAssignModal({
  isOpen,
  magicItems,
  editingId,
  onAssign,
  onClose
}: CharacterAssignModalProps): JSX.Element {
  if (!isOpen) return <></>;

  const availableItems = magicItems.filter(item => !item.owners?.some(owner => owner.id === editingId));

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Assign Magical Item</h3>
        <div className="space-y-2">
          {availableItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-base-200">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  {item.rarity && (
                    <div className="badge badge-primary badge-sm">
                      {item.rarity}
                    </div>
                  )}
                  {item.type && (
                    <div className="badge badge-secondary badge-sm">
                      {item.type}
                    </div>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-base-content/70 mt-1">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (item.id && editingId) {
                    onAssign(item.id, editingId);
                    onClose();
                  }
                }}
                className="btn btn-success btn-sm"
              >
                Assign
              </button>
            </div>
          ))}
          {availableItems.length === 0 && (
            <div className="text-base-content/50 italic text-sm p-4 text-center">
              No available magical items to assign
            </div>
          )}
        </div>
        <div className="modal-action">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}