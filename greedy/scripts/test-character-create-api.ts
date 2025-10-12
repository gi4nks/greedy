#!/usr/bin/env tsx

import { createCharacter } from '../lib/actions/characters';

async function testCharacterCreation() {
  console.log('Testing character creation...');
  
  try {
    // Create a simple FormData object with minimum required fields
    const formData = new FormData();
    formData.append('campaignId', '1');
    formData.append('name', 'Test Character API');
    formData.append('race', 'Human');
    formData.append('class', 'Wizard');
    formData.append('level', '2');
    formData.append('characterType', 'pc');
    formData.append('strength', '14');
    formData.append('dexterity', '12');
    formData.append('constitution', '13');
    formData.append('intelligence', '16');
    formData.append('wisdom', '10');
    formData.append('charisma', '8');
    formData.append('hitPoints', '12');
    formData.append('maxHitPoints', '12');
    formData.append('armorClass', '12');
    formData.append('proficiencyBonus', '2');
    formData.append('savingThrows', '[]');
    formData.append('skills', '[]');
    formData.append('equipment', '[]');
    formData.append('weapons', '[]');
    formData.append('spells', '[]');
    formData.append('tags', '[]');
    formData.append('npcRelationships', '[]');
    formData.append('classes', '[{"name":"Wizard","level":2}]');
    formData.append('images', '[]');
    formData.append('description', 'A test character created via API');

    console.log('Calling createCharacter action...');
    const result = await createCharacter(formData);
    
    if (result && result.errors) {
      console.log('Validation errors:', result.errors);
    } else if (result && result.message) {
      console.log('Database error:', result.message);
    } else {
      console.log('Character creation successful! Result:', result);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCharacterCreation();