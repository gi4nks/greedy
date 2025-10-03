import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Character } from '@greedy/shared';

interface CharacterCardProps {
  character: Character & { id?: number };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  adventureTitle?: string;
}

export const CharacterCard = React.memo(function CharacterCard({
  character,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  adventureTitle
}: CharacterCardProps): JSX.Element {
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
              <h3 className="card-title text-xl">{character.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-base-content/70">
                {character.race && <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  {character.race}
                </span>}
                {character.background && <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  {character.background}
                </span>}
                {character.alignment && <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
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
              Edit
            </button>
            <button
              onClick={onDelete}
              className="btn btn-neutral btn-sm"
            >
              Delete
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="space-y-6 mt-6">

            {/* Character Images Display Only */}
            {(character as any).images && Array.isArray((character as any).images) && (character as any).images.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-lg">🖼️</span>
                  Images ({(character as any).images.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(character as any).images.map((image: any, index: number) => (
                    <div key={image.id || index} className="aspect-square rounded-lg overflow-hidden bg-base-200">
                      <img 
                        src={`/api/images/characters/${image.image_path?.split('/').pop() || 'placeholder.jpg'}`} 
                        alt={`Character image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Recap Panel */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
              <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Character Recap
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                  <div className="text-sm font-medium text-base-content/70 mb-1">Total Level</div>
                  <div className="text-2xl font-bold text-primary">
                    {character.classes && character.classes.length > 0
                      ? (character.classes).reduce((sum, c) => sum + (c.level || 0), 0)
                      : (character.level || 0)}
                  </div>
                </div>
                <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                  <div className="text-sm font-medium text-base-content/70 mb-1">Total XP</div>
                  <div className="text-2xl font-bold text-success">
                    {character.experience !== undefined && character.experience !== null ? character.experience.toLocaleString() : '—'}
                  </div>
                </div>
                <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                  <div className="text-sm font-medium text-base-content/70 mb-1">Hit Points</div>
                  <div className="text-2xl font-bold text-error">
                    {character.hitPoints !== undefined ? `${character.hitPoints}/${character.maxHitPoints || character.hitPoints}` : '—'}
                  </div>
                </div>
                <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                  <div className="text-sm font-medium text-base-content/70 mb-1">Armor Class</div>
                  <div className="text-xl font-bold text-info">
                    {character.armorClass !== undefined ? character.armorClass : '—'}
                  </div>
                </div>
              </div>
              <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                <div className="text-sm font-medium text-base-content/70 mb-2">Class Breakdown</div>
                {character.classes && character.classes.length > 0 ? (
                  <div className="space-y-2">
                    {(character.classes).map((c, idx) => {
                      const classExp = c.experience ?? null;
                      return (
                        <div key={idx} className="flex items-center justify-between bg-base-200 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-primary rounded-full"></span>
                            <span className="font-semibold text-base-content">{c.className || 'Unknown'}</span>
                            <span className="text-sm text-base-content/70">Level {c.level || 0}</span>
                          </div>
                          {classExp && (
                            <span className="text-sm font-medium text-success bg-success/10 px-2 py-1 rounded">
                              {classExp.toLocaleString()} XP
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-base-content/50 italic">
                    {character.class ? `${character.class} — Level ${character.level || 0}` : 'No class information'}
                  </div>
                )}
              </div>
            </div>

            {/* Ability Scores Section */}
            {(character.strength || character.dexterity || character.constitution || character.intelligence || character.wisdom || character.charisma) && (
              <div className="bg-base-200 rounded-box p-6">
                <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                  <span className="text-2xl">💪</span>
                  Ability Scores
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { name: 'STR', value: character.strength, color: 'text-primary' },
                    { name: 'DEX', value: character.dexterity, color: 'text-primary' },
                    { name: 'CON', value: character.constitution, color: 'text-primary' },
                    { name: 'INT', value: character.intelligence, color: 'text-primary' },
                    { name: 'WIS', value: character.wisdom, color: 'text-primary' },
                    { name: 'CHA', value: character.charisma, color: 'text-primary' }
                  ].map(({ name, value, color }) => value && (
                    <div key={name} className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300 text-center">
                      <div className="text-sm font-medium text-base-content/70 mb-2">{name}</div>
                      <div className="text-2xl font-bold text-base-content mb-1">{value}</div>
                      <div className={`text-sm font-medium ${color}`}>
                        +{Math.floor((value - 10) / 2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Combat Stats Section */}
            {(character.hitPoints !== undefined || character.armorClass !== undefined || character.speed !== undefined || character.proficiencyBonus !== undefined) && (
              <div className="bg-base-200 rounded-box p-6">
                <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                  <span className="text-2xl">⚔️</span>
                  Combat Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {character.hitPoints !== undefined && (
                    <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                      <div className="text-sm font-medium text-base-content/70 mb-1">Hit Points</div>
                      <div className="text-xl font-bold text-primary">{character.hitPoints}/{character.maxHitPoints || character.hitPoints}</div>
                    </div>
                  )}
                  {character.armorClass !== undefined && (
                    <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                      <div className="text-sm font-medium text-base-content/70 mb-1">Armor Class</div>
                      <div className="text-xl font-bold text-primary">{character.armorClass}</div>
                    </div>
                  )}
                  {character.speed !== undefined && (
                    <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                      <div className="text-sm font-medium text-base-content/70 mb-1">Speed</div>
                      <div className="text-xl font-bold text-primary">{character.speed} ft.</div>
                    </div>
                  )}
                  {character.proficiencyBonus !== undefined && (
                    <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                      <div className="text-sm font-medium text-base-content/70 mb-1">Proficiency</div>
                      <div className="text-xl font-bold text-primary">+{character.proficiencyBonus}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Spells Section */}
            {character.spells && character.spells.length > 0 && (
              <div className="bg-base-200 rounded-box p-6">
                <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔮</span>
                  Spells ({character.spells.length})
                </h4>
                <div className="space-y-3">
                  {character.spells.slice(0, 8).map((spell, idx) => (
                    <div key={idx} className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`badge badge-sm ${
                            spell.level === 0
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}>
                            {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                          </span>
                          <span className="font-semibold text-base-content">{spell.name}</span>
                        </div>
                        {spell.prepared && (
                          <span className="badge badge-success badge-sm">
                            Prepared
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {character.spells.length > 8 && (
                    <div className="text-center text-base-content/60 text-sm">
                      ...and {character.spells.length - 8} more spells
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description Section */}
            {character.description && (
              <div className="bg-base-200 rounded-box p-6">
                <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  Description
                </h4>
                <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{character.description}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Background Section */}
            {(character.personalityTraits || character.ideals || character.bonds || character.flaws || character.backstory) && (
              <div className="bg-base-200 rounded-box p-6">
                <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎭</span>
                  Background & Personality
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {character.personalityTraits && (
                    <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                      <div className="text-sm font-medium text-base-content/70 mb-2">Personality Traits</div>
                      <p className="text-sm text-base-content">{character.personalityTraits}</p>
                    </div>
                  )}
                  {character.ideals && (
                    <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                      <div className="text-sm font-medium text-base-content/70 mb-2">Ideals</div>
                      <p className="text-sm text-base-content">{character.ideals}</p>
                    </div>
                  )}
                  {character.bonds && (
                    <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                      <div className="text-sm font-medium text-base-content/70 mb-2">Bonds</div>
                      <p className="text-sm text-base-content">{character.bonds}</p>
                    </div>
                  )}
                  {character.flaws && (
                    <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                      <div className="text-sm font-medium text-base-content/70 mb-2">Flaws</div>
                      <p className="text-sm text-base-content">{character.flaws}</p>
                    </div>
                  )}
                </div>
                {character.backstory && (
                  <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300 mt-4">
                    <div className="text-sm font-medium text-base-content/70 mb-2">Backstory</div>
                    <p className="text-sm text-base-content">{character.backstory}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tags Section */}
            {character.tags && character.tags.length > 0 && (
              <div className="bg-base-200 rounded-box p-6">
                <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏷️</span>
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(character.tags).map(tag => (
                    <span key={tag} className="badge badge-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Adventure Link */}
            {character.adventure_id && adventureTitle && (
              <div className="bg-primary/10 rounded-box p-4 border border-primary/20">
                <div className="flex items-center gap-2 text-primary">
                  <span className="text-lg">🗺️</span>
                  <span className="font-medium">Adventure:</span>
                  <span>{adventureTitle}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});