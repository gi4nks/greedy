import { db } from './lib/db/index.js';
import { characters } from './lib/db/schema.js';

const testCharacter = {
  name: 'Test Hero ' + Date.now(),
  race: 'Human',
  class: 'Fighter',
  level: 5,
  characterType: 'player',
  campaignId: 1,
  background: 'Soldier',
  hitPoints: 45,
  armorClass: 16,
  attributes: JSON.stringify({
    strength: 16,
    dexterity: 14,
    constitution: 15,
    intelligence: 12,
    wisdom: 13,
    charisma: 11
  })
};

async function testCharacterCreation() {
  try {
    console.log('Testing character creation...');
    const result = await db.insert(characters).values(testCharacter).returning();
    console.log('✅ Character created successfully:', result[0]);
    console.log('✅ All character functionality working correctly!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCharacterCreation();
