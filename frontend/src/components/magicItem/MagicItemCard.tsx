import React from 'react';
import ReactMarkdown from 'react-markdown';
import { MagicItem, Character } from '../../../../shared/types';
import ImageUpload from '../ImageUpload';

interface MagicItemCardProps {
  item: MagicItem;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onUnassign: (characterId: number) => void;
  onImagesChanged: () => void;
  unassigningCharacterId?: number | null;
}

export const MagicItemCard: React.FC<MagicItemCardProps> = React.memo(({
  item,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
  onImagesChanged,
  unassigningCharacterId,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCollapse}
              className="btn btn-outline btn-primary btn-sm"
              aria-label={isCollapsed ? '+' : '-'}
            >
              {isCollapsed ? '+' : '−'}
            </button>
            <div>
              <h3 className="card-title text-2xl">{item.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-base-content/70">
                {item.rarity && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    {item.rarity}
                  </span>
                )}
                {item.type && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-info rounded-full"></div>
                    {item.type}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="card-actions">
            <button onClick={onEdit} className="btn btn-secondary btn-sm">
              Edit
            </button>
            <button onClick={onDelete} className="btn btn-neutral btn-sm">
              Delete
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="space-y-4 mt-6">
            {(item as any).images && (item as any).images.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-lg">🖼️</span>
                  Images ({(item as any).images.length})
                </h4>
                <ImageUpload
                  entityId={item.id!}
                  entityType="magic_items"
                  onImagesChanged={onImagesChanged}
                  showInForm={false}
                  previewOnly={true}
                />
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{item.description || ''}</ReactMarkdown>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-secondary">👥</span>
                Owners ({(item.owners || []).length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {(item.owners || []).map((owner: Character) => (
                  <div key={owner.id} className="badge badge-secondary gap-2 flex items-center">
                    <span className="font-medium">{owner.name}</span>
                    <button
                      onClick={() => onUnassign(owner.id!)}
                      className="btn btn-circle btn-xs btn-error ml-2"
                      disabled={unassigningCharacterId === owner.id}
                    >
                      x
                    </button>
                  </div>
                ))}
                <button onClick={onAssign} className="btn btn-success btn-sm">
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});