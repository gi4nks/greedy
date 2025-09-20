// Shared types between frontend and backend
export interface Adventure {
  id?: number;
  slug?: string;
  title: string;
  description?: string;
}

export interface CharacterClass {
  className: string;
  level: number;
  experience?: number;
}

export interface CharacterSpell {
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  name: string;
  prepared: boolean;
}

export interface Character {
  id?: number;
  adventure_id?: number | null;
  name: string;
  race?: string;
  class?: string;
  level: number;
  background?: string;
  alignment?: string;
  experience: number;

  // Ability Scores
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  // Combat Stats
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;

  // Complex objects stored as JSON
  savingThrows?: Record<string, boolean>;
  skills?: Record<string, boolean>;
  equipment?: string[];
  weapons?: any[];
  spells?: CharacterSpell[];

  // Spellcasting
  spellcastingAbility?: string;
  spellSaveDC?: number;
  spellAttackBonus?: number;

  // Background & Personality
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  backstory?: string;

  // Legacy fields (for backward compatibility)
  role?: string;
  description?: string;
  tags?: string[];
  classes?: CharacterClass[];
}

export interface MagicItem {
  id?: number;
  name: string;
  rarity?: string;
  type?: string;
  description?: string;
  properties?: Record<string, any>;
  attunement_required: boolean;
  owners?: Character[];
}

export interface CharacterItem {
  id?: number;
  name: string;
  description?: string;
  quantity: number;
  equipped: boolean;
  magic_item_id?: number; // Reference to a magical item if this is a magical item
  magic_item?: MagicItem; // Full magical item data when populated
}

export interface Session {
  id?: number;
  adventure_id?: number | null;
  title: string;
  date: string;
  text: string;
}

export interface Location {
  id?: number;
  adventure_id?: number | null;
  name: string;
  description?: string;
  notes?: string;
  tags?: string[];
}

export interface NPC {
  id?: number;
  adventure_id?: number | null;
  name: string;
  role?: string;
  description?: string;
  tags?: string[];
}

// API Response types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Form types (for frontend forms)
export interface CharacterForm extends Omit<Character, 'id' | 'saving_throws' | 'skills' | 'equipment' | 'weapons' | 'spells' | 'classes'> {
  savingThrows?: Record<string, boolean>;
  skills?: Record<string, boolean>;
  equipment?: string[];
  weapons?: any[];
  spells?: CharacterSpell[];
  classes?: CharacterClass[];
}

export interface MagicItemForm extends Omit<MagicItem, 'id' | 'owners'> {}

export interface SessionForm extends Omit<Session, 'id'> {}

export interface LocationForm extends Omit<Location, 'id'> {}

export interface NPCForm extends Omit<NPC, 'id'> {}

// Search and filter types
export interface SearchFilters {
  adventure_id?: number;
  query?: string;
  tags?: string[];
  rarity?: string;
  type?: string;
}

export interface SearchResult {
  sessions: Session[];
  npcs: NPC[];
  locations: Location[];
  characters: Character[];
  magicItems: MagicItem[];
}