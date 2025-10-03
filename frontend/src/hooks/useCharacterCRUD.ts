import { useCRUD } from './useCRUD';
import { useCharacters, useCharacter, useCreateCharacter, useUpdateCharacter, useDeleteCharacter } from './useCharacters';
import { Character, CharacterForm } from '@greedy/shared';

// Character-specific CRUD hook
export function useCharacterCRUD(adventureId?: number) {
  const listQuery = useCharacters(adventureId);
  // Item query must be a hook so rules-of-hooks allow calling other hooks inside it
  const useItemQuery = (id: number) => useCharacter(id);
  const createMutation = useCreateCharacter();
  const updateMutation = useUpdateCharacter();
  const deleteMutation = useDeleteCharacter();

  // Default form data for characters
  const initialFormData: CharacterForm = {
    name: '',
    race: '',
    classes: [],
    class: '',
    level: 1,
    background: '',
    alignment: '',
    experience: 0,
    adventure_id: adventureId,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hitPoints: 0,
    maxHitPoints: 0,
    armorClass: 10,
    initiative: 0,
    speed: 30,
    proficiencyBonus: 2,
    savingThrows: {
      strength: false,
      dexterity: false,
      constitution: false,
      intelligence: false,
      wisdom: false,
      charisma: false,
    },
    skills: {
      acrobatics: false,
      animalHandling: false,
      arcana: false,
      athletics: false,
      deception: false,
      history: false,
      insight: false,
      intimidation: false,
      investigation: false,
      medicine: false,
      nature: false,
      perception: false,
      performance: false,
      persuasion: false,
      religion: false,
      sleightOfHand: false,
      stealth: false,
      survival: false,
    },
    equipment: [],
    weapons: [],
    spells: [],
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    role: '',
    description: '',
    tags: [],
    images: []
  };

  // Thin adapter: delegate to generic useCRUD and expose the same shape
  return useCRUD<Character>('character', {
    createMutation,
    updateMutation,
    deleteMutation,
    listQuery,
    itemQuery: useItemQuery,
    initialFormData,
  });
}