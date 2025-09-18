import React from 'react';

interface AbilityScore {
  name: string;
  value: number;
  onChange: (value: number) => void;
}

interface AbilityScoresProps {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  onStrengthChange: (value: number) => void;
  onDexterityChange: (value: number) => void;
  onConstitutionChange: (value: number) => void;
  onIntelligenceChange: (value: number) => void;
  onWisdomChange: (value: number) => void;
  onCharismaChange: (value: number) => void;
}

function AbilityScoreInput({ name, value, onChange }: AbilityScore): JSX.Element {
  const modifier = Math.floor((value - 10) / 2);

  return (
    <div className="text-center">
      <label className="block text-sm font-medium mb-1">{name}</label>
      <input
        type="number"
        min="1"
        max="30"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 10)}
        className="w-full p-2 border rounded text-center font-bold"
      />
      <div className="text-xs text-gray-600 mt-1">
        {modifier >= 0 ? '+' : ''}{modifier}
      </div>
    </div>
  );
}

export function AbilityScores({
  strength,
  dexterity,
  constitution,
  intelligence,
  wisdom,
  charisma,
  onStrengthChange,
  onDexterityChange,
  onConstitutionChange,
  onIntelligenceChange,
  onWisdomChange,
  onCharismaChange
}: AbilityScoresProps): JSX.Element {
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold mb-3">Ability Scores</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <AbilityScoreInput
          name="STR"
          value={strength}
          onChange={onStrengthChange}
        />
        <AbilityScoreInput
          name="DEX"
          value={dexterity}
          onChange={onDexterityChange}
        />
        <AbilityScoreInput
          name="CON"
          value={constitution}
          onChange={onConstitutionChange}
        />
        <AbilityScoreInput
          name="INT"
          value={intelligence}
          onChange={onIntelligenceChange}
        />
        <AbilityScoreInput
          name="WIS"
          value={wisdom}
          onChange={onWisdomChange}
        />
        <AbilityScoreInput
          name="CHA"
          value={charisma}
          onChange={onCharismaChange}
        />
      </div>
    </div>
  );
}