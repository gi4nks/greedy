import { useState, useEffect } from 'react';
import Page from '../components/Page';

interface DiceRoll {
  id: string;
  timestamp: Date;
  dice: string;
  result: number;
  individualRolls: number[];
  modifier: number;
  total: number;
  type: 'advantage' | 'disadvantage' | 'normal';
  label?: string;
  critical?: 'success' | 'failure' | null;
}

interface PresetRoll {
  name: string;
  dice: string;
  modifier: number;
  label: string;
}

export default function DiceRoller(): JSX.Element {
  const [currentRoll, setCurrentRoll] = useState('');
  const [modifier, setModifier] = useState(0);
  const [rollType, setRollType] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [rollHistory, setRollHistory] = useState<DiceRoll[]>([]);
  const [customLabel, setCustomLabel] = useState('');
  const [isRolling, setIsRolling] = useState(false);

  // Preset rolls for common D&D actions
  const presetRolls: PresetRoll[] = [
    { name: 'Attack Roll', dice: 'd20', modifier: 0, label: 'Attack Roll' },
    { name: 'Saving Throw', dice: 'd20', modifier: 0, label: 'Saving Throw' },
    { name: 'Ability Check', dice: 'd20', modifier: 0, label: 'Ability Check' },
    { name: 'Initiative', dice: 'd20', modifier: 0, label: 'Initiative' },
    { name: 'Spell Attack', dice: 'd20', modifier: 0, label: 'Spell Attack' },
    { name: 'Damage (1d6)', dice: 'd6', modifier: 0, label: 'Weapon Damage' },
    { name: 'Damage (1d8)', dice: 'd8', modifier: 0, label: 'Weapon Damage' },
    { name: 'Damage (2d6)', dice: '2d6', modifier: 0, label: 'Weapon Damage' },
    { name: 'Spell Damage', dice: 'd6', modifier: 0, label: 'Spell Damage' },
    { name: 'Hit Points', dice: 'd10', modifier: 0, label: 'Hit Die' },
  ];

  // Parse dice notation (e.g., "3d6", "d20", "2d8+3")
  const parseDiceNotation = (notation: string): { count: number; sides: number; modifier: number } => {
    const match = notation.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) throw new Error('Invalid dice notation');

    const count = parseInt(match[1] || '1');
    const sides = parseInt(match[2]);
    const modMatch = match[3];
    const modValue = modMatch ? parseInt(modMatch) : 0;

    return { count, sides, modifier: modValue };
  };

  // Roll a single die
  const rollDie = (sides: number): number => {
    return Math.floor(Math.random() * sides) + 1;
  };

  // Roll multiple dice with advantage/disadvantage
  const rollDice = (diceNotation: string, rollType: 'normal' | 'advantage' | 'disadvantage' = 'normal'): DiceRoll => {
    const { count, sides, modifier: diceModifier } = parseDiceNotation(diceNotation);
    const totalModifier = diceModifier + modifier;

    let individualRolls: number[] = [];
    let result: number;
    let critical: 'success' | 'failure' | null = null;

    if (rollType === 'advantage') {
      // Roll twice, take the higher
      const roll1 = rollDie(sides);
      const roll2 = rollDie(sides);
      individualRolls = [roll1, roll2];
      result = Math.max(roll1, roll2);
    } else if (rollType === 'disadvantage') {
      // Roll twice, take the lower
      const roll1 = rollDie(sides);
      const roll2 = rollDie(sides);
      individualRolls = [roll1, roll2];
      result = Math.min(roll1, roll2);
    } else {
      // Normal roll
      individualRolls = Array.from({ length: count }, () => rollDie(sides));
      result = individualRolls.reduce((sum, roll) => sum + roll, 0);
    }

    // Check for critical hits/failures (only for d20 rolls)
    if (sides === 20 && count === 1) {
      if (result === 20) critical = 'success';
      else if (result === 1) critical = 'failure';
    }

    const total = result + totalModifier;

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      dice: diceNotation,
      result,
      individualRolls,
      modifier: totalModifier,
      total,
      type: rollType,
      label: customLabel || `${rollType === 'normal' ? '' : rollType.charAt(0).toUpperCase() + rollType.slice(1) + ' '}Roll`,
      critical
    };
  };

  // Handle dice roll
  const handleRoll = async () => {
    if (!currentRoll.trim()) return;

    setIsRolling(true);

    // Add a small delay for visual feedback
    setTimeout(() => {
      try {
        const rollResult = rollDice(currentRoll, rollType);
        setRollHistory(prev => [rollResult, ...prev.slice(0, 49)]); // Keep last 50 rolls
        setCustomLabel('');
      } catch (error) {
        console.error('Invalid dice notation:', error);
        // Could add toast notification here
      } finally {
        setIsRolling(false);
      }
    }, 300);
  };

  // Quick roll buttons
  const quickRoll = (dice: string) => {
    setCurrentRoll(dice);
    setTimeout(() => handleRoll(), 100);
  };

  // Use preset roll
  const usePreset = (preset: PresetRoll) => {
    setCurrentRoll(preset.dice);
    setModifier(preset.modifier);
    setCustomLabel(preset.label);
    setTimeout(() => handleRoll(), 100);
  };

  // Clear history
  const clearHistory = () => {
    setRollHistory([]);
  };

  // Format roll for display
  const formatRoll = (roll: DiceRoll): string => {
    const modifierStr = roll.modifier !== 0 ? (roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier.toString()) : '';
    return `${roll.dice}${modifierStr}`;
  };

  return (
    <Page title="Dice Roller" toolbar={
      <div className="flex gap-2">
        <button
          onClick={clearHistory}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
        >
          Clear History
        </button>
      </div>
    }>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Roller */}
        <div className="lg:col-span-2 space-y-6">
          {/* Roll Input */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">🎲 Dice Roller</h3>

            <div className="space-y-4">
              {/* Dice Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Dice Notation</label>
                <input
                  type="text"
                  value={currentRoll}
                  onChange={(e) => setCurrentRoll(e.target.value)}
                  placeholder="e.g., d20, 3d6, 2d8+3"
                  className="w-full p-3 border rounded-lg text-lg font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleRoll()}
                />
              </div>

              {/* Modifier and Roll Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Modifier</label>
                  <input
                    type="number"
                    value={modifier}
                    onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Roll Type</label>
                  <select
                    value={rollType}
                    onChange={(e) => setRollType(e.target.value as typeof rollType)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="normal">Normal</option>
                    <option value="advantage">Advantage</option>
                    <option value="disadvantage">Disadvantage</option>
                  </select>
                </div>
              </div>

              {/* Custom Label */}
              <div>
                <label className="block text-sm font-medium mb-2">Label (Optional)</label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g., Strength Check, Fireball Damage"
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              {/* Roll Button */}
              <button
                onClick={handleRoll}
                disabled={!currentRoll.trim() || isRolling}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                  isRolling
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isRolling ? '🎲 Rolling...' : '🎲 Roll Dice'}
              </button>
            </div>
          </div>

          {/* Quick Roll Buttons */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">⚡ Quick Rolls</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', '2d6', '3d6', '4d6'].map(die => (
                <button
                  key={die}
                  onClick={() => quickRoll(die)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded font-medium transition-colors duration-200"
                >
                  {die}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Rolls */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">🎯 Preset Rolls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presetRolls.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => usePreset(preset)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 text-left"
                >
                  <div className="font-semibold">{preset.name}</div>
                  <div className="text-sm opacity-90">{preset.dice}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Roll History */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">📜 Roll History</h3>

            {rollHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🎲</div>
                <p>No rolls yet. Try rolling some dice!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rollHistory.map(roll => (
                  <div
                    key={roll.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      roll.critical === 'success'
                        ? 'bg-green-50 border-green-200'
                        : roll.critical === 'failure'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {roll.label || 'Roll'}
                        </div>
                        <div className="text-sm text-gray-600 font-mono">
                          {formatRoll(roll)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          roll.critical === 'success'
                            ? 'text-green-600'
                            : roll.critical === 'failure'
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}>
                          {roll.total}
                        </div>
                        <div className="text-xs text-gray-500">
                          {roll.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700">
                      {roll.type !== 'normal' && (
                        <span className={`font-medium ${
                          roll.type === 'advantage' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {roll.type.charAt(0).toUpperCase() + roll.type.slice(1)}:
                        </span>
                      )}
                      {roll.individualRolls.length > 1 ? (
                        <span className="font-mono ml-1">
                          [{roll.individualRolls.join(', ')}]
                          {roll.modifier !== 0 && (
                            <span className={roll.modifier > 0 ? 'text-green-600' : 'text-red-600'}>
                              {roll.modifier > 0 ? '+' : ''}{roll.modifier}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="font-mono ml-1">
                          {roll.result}
                          {roll.modifier !== 0 && (
                            <span className={roll.modifier > 0 ? 'text-green-600' : 'text-red-600'}>
                              {roll.modifier > 0 ? '+' : ''}{roll.modifier}
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {roll.critical && (
                      <div className={`text-xs font-bold mt-1 ${
                        roll.critical === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {roll.critical === 'success' ? '🎉 CRITICAL SUCCESS!' : '💀 CRITICAL FAILURE!'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}