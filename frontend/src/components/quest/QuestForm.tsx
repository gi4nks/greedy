import React, { useEffect } from 'react';
import { Quest, QuestForm as QuestFormType, Character } from '@greedy/shared';
import { QuestTags } from './QuestTags';
import { QuestObjectives } from './QuestObjectives';

interface QuestFormProps {
  formData: QuestFormType;
  editingId: number | null;
  editingQuest?: Quest & { objectives: any[] };
  adventures: Array<{ id?: number; title: string }>;
  characters: Character[];
  onFormDataChange: (data: QuestFormType) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onAddObjective: (description: string) => void;
  onUpdateObjective: (objectiveId: number, description: string, completed: boolean) => void;
  onDeleteObjective: (objectiveId: number) => void;
}

export const QuestForm: React.FC<QuestFormProps> = ({
  formData,
  editingId,
  editingQuest,
  adventures,
  characters,
  onFormDataChange,
  onSubmit,
  onCancel,
  onAddObjective,
  onUpdateObjective,
  onDeleteObjective,
}) => {
  const handleAddTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      onFormDataChange({ ...formData, tags: [...(formData.tags || []), tag] });
    }
  };

  const handleRemoveTag = (tag: string) => {
    onFormDataChange({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) });
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h3 className="card-title text-xl justify-center">
          {editingId ? 'Edit Quest' : 'Create New Quest'}
        </h3>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="quest-title" className="block text-sm font-medium text-base-content mb-2">Title *</label>
            <input
              id="quest-title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              className="input input-bordered w-full"
              placeholder="Enter quest title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="quest-description" className="block text-sm font-medium text-base-content mb-2">Description *</label>
            <textarea
              id="quest-description"
              required
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              rows={4}
              className="textarea textarea-bordered w-full"
              placeholder="Describe the quest"
            />
          </div>

          {/* Adventure Selection - Moved to top for context setting */}
          <div>
            <label htmlFor="quest-adventure" className="block text-sm font-medium text-base-content mb-2">Adventure *</label>
            <select
              id="quest-adventure"
              value={formData.adventure_id || ''}
              onChange={(e) => onFormDataChange({ ...formData, adventure_id: e.target.value ? parseInt(e.target.value) : null })}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select Adventure</option>
              {adventures.map(adventure => (
                <option key={adventure.id} value={adventure.id}>
                  {adventure.title}
                </option>
              ))}
            </select>
            <div className="text-xs text-base-content/70 mt-1">Select the adventure this quest belongs to</div>
          </div>

          {/* Assigned To - Now filtered by selected adventure */}
          <div>
            <label htmlFor="quest-assigned-to" className="block text-sm font-medium text-base-content mb-2">Assigned To</label>
            <select
              id="quest-assigned-to"
              value={formData.assigned_to || ''}
              onChange={(e) => onFormDataChange({ ...formData, assigned_to: e.target.value })}
              className="select select-bordered w-full"
              disabled={!formData.adventure_id}
            >
              <option value="">
                {formData.adventure_id ? 'Select Character/NPC' : 'Select an adventure first'}
              </option>
              {characters
                .filter(char => char.adventure_id === formData.adventure_id)
                .map(char => (
                  <option key={char.id} value={char.name}>
                    {char.name} {char.role ? `(${char.role})` : '(Character)'}
                  </option>
                ))}
            </select>
            <div className="text-xs text-base-content/70 mt-1">
              {formData.adventure_id
                ? `Showing characters from selected adventure (${characters.filter(char => char.adventure_id === formData.adventure_id).length} available)`
                : 'Select an adventure above to see available characters'
              }
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quest-status" className="block text-sm font-medium text-base-content mb-2">Status</label>
              <select
                id="quest-status"
                value={formData.status}
                onChange={(e) => onFormDataChange({ ...formData, status: e.target.value as Quest['status'] })}
                className="select select-bordered w-full"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div>
              <label htmlFor="quest-priority" className="block text-sm font-medium text-base-content mb-2">Priority</label>
              <select
                id="quest-priority"
                value={formData.priority}
                onChange={(e) => onFormDataChange({ ...formData, priority: e.target.value as Quest['priority'] })}
                className="select select-bordered w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="quest-type" className="block text-sm font-medium text-base-content mb-2">Type</label>
              <select
                id="quest-type"
                value={formData.type}
                onChange={(e) => onFormDataChange({ ...formData, type: e.target.value as Quest['type'] })}
                className="select select-bordered w-full"
              >
                <option value="main">Main Quest</option>
                <option value="side">Side Quest</option>
                <option value="personal">Personal</option>
                <option value="guild">Guild</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="quest-due-date" className="block text-sm font-medium text-base-content mb-2">Due Date</label>
            <input
              id="quest-due-date"
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => onFormDataChange({ ...formData, due_date: e.target.value })}
              className="input input-bordered w-full"
            />
          </div>

          {/* Tags */}
          <QuestTags
            tags={formData.tags || []}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />



          {/* Objectives Management */}
          {editingId && editingQuest && (
            <QuestObjectives
              objectives={editingQuest.objectives || []}
              onAddObjective={onAddObjective}
              onUpdateObjective={onUpdateObjective}
              onDeleteObjective={onDeleteObjective}
            />
          )}
        </div>

        {/* Form Actions */}
        <div className="card-actions justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
          >
            {editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );
};