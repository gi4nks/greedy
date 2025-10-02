import React from 'react';

interface Character {
  id?: number;
  name: string;
  hitPoints?: number;
  armorClass?: number;
}

interface NPC {
  id?: number;
  name: string;
  role?: string;
}

interface AddParticipantModalProps {
  isOpen: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  characters: Character[];
  npcs: NPC[];
  onAddParticipant: (characterId: number, isNpc: boolean) => void;
  onClose: () => void;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  isOpen,
  searchTerm,
  onSearchChange,
  characters,
  npcs,
  onAddParticipant,
  onClose,
}) => {
  if (!isOpen) return null;

  const filteredCharacters = characters.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNpcs = npcs.filter(n =>
    n.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[80vh] overflow-y-auto">
        <h3 className="font-bold text-lg">Add Combat Participants</h3>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search characters and NPCs..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-success">🧙 Characters</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredCharacters.map(character => (
                <div key={character.id} className="card card-compact bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{character.name}</div>
                        <div className="text-sm text-base-content/70">
                          HP: {character.hitPoints || 0} | AC: {character.armorClass || 10}
                        </div>
                      </div>
                      <button
                        onClick={() => character.id && onAddParticipant(character.id, false)}
                        className="btn btn-success btn-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-secondary">👤 NPCs</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredNpcs.map(npc => (
                <div key={npc.id} className="card card-compact bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{npc.name}</div>
                        <div className="text-sm text-base-content/70">
                          {npc.role || 'NPC'}
                        </div>
                      </div>
                      <button
                        onClick={() => npc.id && onAddParticipant(npc.id, true)}
                        className="btn btn-secondary btn-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};