import React, { useState } from 'react';
import { QuestObjective } from '@greedy/shared';

interface QuestObjectivesProps {
  objectives: QuestObjective[];
  onAddObjective: (description: string) => void;
  onUpdateObjective: (objectiveId: number, description: string, completed: boolean) => void;
  onDeleteObjective: (objectiveId: number) => void;
}

export const QuestObjectives: React.FC<QuestObjectivesProps> = ({
  objectives,
  onAddObjective,
  onUpdateObjective,
  onDeleteObjective,
}) => {
  const [newObjective, setNewObjective] = useState('');

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      onAddObjective(newObjective.trim());
      setNewObjective('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newObjective.trim()) {
      e.preventDefault();
      handleAddObjective();
    }
  };

  const toggleObjectiveCompletion = (objective: QuestObjective) => {
    if (objective.id) {
      onUpdateObjective(objective.id, objective.description, !objective.completed);
    }
  };

  return (
    <div>
      <h4 className="block text-sm font-medium text-base-content mb-2">Objectives</h4>
      <div className="space-y-2">
        {objectives.map((objective: QuestObjective) => (
          <div key={objective.id} className="flex items-center gap-2 p-2 bg-base-200 rounded-box">
            <input
              type="checkbox"
              checked={objective.completed}
              onChange={() => toggleObjectiveCompletion(objective)}
              className="checkbox checkbox-primary"
            />
            <span className={`flex-1 text-sm ${objective.completed ? 'line-through text-base-content/60' : 'text-base-content'}`}>
              {objective.description}
            </span>
            <button
              onClick={() => { if (objective.id) onDeleteObjective(objective.id); }}
              className="btn btn-neutral btn-xs"
            >
              Delete
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add new objective..."
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            className="input input-bordered input-sm flex-1"
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={() => handleAddObjective()}
            disabled={!newObjective.trim()}
            className="btn btn-success btn-sm"
          >
            Create
          </button>
        </div>
      </div>
      <div className="text-xs text-base-content/70 mt-1">
        Manage quest objectives. Check to mark as completed, or add new ones.
      </div>
    </div>
  );
};