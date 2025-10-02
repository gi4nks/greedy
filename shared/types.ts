// Shared types between frontend and backend
export interface EntityImage {
  id: number;
  image_path: string;
  display_order: number;
}

export interface Adventure {
  id?: number;
  slug?: string;
  title: string;
  description?: string;
  campaign_id?: number | null;
  images?: EntityImage[];
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
  character_type?: 'pc' | 'npc' | 'monster';
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

  // NPC-specific fields
  role?: string;
  npc_relationships?: Array<{
    characterId: number;
    relationship: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family' | 'friend' | 'rival';
    strength: number; // -10 to +10
    notes: string;
  }>;
  classes?: CharacterClass[];
  description?: string;
  tags?: string[];
  images?: EntityImage[];
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
  images?: EntityImage[];
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
  images?: EntityImage[];
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
  description?: string;
  tags?: string[];
  images?: EntityImage[];
}

export interface MagicItemForm extends Omit<MagicItem, 'id' | 'owners'> {}

export interface SessionForm extends Omit<Session, 'id'> {}

export interface LocationForm extends Omit<Location, 'id'> {}

export interface NPCForm extends Omit<NPC, 'id'> {}

export interface AdventureForm extends Omit<Adventure, 'id'> {
  campaign_id?: number | null;
}

export interface QuestForm extends Omit<Quest, 'id'> {}

export interface CampaignForm extends Omit<Campaign, 'id'> {}

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
  quests: Quest[];
  magicItems: MagicItem[];
}

export interface QuestObjective {
  id?: number;
  quest_id: number;
  description: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Quest {
  id?: number;
  adventure_id?: number | null;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'main' | 'side' | 'personal' | 'guild' | 'other';
  created_at?: string;
  updated_at?: string;
  due_date?: string | null;
  assigned_to?: string | null;
  tags?: string[];
  images?: EntityImage[];
}

export interface QuestWithObjectives extends Quest {
  objectives: QuestObjective[];
}

// Enhanced Combat System Types
export interface CombatCondition {
  id: string;
  name: string;
  description: string;
  duration: number; // rounds remaining, -1 for permanent
  source: string;
  effects: ConditionEffect[];
  createdAt: string;
}

export interface ConditionEffect {
  type: 'advantage' | 'disadvantage' | 'immunity' | 'resistance' | 'vulnerability' | 'bonus' | 'penalty';
  target: 'attack' | 'damage' | 'saving_throw' | 'ability_check' | 'speed' | 'ac';
  value?: number;
  description: string;
}

export interface CombatEncounter {
  id?: number;
  sessionId: number;
  name: string;
  round: number;
  activeCombatantId?: number;
  environment?: EnvironmentEffect[];
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface EnvironmentEffect {
  id: string;
  name: string;
  description: string;
  type: 'hazard' | 'terrain' | 'weather' | 'magical';
  effects: ConditionEffect[];
  area: string; // affected area description
}

export interface CombatParticipant {
  id?: number;
  encounterId: number;
  characterId: number;
  character?: Character; // populated when needed
  initiative: number;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  conditions: CombatCondition[];
  notes: string;
  isNpc: boolean;
  // Action economy tracking
  hasAction: boolean;
  hasBonusAction: boolean;
  hasReaction: boolean;
  hasMovement: boolean;
  position?: string; // grid position like "A5" or "x:5,y:3"
}

// Enhanced NPC Relationship Types
export interface NPCRelationship {
  id?: number;
  npcId: number;
  characterId: number;
  relationshipType: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family' | 'friend' | 'rival' | 'acquaintance';
  strength: number; // -10 to +10, where -10 is mortal enemy, +10 is best friend
  trust: number; // 0-100, how much they trust the character
  fear: number; // 0-100, how much they fear the character
  respect: number; // 0-100, how much they respect the character
  notes: string;
  history: RelationshipEvent[];
  latestEvent?: {
    id?: number;
    description?: string;
    impactValue?: number;
    trustChange?: number;
    fearChange?: number;
    respectChange?: number;
    date?: string;
    sessionTitle?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipEvent {
  id?: number;
  relationshipId: number;
  sessionId?: number;
  description: string;
  impactValue: number; // change in relationship strength (-10 to +10)
  trustChange: number; // change in trust (-100 to +100)
  fearChange: number; // change in fear (-100 to +100)
  respectChange: number; // change in respect (-100 to +100)
  date: string;
  createdAt: string;
}

export interface Campaign {
  id?: number;
  title: string;
  description?: string;
  status?: 'active' | 'completed' | 'on-hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  tags?: string[];
  images?: EntityImage[];
}