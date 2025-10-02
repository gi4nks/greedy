import React from 'react';
import { Quest, SearchResult } from '@greedy/shared';
import { QuestCard } from './QuestCard';

interface QuestListProps {
  quests: Quest[];
  searchTerm: string;
  searchResults?: SearchResult;
  searchError?: boolean;
  onEdit: (quest: Quest) => void;
  onDelete: (id: number) => void;
}

export const QuestList: React.FC<QuestListProps> = ({
  quests,
  searchTerm,
  searchResults,
  searchError,
  onEdit,
  onDelete,
}) => {
  const displayQuests = (searchTerm && !searchError && searchResults) ? searchResults.quests : quests;

  return (
    <div className="grid gap-4">
      {displayQuests.map((quest: Quest) => (
        <QuestCard
          key={quest.id}
          quest={quest}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {(quests.length === 0 && !searchTerm) && (
        <div className="text-center py-12">
          <p className="text-base-content/60 text-lg">No quests found. Create your first quest to get started!</p>
        </div>
      )}
    </div>
  );
};