import React from 'react';
import { CharacterForm as CharacterFormType } from '@greedy/shared';

interface CharacterClassesTabProps {
  formData: CharacterFormType;
  onFormDataChange: (data: CharacterFormType) => void;
}

export function CharacterClassesTab({
  formData,
  onFormDataChange
}: CharacterClassesTabProps): JSX.Element {
  const handleAddClass = () => {
    const newClasses = [...(formData.classes || []), { className: '', level: 1, experience: 0 }];
    onFormDataChange({ ...formData, classes: newClasses });
  };

  const handleRemoveClass = (index: number) => {
    const newClasses = (formData.classes || []).filter((_, i) => i !== index);
    onFormDataChange({ ...formData, classes: newClasses });
  };

  const handleClassChange = (index: number, field: string, value: string | number) => {
    const newClasses = [...(formData.classes || [])];
    newClasses[index] = { ...newClasses[index], [field]: value };
    onFormDataChange({ ...formData, classes: newClasses });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-3">Classes</h4>
        <p className="text-sm text-base-content/70 mb-3">
          Add and manage your character's classes. Each class can have its own level and experience points.
        </p>
        {(formData.classes || []).map((classInfo, index) => (
          <div key={index} className="flex items-center gap-2 mb-2 p-3 bg-base-200 rounded border border-base-300">
            <div className="flex-1">
              <label htmlFor={`class-name-${index}`} className="sr-only">Class name</label>
              <input
                id={`class-name-${index}`}
                type="text"
                placeholder="Class name (e.g., Fighter, Wizard)"
                value={classInfo.className}
                onChange={(e) => handleClassChange(index, 'className', e.target.value)}
                className="input input-bordered flex-1"
                title="Enter the name of the class, e.g., Fighter, Wizard, Rogue"
              />
            </div>
            <div>
              <label htmlFor={`class-level-${index}`} className="sr-only">Level</label>
              <input
                id={`class-level-${index}`}
                type="number"
                min="1"
                max="20"
                placeholder="Level (1-20)"
                value={classInfo.level}
                onChange={(e) => handleClassChange(index, 'level', parseInt(e.target.value) || 1)}
                className="input input-bordered w-20"
                title="Enter the level for this class (1-20)"
              />
            </div>
            <div>
              <label htmlFor={`class-xp-${index}`} className="sr-only">XP</label>
              <input
                id={`class-xp-${index}`}
                type="number"
                min="0"
                placeholder="XP (experience points)"
                value={classInfo.experience ?? 0}
                onChange={(e) => handleClassChange(index, 'experience', parseInt(e.target.value) || 0)}
                className="input input-bordered w-28"
                title="Experience points earned specifically for this class"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveClass(index)}
              className="btn btn-error btn-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddClass}
          className="btn btn-success btn-sm"
        >
          Add Class
        </button>
      </div>
    </div>
  );
}