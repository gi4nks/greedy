import React from 'react';
import { MagicItem } from '../../../../shared/types';
import { MagicItemCard } from './MagicItemCard';

interface MagicItemListProps {
  items: MagicItem[];
  collapsed: { [id: number]: boolean };
  onToggleCollapse: (id?: number) => void;
  onEdit: (item: MagicItem & { id: number }) => void;
  onDelete: (id?: number) => void;
  onAssign: (itemId: number) => void;
  onUnassign: (itemId: number, characterId: number) => void;
  onImagesChanged: () => void;
  unassigningCharacterId?: number | null;
}

export const MagicItemList: React.FC<MagicItemListProps> = ({
  items,
  collapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
  onImagesChanged,
  unassigningCharacterId,
}) => {
  return (
    <div className="space-y-6">
      {items.map(item => {
        const isCollapsed = item.id ? collapsed[item.id] ?? true : false;
        return (
          <MagicItemCard
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => onToggleCollapse(item.id)}
            onEdit={() => onEdit(item as MagicItem & { id: number })}
            onDelete={() => onDelete(item.id)}
            onAssign={() => onAssign(item.id!)}
            onUnassign={(characterId) => onUnassign(item.id!, characterId)}
            onImagesChanged={onImagesChanged}
            unassigningCharacterId={unassigningCharacterId}
          />
        );
      })}
    </div>
  );
};