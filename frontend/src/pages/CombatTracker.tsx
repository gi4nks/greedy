import { useState, useEffect } from 'react';
import axios from 'axios';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  maxHp: number;
  currentHp: number;
  ac: number;
  type: 'character' | 'npc' | 'monster' | 'custom';
  sourceId?: number; // ID from characters/npcs table
  conditions: string[];
  notes: string;
}

interface StatusEffect {
  name: string;
  duration: number; // rounds remaining
  description: string;
}

export default function CombatTracker(): JSX.Element {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
  const [availableNpcs, setAvailableNpcs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const adv = useAdventures();

  // Status effects library
  const statusEffects: StatusEffect[] = [
    { name: 'Blinded', duration: 1, description: 'Cannot see, attacks have disadvantage, attacks against have advantage' },
    { name: 'Charmed', duration: 1, description: 'Cannot attack charmer, charmer has advantage on social checks' },
    { name: 'Deafened', duration: 1, description: 'Cannot hear, fails hearing-based checks' },
    { name: 'Frightened', duration: 1, description: 'Disadvantage on checks/attacks when source is near' },
    { name: 'Grappled', duration: 1, description: 'Speed becomes 0, ends if grappler incapacitated' },
    { name: 'Incapacitated', duration: 1, description: 'Cannot take actions or reactions' },
    { name: 'Invisible', duration: 1, description: 'Cannot be seen, attacks have advantage, attacks against have disadvantage' },
    { name: 'Paralyzed', duration: 1, description: 'Cannot move/speak/act, auto crit on attacks, attacks against have advantage' },
    { name: 'Petrified', duration: 1, description: 'Transformed to stone, incapacitated, no damage from poison, resistance to all damage' },
    { name: 'Poisoned', duration: 1, description: 'Disadvantage on attack rolls and ability checks' },
    { name: 'Prone', duration: 1, description: 'Can only crawl, melee attacks have advantage, ranged attacks have disadvantage' },
    { name: 'Restrained', duration: 1, description: 'Speed 0, attacks have advantage, attacks against have advantage' },
    { name: 'Stunned', duration: 1, description: 'Incapacitated, attacks against have advantage' },
    { name: 'Unconscious', duration: 1, description: 'Incapacitated, unaware, auto crit on attacks, attacks against have advantage' }
  ];

  useEffect(() => {
    loadAvailableCombatants();
  }, [adv.selectedId]);

  const loadAvailableCombatants = async () => {
    try {
      const [charactersRes, npcsRes] = await Promise.all([
        axios.get('/api/characters'),
        axios.get('/api/npcs')
      ]);
      setAvailableCharacters(charactersRes.data);
      setAvailableNpcs(npcsRes.data);
    } catch (error) {
      console.error('Failed to load combatants:', error);
    }
  };

  const addCombatant = (combatant: any, type: 'character' | 'npc') => {
    const newCombatant: Combatant = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: combatant.name,
      initiative: 0,
      maxHp: combatant.hitPoints || combatant.hit_points || 0,
      currentHp: combatant.hitPoints || combatant.hit_points || 0,
      ac: combatant.armorClass || combatant.armor_class || 10,
      type,
      sourceId: combatant.id,
      conditions: [],
      notes: ''
    };
    setCombatants(prev => [...prev, newCombatant]);
  };

  const addCustomCombatant = () => {
    const newCombatant: Combatant = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: 'New Combatant',
      initiative: 0,
      maxHp: 0,
      currentHp: 0,
      ac: 10,
      type: 'custom',
      conditions: [],
      notes: ''
    };
    setCombatants(prev => [...prev, newCombatant]);
  };

  const removeCombatant = (id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id));
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    setCombatants(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const rollInitiative = () => {
    setCombatants(prev => prev.map(combatant => ({
      ...combatant,
      initiative: Math.floor(Math.random() * 20) + 1 + Math.floor((combatant.ac - 10) / 2) // Rough DEX modifier estimate
    })).sort((a, b) => b.initiative - a.initiative));
  };

  const startCombat = () => {
    if (combatants.length === 0) return;
    setIsCombatActive(true);
    setCurrentTurn(0);
    setRoundNumber(1);
  };

  const endCombat = () => {
    setIsCombatActive(false);
    setCurrentTurn(0);
    setRoundNumber(1);
  };

  const nextTurn = () => {
    if (!isCombatActive) return;

    const nextTurnIndex = (currentTurn + 1) % combatants.length;
    setCurrentTurn(nextTurnIndex);

    if (nextTurnIndex === 0) {
      setRoundNumber(prev => prev + 1);
      // Decrease condition durations
      setCombatants(prev => prev.map(combatant => ({
        ...combatant,
        conditions: combatant.conditions.filter(condition => {
          const effect = statusEffects.find(e => e.name === condition);
          return effect ? effect.duration > 1 : true;
        })
      })));
    }
  };

  const previousTurn = () => {
    if (!isCombatActive) return;

    const prevTurnIndex = currentTurn === 0 ? combatants.length - 1 : currentTurn - 1;
    setCurrentTurn(prevTurnIndex);

    if (prevTurnIndex === combatants.length - 1) {
      setRoundNumber(prev => Math.max(1, prev - 1));
    }
  };

  const adjustHp = (id: string, amount: number) => {
    setCombatants(prev => prev.map(c =>
      c.id === id
        ? { ...c, currentHp: Math.max(0, Math.min(c.maxHp, c.currentHp + amount)) }
        : c
    ));
  };

  const addCondition = (combatantId: string, conditionName: string) => {
    const effect = statusEffects.find(e => e.name === conditionName);
    if (!effect) return;

    setCombatants(prev => prev.map(c =>
      c.id === combatantId && !c.conditions.includes(conditionName)
        ? { ...c, conditions: [...c.conditions, conditionName] }
        : c
    ));
  };

  const removeCondition = (combatantId: string, conditionName: string) => {
    setCombatants(prev => prev.map(c =>
      c.id === combatantId
        ? { ...c, conditions: c.conditions.filter(cond => cond !== conditionName) }
        : c
    ));
  };

  const clearCombat = () => {
    setCombatants([]);
    setCurrentTurn(0);
    setRoundNumber(1);
    setIsCombatActive(false);
  };

  const filteredCharacters = availableCharacters.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNpcs = availableNpcs.filter(n =>
    n.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHpColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 75) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    if (percentage >= 25) return 'text-warning';
    return 'text-error';
  };

  return (
    <Page title="Combat Tracker" toolbar={
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-success btn-sm"
        >
          Add Combatant
        </button>
        <button
          onClick={rollInitiative}
          disabled={combatants.length === 0}
          className="btn btn-primary btn-sm"
        >
          Roll Initiative
        </button>
        {!isCombatActive ? (
          <button
            onClick={startCombat}
            disabled={combatants.length === 0}
            className="btn btn-error btn-sm"
          >
            Start Combat
          </button>
        ) : (
          <button
            onClick={endCombat}
            className="btn btn-neutral btn-sm"
          >
            End Combat
          </button>
        )}
        <button
          onClick={clearCombat}
          className="btn btn-outline btn-sm"
        >
          Clear All
        </button>
      </div>
    }>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Combat Status */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl">⚔️ Combat Status</h3>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{roundNumber}</div>
                  <div className="text-sm text-base-content/70">Round</div>
                </div>

                {isCombatActive && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-base-content">
                      {combatants[currentTurn]?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-base-content/70">Current Turn</div>
                  </div>
                )}

                <div className="flex justify-center gap-2">
                  <button
                    onClick={previousTurn}
                    disabled={!isCombatActive}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextTurn}
                    disabled={!isCombatActive}
                    className="btn btn-primary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Combatants List */}
        <div className="lg:col-span-3">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl">👥 Combatants ({combatants.length})</h3>

              {combatants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚔️</div>
                  <p className="text-lg mb-4 text-base-content/70">No combatants added yet</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary btn-sm"
                  >
                    Add Combatant
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {combatants.map((combatant, index) => (
                    <div
                      key={combatant.id}
                      className={`card border-2 transition-all duration-200 ${
                        isCombatActive && index === currentTurn
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-base-300 bg-base-200'
                      }`}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {isCombatActive && index === currentTurn && (
                              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                            )}
                            <div>
                              <h4 className="card-title text-lg">{combatant.name}</h4>
                              <div className="text-sm text-base-content/70">
                                Initiative: {combatant.initiative} | AC: {combatant.ac}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeCombatant(combatant.id)}
                            className="btn btn-error btn-xs"
                          >
                            Remove
                          </button>
                        </div>

                        {/* HP Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">HP</span>
                            <span className={`text-sm font-bold ${getHpColor(combatant.currentHp, combatant.maxHp)}`}>
                              {combatant.currentHp}/{combatant.maxHp}
                            </span>
                          </div>
                          <progress
                            className="progress w-full"
                            value={(combatant.currentHp / combatant.maxHp) * 100}
                            max="100"
                          ></progress>
                        </div>

                        {/* HP Controls */}
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => adjustHp(combatant.id, -1)}
                            className="btn btn-error btn-xs"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => adjustHp(combatant.id, -5)}
                            className="btn btn-error btn-xs"
                          >
                            -5
                          </button>
                          <input
                            type="number"
                            placeholder="Amount"
                            className="input input-bordered input-sm flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const amount = parseInt((e.target as HTMLInputElement).value) || 0;
                                adjustHp(combatant.id, amount);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <button
                            onClick={() => adjustHp(combatant.id, 5)}
                            className="btn btn-success btn-xs"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => adjustHp(combatant.id, 1)}
                            className="btn btn-success btn-xs"
                          >
                            +1
                          </button>
                        </div>

                        {/* Conditions */}
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {combatant.conditions.map(condition => (
                              <div
                                key={condition}
                                className="badge badge-error gap-1"
                              >
                                {condition}
                                <button
                                  onClick={() => removeCondition(combatant.id, condition)}
                                  className="btn btn-xs btn-ghost"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                addCondition(combatant.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="select select-bordered select-sm w-full"
                            defaultValue=""
                          >
                            <option value="">Add Condition...</option>
                            {statusEffects.map(effect => (
                              <option key={effect.name} value={effect.name}>
                                {effect.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Notes */}
                        <textarea
                          value={combatant.notes}
                          onChange={(e) => updateCombatant(combatant.id, { notes: e.target.value })}
                          placeholder="Notes..."
                          className="textarea textarea-bordered textarea-sm w-full"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Combatant Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Add Combatants</h3>

            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-base-content mb-2">Search characters and NPCs...</label>
              <input
                type="text"
                placeholder="Search characters and NPCs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Characters */}
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
                              HP: {character.hitPoints || character.hit_points || 0} | AC: {character.armorClass || character.armor_class || 10}
                            </div>
                          </div>
                          <button
                            onClick={() => addCombatant(character, 'character')}
                            className="btn btn-success btn-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredCharacters.length === 0 && (
                    <div className="text-base-content/50 italic text-sm p-3">No characters found</div>
                  )}
                </div>
              </div>

              {/* NPCs */}
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
                            onClick={() => addCombatant(npc, 'npc')}
                            className="btn btn-secondary btn-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredNpcs.length === 0 && (
                    <div className="text-base-content/50 italic text-sm p-3">No NPCs found</div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Combatant */}
            <div className="divider"></div>
            <button
              onClick={addCustomCombatant}
              className="btn btn-primary btn-sm"
            >
              Add Custom Combatant
            </button>

            <div className="modal-action">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}