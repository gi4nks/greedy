import React, { useState } from 'react';
import { CharacterForm as CharacterFormType } from '@greedy/shared';

interface CharacterFormProps {
  formData: CharacterFormType;
  editingId: number | null;
  onFormDataChange: (data: CharacterFormType) => void;
  onSubmit: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export function CharacterForm({
  formData,
  editingId,
  onFormDataChange,
  onSubmit,
  onCancel,
  children
}: CharacterFormProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'basic' | 'classes' | 'abilities' | 'combat' | 'items' | 'spells' | 'background'>('basic');

  const tabs = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'classes', label: 'Classes' },
    { key: 'abilities', label: 'Abilities' },
    { key: 'combat', label: 'Combat' },
    { key: 'items', label: 'Items' },
    { key: 'spells', label: 'Spells' },
    { key: 'background', label: 'Background' }
  ];

  // Convert children to array to access individual tabs
  const childrenArray = React.Children.toArray(children);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h3 className="card-title text-xl justify-center">
          {editingId ? 'Edit Character' : 'Create New Character'}
        </h3>

        <div className="flex flex-wrap border-b mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content - Render only the active tab */}
        <div className="min-h-[400px]">
          {activeTab === 'basic' && childrenArray[0]}
          {activeTab === 'classes' && childrenArray[1]}
          {activeTab === 'abilities' && childrenArray[2]}
          {activeTab === 'combat' && childrenArray[3]}
          {activeTab === 'items' && childrenArray[4]}
          {activeTab === 'spells' && childrenArray[5]}
          {activeTab === 'background' && childrenArray[6]}
        </div>

        {/* Form Actions */}
        <div className="card-actions justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            {editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );
}