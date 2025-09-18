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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCollapse}
              className="w-8 h-8 flex items-center justify-center border-2 border-orange-200 rounded-full bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-colors duration-200"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <span className="text-lg font-bold text-orange-600">{isCollapsed ? '+' : '−'}</span>
            </button>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{character.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                {character.race && <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  {character.race}
                </span>}
                {character.background && <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  {character.background}
                </span>}
                {character.alignment && <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  {character.alignment}
                </span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <span>✏️</span>
              Edit
            </button>
            <button
              onClick={onDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
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
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Character Recap
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-1">Total Level</div>
                <div className="text-2xl font-bold text-orange-600">
                  {character.classes && character.classes.length > 0
                    ? (character.classes as any[]).reduce((sum, c) => sum + (c.level || 0), 0)
                    : (character.level || 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-1">Total XP</div>
                <div className="text-2xl font-bold text-green-600">
                  {character.experience !== undefined && character.experience !== null ? character.experience.toLocaleString() : '—'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-1">Hit Points</div>
                <div className="text-2xl font-bold text-red-600">
                  {character.hitPoints !== undefined ? `${character.hitPoints}/${character.maxHitPoints || character.hitPoints}` : '—'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-1">Armor Class</div>
                <div className="text-xl font-bold text-blue-600">
                  {character.armorClass !== undefined ? character.armorClass : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {character.description && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📖</span>
                Description
              </h4>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown children={character.description} />
                </div>
              </div>
            </div>
          )}

          {/* Adventure Link */}
          {character.adventure_id && adventureTitle && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
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