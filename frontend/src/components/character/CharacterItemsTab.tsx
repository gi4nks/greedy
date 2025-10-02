import React from 'react';
import { CharacterForm as CharacterFormType, MagicItem } from '@greedy/shared';

interface CharacterItemsTabProps {
  formData: CharacterFormType;
  editingId: number | null;
  magicItems: MagicItem[];
  onFormDataChange: (data: CharacterFormType) => void;
  onAssignMagicItem: (itemId: number, characterId: number) => void;
  onUnassignMagicItem: (itemId: number, characterId: number) => void;
  onCreateMagicItem: (item: Partial<MagicItem>) => void;
  onShowAssignModal: () => void;
}

export function CharacterItemsTab({
  formData,
  editingId,
  magicItems,
  onFormDataChange,
  onAssignMagicItem,
  onUnassignMagicItem,
  onCreateMagicItem,
  onShowAssignModal
}: CharacterItemsTabProps): JSX.Element {
  const handleUnassignItem = (itemId: number) => {
    if (itemId && editingId) {
      onUnassignMagicItem(itemId, editingId);
    }
  };

  const handleCreateItem = () => {
    const itemName = window.prompt('Enter magical item name:');
    if (itemName) {
      onCreateMagicItem({
        name: itemName,
        description: 'New magical item',
        rarity: 'common',
        type: 'Wondrous item',
        attunement_required: false
      });
    }
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold mb-3">Magical Items</h4>

      {/* Magical Items Section */}
      <div className="mb-6">
        <h5 className="text-md font-medium mb-3 flex items-center gap-2">
          <span className="text-secondary">✨</span>
          Magical Items
        </h5>
        <div className="mb-4">
          <h6 className="text-sm font-medium text-base-content/70 mb-2">Assigned Magical Items</h6>
          <div className="space-y-2">
            {magicItems
              .filter(item => item.owners?.some(owner => owner.id === editingId))
              .map(item => (
                <div key={item.id} className="flex items-center justify-between bg-secondary/10 p-3 rounded border border-secondary/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base-content">{item.name}</span>
                      {item.rarity && (
                        <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                          {item.rarity}
                        </span>
                      )}
                      {item.type && (
                        <span className="text-xs bg-info/20 text-info px-2 py-1 rounded">
                          {item.type}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-base-content/70 mt-1">{item.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnassignItem(item.id!)}
                    className="btn btn-error btn-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            {magicItems.filter(item => item.owners?.some(owner => owner.id === editingId)).length === 0 && (
              <div className="text-base-content/50 italic text-sm p-3 bg-base-200 rounded">
                No magical items assigned
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onShowAssignModal}
            className="btn btn-primary btn-sm"
          >
            Assign
          </button>
          <button
            type="button"
            onClick={handleCreateItem}
            className="btn btn-secondary btn-sm"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}