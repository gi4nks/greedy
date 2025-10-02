import React from 'react';
import { CharacterForm as CharacterFormType } from '@greedy/shared';
import { AbilityScores } from '../forms/AbilityScores';

interface CharacterAbilitiesTabProps {
  formData: CharacterFormType;
  onFormDataChange: (data: CharacterFormType) => void;
}

export function CharacterAbilitiesTab({
  formData,
  onFormDataChange
}: CharacterAbilitiesTabProps): JSX.Element {
  return (
    <div className="space-y-6">
      <AbilityScores
        strength={formData.strength || 10}
        dexterity={formData.dexterity || 10}
        constitution={formData.constitution || 10}
        intelligence={formData.intelligence || 10}
        wisdom={formData.wisdom || 10}
        charisma={formData.charisma || 10}
        onStrengthChange={(value) => onFormDataChange({ ...formData, strength: value })}
        onDexterityChange={(value) => onFormDataChange({ ...formData, dexterity: value })}
        onConstitutionChange={(value) => onFormDataChange({ ...formData, constitution: value })}
        onIntelligenceChange={(value) => onFormDataChange({ ...formData, intelligence: value })}
        onWisdomChange={(value) => onFormDataChange({ ...formData, wisdom: value })}
        onCharismaChange={(value) => onFormDataChange({ ...formData, charisma: value })}
      />
    </div>
  );
}