import React from 'react';
import { Quest } from '@greedy/shared';

interface QuestCardProps {
  quest: Quest;
  onEdit: (quest: Quest) => void;
  onDelete: (id: number) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">

            {/* Quest Images Display Only */}
            {(quest as any).images && Array.isArray((quest as any).images) && (quest as any).images.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-lg">🖼️</span>
                  Images ({(quest as any).images.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(quest as any).images.map((image: any, index: number) => (
                    <div key={image.id || index} className="aspect-square rounded-lg overflow-hidden bg-base-200">
                      <img 
                        src={`/api/images/quests/${image.image_path?.split('/').pop() || 'placeholder.jpg'}`} 
                        alt={`Quest image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="card-title text-xl">{quest.title}</h3>
            <p className="text-base-content/70 mb-3">{quest.description}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              <div className={`badge ${
                quest.status === 'active' ? 'badge-success' :
                quest.status === 'completed' ? 'badge-info' :
                quest.status === 'cancelled' ? 'badge-error' :
                'badge-warning'
              }`}>
                {quest.status}
              </div>
              <div className={`badge ${
                quest.priority === 'critical' ? 'badge-error' :
                quest.priority === 'high' ? 'badge-warning' :
                quest.priority === 'medium' ? 'badge-info' :
                'badge-success'
              }`}>
                {quest.priority}
              </div>
              <div className="badge badge-secondary">
                {quest.type}
              </div>
            </div>

            {quest.assigned_to && (
              <p className="text-sm text-base-content/60 mb-2">Assigned to: {quest.assigned_to}</p>
            )}

            {quest.due_date && (
              <p className="text-sm text-base-content/60">Due: {new Date(quest.due_date).toLocaleDateString()}</p>
            )}

            {/* Tags */}
            {quest.tags && quest.tags.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {quest.tags.map(tag => (
                    <span key={tag} className="badge badge-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note: Objectives are managed in edit mode */}
            <div className="mt-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-base-content">
                  Objectives: Edit quest to manage objectives
                </span>
              </div>
            </div>

            {/* Add New Objective - moved to edit mode */}
            <div className="mt-4">
              <p className="text-sm text-base-content/60">Edit quest to add/manage objectives</p>
            </div>
          </div>

          <div className="card-actions">
            <button
              onClick={() => onEdit(quest)}
              className="btn btn-secondary btn-sm"
            >
              Edit
            </button>
            <button
              onClick={() => { if (quest.id) onDelete(quest.id); }}
              className="btn btn-neutral btn-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};