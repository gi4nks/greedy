import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Character } from '@greedy/shared';

interface CharacterCardProps {
  character: Character & { id: number };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  adventureTitle?: string;
}

export function CharacterCard({
  character,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  adventureTitle
}: CharacterCardProps): JSX.Element {
  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      <div className="card-body border-b border-base-300">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCollapse}
              className="btn btn-circle btn-outline btn-primary btn-sm"
              aria-label={isCollapsed ? '+' : '-'}
            >
              {isCollapsed ? '+' : '−'}
            </button>
            <div>
              <h3 className="card-title text-2xl">{character.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-base-content/70">
                {character.race && <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-info rounded-full"></span>
                  {character.race}
                </span>}
                {character.background && <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  {character.background}
                </span>}
                {character.alignment && <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  {character.alignment}
                </span>}
              </div>
            </div>
          </div>
          <div className="card-actions">
            <button
              onClick={onEdit}
              className="btn btn-secondary btn-sm"
            >
              <span>✏️</span>
              Edit
            </button>
            <button
              onClick={onDelete}
              className="btn btn-neutral btn-sm"
            >
              <span>🗑️</span>
              Delete
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-6 space-y-6">
          {/* Character Recap */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-box p-6 border border-primary/20">
            <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Character Recap
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                <div className="text-sm font-medium text-base-content/70 mb-1">Total Level</div>
                <div className="text-2xl font-bold text-primary">
                  {character.classes && character.classes.length > 0
                    ? (character.classes as any[]).reduce((sum, c) => sum + (c.level || 0), 0)
                    : (character.level || 0)}
                </div>
              </div>
              <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                <div className="text-sm font-medium text-base-content/70 mb-1">Total XP</div>
                <div className="text-2xl font-bold text-primary">
                  {character.experience !== undefined && character.experience !== null ? character.experience.toLocaleString() : '—'}
                </div>
              </div>
              <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                <div className="text-sm font-medium text-base-content/70 mb-1">Hit Points</div>
                <div className="text-2xl font-bold text-primary">
                  {character.hitPoints !== undefined ? `${character.hitPoints}/${character.maxHitPoints || character.hitPoints}` : '—'}
                </div>
              </div>
              <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                <div className="text-sm font-medium text-base-content/70 mb-1">Armor Class</div>
                <div className="text-xl font-bold text-primary">
                  {character.armorClass !== undefined ? character.armorClass : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {character.description && (
            <div className="bg-base-200 rounded-box p-6">
              <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                <span className="text-2xl">📖</span>
                Description
              </h4>
              <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown children={character.description} />
                </div>
              </div>
            </div>
          )}

          {/* Adventure Link */}
          {character.adventure_id && adventureTitle && (
            <div className="bg-info/10 rounded-box p-4 border border-info/20">
              <div className="flex items-center gap-2 text-info">
                <span className="text-lg">🗺️</span>
                <span className="font-medium">Adventure:</span>
                <span>{adventureTitle}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}