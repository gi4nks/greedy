import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Core entities - simplified for initial migration
export const gameEditions = sqliteTable('game_editions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  version: text('version'),
  publisher: text('publisher'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  importSources: text('import_sources', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const campaigns = sqliteTable('campaigns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameEditionId: integer('game_edition_id').references(() => gameEditions.id).default(1),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('active'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  tags: text('tags', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const adventures = sqliteTable('adventures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  campaignId: integer('campaign_id').references(() => campaigns.id),
  slug: text('slug'),
  title: text('title').notNull(),
  description: text('description'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').default('active'),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adventureId: integer('adventure_id').references(() => adventures.id),
  title: text('title').notNull(),
  date: text('date').notNull(),
  text: text('text'),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const sessionLogs = sqliteTable('session_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
  entryType: text('entry_type').notNull(),
  timestamp: text('timestamp'),
  content: text('content').notNull(),
  charactersMentioned: text('characters_mentioned', { mode: 'json' }),
  locationsMentioned: text('locations_mentioned', { mode: 'json' }),
  itemsMentioned: text('items_mentioned', { mode: 'json' }),
  questsMentioned: text('quests_mentioned', { mode: 'json' }),
  tags: text('tags', { mode: 'json' }),
  isSummary: integer('is_summary', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Timeline events table - commented out until migration is created
export const timelineEvents = sqliteTable('timeline_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  campaignId: integer('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  gameDate: text('game_date'),
  realDate: text('real_date').notNull(),
  sessionId: integer('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  relatedEntities: text('related_entities', { mode: 'json' }),
  importanceLevel: integer('importance_level').default(3),
  tags: text('tags', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const characters = sqliteTable('characters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  campaignId: integer('campaign_id').references(() => campaigns.id),
  adventureId: integer('adventure_id').references(() => adventures.id),
  characterType: text('character_type').default('pc'),
  name: text('name').notNull(),
  race: text('race'),
  level: integer('level').default(1),
  background: text('background'),
  alignment: text('alignment'),
  experience: integer('experience').default(0),
  strength: integer('strength').default(10),
  dexterity: integer('dexterity').default(10),
  constitution: integer('constitution').default(10),
  intelligence: integer('intelligence').default(10),
  wisdom: integer('wisdom').default(10),
  charisma: integer('charisma').default(10),
  hitPoints: integer('hit_points').default(0),
  maxHitPoints: integer('max_hit_points').default(0),
  armorClass: integer('armor_class').default(10),
  initiative: integer('initiative').default(0),
  speed: integer('speed').default(30),
  proficiencyBonus: integer('proficiency_bonus').default(2),
  savingThrows: text('saving_throws', { mode: 'json' }),
  skills: text('skills', { mode: 'json' }),
  equipment: text('equipment', { mode: 'json' }),
  weapons: text('weapons', { mode: 'json' }),
  spells: text('spells', { mode: 'json' }),
  spellcastingAbility: text('spellcasting_ability'),
  spellSaveDc: integer('spell_save_dc'),
  spellAttackBonus: integer('spell_attack_bonus'),
  personalityTraits: text('personality_traits'),
  ideals: text('ideals'),
  bonds: text('bonds'),
  flaws: text('flaws'),
  backstory: text('backstory'),
  role: text('role'),
  npcRelationships: text('npc_relationships', { mode: 'json' }),
  classes: text('classes', { mode: 'json' }),
  items: text('items', { mode: 'json' }),
  description: text('description'),
  tags: text('tags', { mode: 'json' }),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const locations = sqliteTable('locations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adventureId: integer('adventure_id').references(() => adventures.id),
  name: text('name').notNull(),
  description: text('description'),
  notes: text('notes'),
  tags: text('tags', { mode: 'json' }),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const npcs = sqliteTable('npcs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adventureId: integer('adventure_id').references(() => adventures.id),
  name: text('name').notNull(),
  role: text('role'),
  description: text('description'),
  tags: text('tags', { mode: 'json' }),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const magicItems = sqliteTable('magic_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  rarity: text('rarity'),
  type: text('type'),
  description: text('description'),
  properties: text('properties', { mode: 'json' }),
  attunementRequired: integer('attunement_required', { mode: 'boolean' }).default(false),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const characterMagicItems = sqliteTable('character_magic_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  magicItemId: integer('magic_item_id').references(() => magicItems.id, { onDelete: 'cascade' }).notNull(),
  isAttuned: integer('is_attuned', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Unified wiki articles table - stores all wiki-imported content
export const wikiArticles = sqliteTable('wiki_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  contentType: text('content_type').notNull(), // spell, monster, magic_item, race, class, location, etc.
  wikiUrl: text('wiki_url'),
  rawContent: text('raw_content'), // Full wiki markup content
  parsedData: text('parsed_data', { mode: 'json' }), // Structured data extracted from content
  importedFrom: text('imported_from').default('wiki'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Many-to-many relationships between wiki articles and entities
export const wikiArticleEntities = sqliteTable('wiki_article_entities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  wikiArticleId: integer('wiki_article_id').references(() => wikiArticles.id, { onDelete: 'cascade' }).notNull(),
  entityType: text('entity_type').notNull(), // character, location, quest, session, etc.
  entityId: integer('entity_id').notNull(),
  relationshipType: text('relationship_type'), // prepared, known, companion, owned, referenced, etc.
  relationshipData: text('relationship_data', { mode: 'json' }), // Additional relationship-specific data
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const quests = sqliteTable('quests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adventureId: integer('adventure_id').references(() => adventures.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('active'),
  priority: text('priority').default('medium'),
  type: text('type').default('main'),
  dueDate: text('due_date'),
  assignedTo: text('assigned_to'),
  tags: text('tags', { mode: 'json' }),
  images: text('images', { mode: 'json' }),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Additional tables will be added as needed
// Relations will be added in a separate step

// Type exports for components
export type Campaign = {
  id: number;
  gameEditionId: number | null;
  gameEditionName: string | null;
  gameEditionVersion: string | null;
  title: string;
  description: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  tags: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Adventure = {
  id: number;
  campaignId: number | null;
  slug: string | null;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Session = {
  id: number;
  adventureId: number | null;
  title: string;
  date: string;
  text: string | null;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SessionLog = {
  id: number;
  sessionId: number | null;
  entryType: string;
  timestamp: string | null;
  content: string;
  charactersMentioned: unknown;
  locationsMentioned: unknown;
  itemsMentioned: unknown;
  questsMentioned: unknown;
  tags: unknown;
  isSummary: boolean | null;
  createdAt: string | null;
};

export type Character = {
  id: number;
  campaignId: number | null;
  adventureId: number | null;
  characterType: string | null;
  name: string;
  race: string | null;
  background: string | null;
  alignment: string | null;
  experience: number | null;
  strength: number | null;
  dexterity: number | null;
  constitution: number | null;
  intelligence: number | null;
  wisdom: number | null;
  charisma: number | null;
  hitPoints: number | null;
  maxHitPoints: number | null;
  armorClass: number | null;
  initiative: number | null;
  speed: number | null;
  proficiencyBonus: number | null;
  savingThrows: unknown;
  skills: unknown;
  equipment: unknown;
  weapons: unknown;
  spells: unknown;
  spellcastingAbility: string | null;
  spellSaveDc: number | null;
  spellAttackBonus: number | null;
  personalityTraits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  backstory: string | null;
  role: string | null;
  npcRelationships: unknown;
  classes: unknown;
  items: unknown;
  description: string | null;
  tags: unknown;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TimelineEvent = {
  id: number;
  campaignId: number | null;
  eventType: string;
  title: string;
  description: string | null;
  gameDate: string | null;
  realDate: string;
  sessionId: number | null;
  relatedEntities: unknown;
  importanceLevel: number | null;
  tags: unknown;
  createdAt: string | null;
};

export type MagicItem = {
  id: number;
  name: string;
  rarity: string | null;
  type: string | null;
  description: string | null;
  properties: unknown;
  attunementRequired: boolean | null;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};