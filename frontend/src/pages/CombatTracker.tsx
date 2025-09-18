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
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHpBarColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Page title="Combat Tracker" toolbar={
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
        >
          Add Combatant
        </button>
        <button
          onClick={rollInitiative}
          disabled={combatants.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          🎲 Roll Initiative
        </button>
        {!isCombatActive ? (
          <button
            onClick={startCombat}
            disabled={combatants.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            ⚔️ Start Combat
          </button>
        ) : (
          <button
            onClick={endCombat}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
          >
            🛑 End Combat
          </button>
        )}
        <button
          onClick={clearCombat}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
        >
          Clear All
        </button>
      </div>
    }>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Combat Status */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">⚔️ Combat Status</h3>

            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{roundNumber}</div>
                <div className="text-sm text-gray-600">Round</div>
              </div>

              {isCombatActive && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {combatants[currentTurn]?.name || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-600">Current Turn</div>
                </div>
              )}

              <div className="flex justify-center gap-2">
                <button
                  onClick={previousTurn}
                  disabled={!isCombatActive}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  ⬅️ Previous
                </button>
                <button
                  onClick={nextTurn}
                  disabled={!isCombatActive}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  Next ➡️
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Combatants List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">👥 Combatants ({combatants.length})</h3>

            {combatants.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">⚔️</div>
                <p className="text-lg mb-4">No combatants added yet</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Add Your First Combatant
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {combatants.map((combatant, index) => (
                  <div
                    key={combatant.id}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isCombatActive && index === currentTurn
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {isCombatActive && index === currentTurn && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{combatant.name}</h4>
                          <div className="text-sm text-gray-600">
                            Initiative: {combatant.initiative} | AC: {combatant.ac}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCombatant(combatant.id)}
                        className="text-red-500 hover:text-red-700 text-xl"
                      >
                        ×
                      </button>
                    </div>

                    {/* HP Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">HP</span>
                        <span className={`text-sm font-bold ${getHpColor(combatant.currentHp, combatant.maxHp)}`}>
                          {combatant.currentHp}/{combatant.maxHp}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${getHpBarColor(combatant.currentHp, combatant.maxHp)}`}
                          style={{ width: `${(combatant.currentHp / combatant.maxHp) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* HP Controls */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => adjustHp(combatant.id, -1)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => adjustHp(combatant.id, -5)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                      >
                        -5
                      </button>
                      <input
                        type="number"
                        placeholder="Amount"
                        className="flex-1 px-2 py-1 border rounded text-sm"
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
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => adjustHp(combatant.id, 1)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
                      >
                        +1
                      </button>
                    </div>

                    {/* Conditions */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {combatant.conditions.map(condition => (
                          <span
                            key={condition}
                            className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                          >
                            {condition}
                            <button
                              onClick={() => removeCondition(combatant.id, condition)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addCondition(combatant.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
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
                      className="w-full px-2 py-1 border rounded text-sm"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Combatant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-4xl p-6 rounded shadow-lg border max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Combatants</h3>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search characters and NPCs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Characters */}
              <div>
                <h4 className="font-semibold mb-3 text-green-700">🧙 Characters</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredCharacters.map(character => (
                    <div key={character.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{character.name}</div>
                        <div className="text-sm text-gray-600">
                          HP: {character.hitPoints || character.hit_points || 0} | AC: {character.armorClass || character.armor_class || 10}
                        </div>
                      </div>
                      <button
                        onClick={() => addCombatant(character, 'character')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                  {filteredCharacters.length === 0 && (
                    <div className="text-gray-500 italic text-sm p-3">No characters found</div>
                  )}
                </div>
              </div>

              {/* NPCs */}
              <div>
                <h4 className="font-semibold mb-3 text-purple-700">👤 NPCs</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredNpcs.map(npc => (
                    <div key={npc.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{npc.name}</div>
                        <div className="text-sm text-gray-600">
                          {npc.role || 'NPC'}
                        </div>
                      </div>
                      <button
                        onClick={() => addCombatant(npc, 'npc')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                  {filteredNpcs.length === 0 && (
                    <div className="text-gray-500 italic text-sm p-3">No NPCs found</div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Combatant */}
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={addCustomCombatant}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                + Add Custom Combatant
              </button>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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