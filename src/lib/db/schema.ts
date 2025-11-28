import { sqliteTable, integer, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";

// Core entities - simplified for initial migration
export const gameEditions = sqliteTable("game_editions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  version: text("version"),
  publisher: text("publisher"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  importSources: text("import_sources", { mode: "json" }),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameEditionId: integer("game_edition_id")
    .references(() => gameEditions.id)
    .default(1),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("active"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  tags: text("tags", { mode: "json" }),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const adventures = sqliteTable("adventures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  slug: text("slug"),
  title: text("title").notNull(),
  description: text("description"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").default("active"),
  images: text("images", { mode: "json" }),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  adventureId: integer("adventure_id").references(() => adventures.id),
  title: text("title").notNull(),
  date: text("date").notNull(),
  text: text("text"), // Raw session notes (events, mechanics, decisions)
  narrative: text("narrative"), // Polished narrative version (story-like, romanced)
  images: text("images", { mode: "json" }),
  promotedTo: text("promoted_to", { mode: "json" }), // Array of {type, id, text, createdAt}
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  adventureId: integer("adventure_id").references(() => adventures.id),
  characterType: text("character_type").default("pc"),
  name: text("name").notNull(),
  race: text("race"),
  background: text("background"),
  alignment: text("alignment"),
  strength: integer("strength").default(10),
  dexterity: integer("dexterity").default(10),
  constitution: integer("constitution").default(10),
  intelligence: integer("intelligence").default(10),
  wisdom: integer("wisdom").default(10),
  charisma: integer("charisma").default(10),
  hitPoints: integer("hit_points").default(0),
  maxHitPoints: integer("max_hit_points").default(0),
  armorClass: integer("armor_class").default(10),
  classes: text("classes", { mode: "json" }),
  description: text("description"),
  images: text("images", { mode: "json" }),
  tags: text("tags", { mode: "json" }),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  adventureId: integer("adventure_id").references(() => adventures.id),
  name: text("name").notNull(),
  description: text("description"),
  tags: text("tags", { mode: "json" }),
  images: text("images", { mode: "json" }),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const npcs = sqliteTable("npcs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adventureId: integer("adventure_id").references(() => adventures.id),
  name: text("name").notNull(),
  role: text("role"),
  description: text("description"),
  tags: text("tags", { mode: "json" }),
  images: text("images", { mode: "json" }),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const magicItems = sqliteTable("magic_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  rarity: text("rarity"),
  type: text("type"),
  description: text("description"),
  properties: text("properties", { mode: "json" }),
  attunementRequired: integer("attunement_required", {
    mode: "boolean",
  }).default(false),
  tags: text("tags", { mode: "json" }),
  images: text("images", { mode: "json" }),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const characterMagicItems = sqliteTable("character_magic_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id")
    .references(() => characters.id, { onDelete: "cascade" })
    .notNull(),
  magicItemId: integer("magic_item_id")
    .references(() => magicItems.id, { onDelete: "cascade" })
    .notNull(),
  isAttuned: integer("is_attuned", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const magicItemAssignments = sqliteTable(
  "magic_item_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    magicItemId: integer("magic_item_id")
      .references(() => magicItems.id, { onDelete: "cascade" })
      .notNull(),
    entityType: text("entity_type").notNull(),
    entityId: integer("entity_id").notNull(),
    campaignId: integer("campaign_id").references(() => campaigns.id, {
      onDelete: "cascade",
    }),
    source: text("source").default("manual"),
    notes: text("notes"),
    metadata: text("metadata", { mode: "json" }),
    assignedAt: text("assigned_at").default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    magicItemIndex: index("idx_magic_item_assignments_magic_item").on(
      table.magicItemId,
    ),
    entityIndex: index("idx_magic_item_assignments_entity").on(
      table.entityType,
      table.entityId,
    ),
    campaignIndex: index("idx_magic_item_assignments_campaign").on(
      table.campaignId,
    ),
    uniqueAssignment: uniqueIndex("uniq_magic_item_assignment").on(
      table.magicItemId,
      table.entityType,
      table.entityId,
    ),
  }),
);

// Unified wiki articles table - stores all wiki-imported content
export const wikiArticles = sqliteTable("wiki_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(), // spell, monster, magic_item, race, class, location, etc.
  wikiUrl: text("wiki_url"),
  rawContent: text("raw_content"), // Full wiki markup content
  parsedData: text("parsed_data", { mode: "json" }), // Structured data extracted from content
  importedFrom: text("imported_from").default("wiki"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Many-to-many relationships between wiki articles and entities
export const wikiArticleEntities = sqliteTable("wiki_article_entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wikiArticleId: integer("wiki_article_id")
    .references(() => wikiArticles.id, { onDelete: "cascade" })
    .notNull(),
  entityType: text("entity_type").notNull(), // character, location, quest, session, etc.
  entityId: integer("entity_id").notNull(),
  relationshipType: text("relationship_type"), // prepared, known, companion, owned, referenced, etc.
  relationshipData: text("relationship_data", { mode: "json" }), // Additional relationship-specific data
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const quests = sqliteTable("quests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adventureId: integer("adventure_id").references(() => adventures.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("active"),
  priority: text("priority").default("medium"),
  type: text("type").default("main"),
  dueDate: text("due_date"),
  assignedTo: text("assigned_to"),
  tags: text("tags", { mode: "json" }),
  images: text("images", { mode: "json" }),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Relations table - defines relationships between entities
export const relations = sqliteTable(
  "relations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    campaignId: integer("campaign_id")
      .references(() => campaigns.id, { onDelete: "cascade" })
      .notNull(),
    sourceEntityType: text("source_entity_type").notNull(), // 'character', 'location', 'quest', 'adventure', 'session'
    sourceEntityId: integer("source_entity_id").notNull(),
    targetEntityType: text("target_entity_type").notNull(), // 'character', 'location', 'quest', 'adventure', 'session'
    targetEntityId: integer("target_entity_id").notNull(),
    relationType: text("relation_type").notNull(), // 'ally', 'enemy', 'parent', 'child', 'belongs-to', 'located-at', 'member-of', etc.
    description: text("description"),
    bidirectional: integer("bidirectional", { mode: "boolean" }).default(false),
    metadata: text("metadata", { mode: "json" }),
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    campaignIndex: index("idx_relations_campaign").on(table.campaignId),
    sourceIndex: index("idx_relations_source").on(
      table.sourceEntityType,
      table.sourceEntityId,
    ),
    targetIndex: index("idx_relations_target").on(
      table.targetEntityType,
      table.targetEntityId,
    ),
    uniqueRelation: uniqueIndex("uniq_relation").on(
      table.campaignId,
      table.sourceEntityType,
      table.sourceEntityId,
      table.targetEntityType,
      table.targetEntityId,
      table.relationType,
    ),
  }),
);

// Character diary entries - for narrative character development tracking
export const characterDiaryEntries = sqliteTable(
  "character_diary_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    characterId: integer("character_id")
      .references(() => characters.id, { onDelete: "cascade" })
      .notNull(),
    description: text("description").notNull(),
    date: text("date").notNull(),
    linkedEntities: text("linked_entities", { mode: "json" }), // Array of {id, type, name}
    isImportant: integer("is_important", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    characterIndex: index("idx_diary_character").on(table.characterId),
    dateIndex: index("idx_diary_date").on(table.date),
  }),
);

// Location diary entries - for tracking location history and events
export const locationDiaryEntries = sqliteTable(
  "location_diary_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    locationId: integer("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    description: text("description").notNull(),
    date: text("date").notNull(),
    linkedEntities: text("linked_entities", { mode: "json" }), // Array of {id, type, name}
    isImportant: integer("is_important", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    locationIndex: index("idx_location_diary_location").on(table.locationId),
    dateIndex: index("idx_location_diary_date").on(table.date),
  }),
);

// Quest diary entries - for tracking quest progress and events
export const questDiaryEntries = sqliteTable(
  "quest_diary_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    questId: integer("quest_id")
      .references(() => quests.id, { onDelete: "cascade" })
      .notNull(),
    description: text("description").notNull(),
    date: text("date").notNull(),
    linkedEntities: text("linked_entities", { mode: "json" }), // Array of {id, type, name}
    isImportant: integer("is_important", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
  },
  (table) => ({
    questIndex: index("idx_quest_diary_quest").on(table.questId),
    dateIndex: index("idx_quest_diary_date").on(table.date),
  }),
);

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
  campaignId: number | null;
  adventureId: number | null;
  title: string;
  date: string;
  text: string | null;
  images: unknown;
  promotedTo: unknown; // Array of {type, id, text, createdAt}
  createdAt: string | null;
  updatedAt: string | null;
};

export type Location = {
  id: number;
  campaignId: number | null;
  adventureId: number | null;
  name: string;
  description: string | null;
  tags: unknown;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Quest = {
  id: number;
  adventureId: number | null;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  type: string | null;
  dueDate: string | null;
  assignedTo: string | null;
  tags: unknown;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
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
  strength: number | null;
  dexterity: number | null;
  constitution: number | null;
  intelligence: number | null;
  wisdom: number | null;
  charisma: number | null;
  hitPoints: number | null;
  maxHitPoints: number | null;
  armorClass: number | null;
  classes: unknown;
  description: string | null;
  images: unknown;
  tags: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

export type MagicItem = {
  id: number;
  name: string;
  rarity: string | null;
  type: string | null;
  description: string | null;
  properties: unknown;
  attunementRequired: boolean | null;
  tags: unknown;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

export type MagicItemAssignment = {
  id: number;
  magicItemId: number;
  entityType: string;
  entityId: number;
  campaignId: number | null;
  source: string | null;
  notes: string | null;
  metadata: unknown;
  assignedAt: string | null;
};

export type Relation = {
  id: number;
  campaignId: number;
  sourceEntityType: string;
  sourceEntityId: number;
  targetEntityType: string;
  targetEntityId: number;
  relationType: string;
  description: string | null;
  bidirectional: boolean | null;
  metadata: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CharacterDiaryEntry = {
  id: number;
  characterId: number;
  description: string;
  date: string;
  linkedEntities: unknown; // JSON array of {id, type, name}
  isImportant: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LocationDiaryEntry = {
  id: number;
  locationId: number;
  description: string;
  date: string;
  linkedEntities: unknown; // JSON array of {id, type, name}
  isImportant: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuestDiaryEntry = {
  id: number;
  questId: number;
  description: string;
  date: string;
  linkedEntities: unknown; // JSON array of {id, type, name}
  isImportant: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
};
