# Multi-Edition Adventure Diary System - Architecture

## Database Schema Evolution

### Core Entities (Enhanced)

```sql
-- Game Editions Management
CREATE TABLE game_editions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- 'adnd2e', 'dnd5e', 'pf2e', etc.
  name TEXT NOT NULL, -- 'AD&D 2e', 'D&D 5e', etc.
  version TEXT,
  publisher TEXT,
  is_active BOOLEAN DEFAULT 1,
  import_sources JSON, -- Available import sources for this edition
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Campaigns (Multi-Edition)
CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  game_edition_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, on-hold, cancelled
  start_date TEXT,
  end_date TEXT,
  world_name TEXT,
  tags JSON,
  settings JSON, -- Campaign-specific rules, house rules
  images JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(game_edition_id) REFERENCES game_editions(id)
);

-- Enhanced Adventures (linked to campaigns)
ALTER TABLE adventures ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id);
ALTER TABLE adventures ADD COLUMN game_edition_id INTEGER REFERENCES game_editions(id);
ALTER TABLE adventures ADD COLUMN start_date TEXT;
ALTER TABLE adventures ADD COLUMN end_date TEXT;
ALTER TABLE adventures ADD COLUMN status TEXT DEFAULT 'active';

-- Session Logs (Enhanced with narrative system)
CREATE TABLE session_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  entry_type TEXT NOT NULL, -- 'narrative', 'combat', 'roleplay', 'exploration', 'rest'
  timestamp TEXT, -- Time within session
  content TEXT NOT NULL,
  characters_mentioned JSON, -- Array of character IDs
  locations_mentioned JSON, -- Array of location IDs
  items_mentioned JSON, -- Array of item IDs
  quests_mentioned JSON, -- Array of quest IDs
  tags JSON,
  is_summary BOOLEAN DEFAULT 0, -- If this is a session summary
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Timeline Events (Central chronicle)
CREATE TABLE timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- 'session', 'quest_start', 'quest_complete', 'character_death', 'location_discovered', etc.
  title TEXT NOT NULL,
  description TEXT,
  game_date TEXT, -- In-game date
  real_date TEXT NOT NULL, -- Real world date
  session_id INTEGER,
  related_entities JSON, -- {characters: [], locations: [], quests: [], items: []}
  importance_level INTEGER DEFAULT 1, -- 1-5 scale
  tags JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Enhanced Quest System
ALTER TABLE quests ADD COLUMN quest_giver_id INTEGER REFERENCES characters(id);
ALTER TABLE quests ADD COLUMN reward_description TEXT;
ALTER TABLE quests ADD COLUMN xp_reward INTEGER;
ALTER TABLE quests ADD COLUMN gold_reward INTEGER;
ALTER TABLE quests ADD COLUMN started_date TEXT;
ALTER TABLE quests ADD COLUMN completed_date TEXT;
ALTER TABLE quests ADD COLUMN game_date_start TEXT; -- In-game date
ALTER TABLE quests ADD COLUMN game_date_end TEXT;

-- Quest Progress Logs
CREATE TABLE quest_progress_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id INTEGER NOT NULL,
  session_id INTEGER,
  progress_type TEXT, -- 'started', 'progress', 'completed', 'failed', 'abandoned'
  description TEXT NOT NULL,
  game_date TEXT,
  real_date TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Location Events (What happened where)
CREATE TABLE location_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  session_id INTEGER,
  event_type TEXT, -- 'visited', 'combat', 'discovery', 'social', 'rest'
  title TEXT NOT NULL,
  description TEXT,
  participants JSON, -- Character IDs involved
  game_date TEXT,
  real_date TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Enhanced Character System (Edition-specific data)
ALTER TABLE characters ADD COLUMN game_edition_id INTEGER REFERENCES game_editions(id);
ALTER TABLE characters ADD COLUMN edition_data JSON; -- Edition-specific stats/abilities

-- Character Development Logs
CREATE TABLE character_development_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL,
  session_id INTEGER,
  development_type TEXT, -- 'level_up', 'ability_increase', 'feat_gained', 'class_feature', 'death', 'resurrection'
  description TEXT NOT NULL,
  mechanical_changes JSON, -- What actually changed statistically
  game_date TEXT,
  real_date TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Edition-Specific Content (Imported data)
CREATE TABLE edition_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_edition_id INTEGER NOT NULL,
  content_type TEXT NOT NULL, -- 'spell', 'item', 'monster', 'class', 'race', etc.
  name TEXT NOT NULL,
  source_book TEXT,
  source_page INTEGER,
  import_source TEXT, -- 'fandom', '5etools', 'manual'
  data JSON NOT NULL, -- Full content data
  tags JSON,
  is_homebrew BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(game_edition_id) REFERENCES game_editions(id) ON DELETE CASCADE
);

-- Search Index (Full-text search)
CREATE VIRTUAL TABLE search_index USING fts5(
  entity_type, -- 'session', 'character', 'location', 'quest', 'item'
  entity_id,
  title,
  content,
  tags,
  campaign_id
);
```

## New TypeScript Interfaces

```typescript
// Enhanced types for diary system

export interface GameEdition {
  id?: number;
  code: string; // 'adnd2e', 'dnd5e', etc.
  name: string;
  version?: string;
  publisher?: string;
  is_active: boolean;
  import_sources?: ImportSource[];
  created_at?: string;
}

export interface ImportSource {
  type: 'api' | 'file' | 'scraper';
  name: string;
  base_url?: string;
  supported_content: string[];
  config: Record<string, any>;
}

export interface Campaign {
  id?: number;
  title: string;
  description?: string;
  game_edition_id: number;
  game_edition?: GameEdition;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  world_name?: string;
  tags?: string[];
  settings?: CampaignSettings;
  images?: EntityImage[];
  adventures?: Adventure[];
  timeline_events?: TimelineEvent[];
  created_at?: string;
  updated_at?: string;
}

export interface CampaignSettings {
  house_rules?: string[];
  variant_rules?: string[];
  point_buy_stats?: boolean;
  starting_level?: number;
  multiclassing_allowed?: boolean;
  homebrew_allowed?: boolean;
  [key: string]: any; // Edition-specific settings
}

export interface TimelineEvent {
  id?: number;
  campaign_id: number;
  event_type: 'session' | 'quest_start' | 'quest_complete' | 'character_death' | 
             'location_discovered' | 'level_up' | 'major_event' | 'combat' | 'social';
  title: string;
  description?: string;
  game_date?: string; // In-game calendar
  real_date: string;
  session_id?: number;
  session?: Session;
  related_entities?: {
    characters?: number[];
    locations?: number[];
    quests?: number[];
    items?: number[];
  };
  importance_level: 1 | 2 | 3 | 4 | 5; // 1=minor, 5=campaign-defining
  tags?: string[];
  created_at?: string;
}

export interface SessionLog {
  id?: number;
  session_id: number;
  entry_type: 'narrative' | 'combat' | 'roleplay' | 'exploration' | 'rest' | 'summary';
  timestamp?: string; // Time within session (e.g., "2:30 PM" or "Hour 3")
  content: string; // Markdown supported
  characters_mentioned?: number[];
  locations_mentioned?: number[];
  items_mentioned?: number[];
  quests_mentioned?: number[];
  tags?: string[];
  is_summary: boolean;
  created_at?: string;
}

export interface QuestProgressLog {
  id?: number;
  quest_id: number;
  session_id?: number;
  progress_type: 'started' | 'progress' | 'completed' | 'failed' | 'abandoned';
  description: string;
  game_date?: string;
  real_date: string;
}

export interface LocationEvent {
  id?: number;
  location_id: number;
  session_id?: number;
  event_type: 'visited' | 'combat' | 'discovery' | 'social' | 'rest' | 'quest_event';
  title: string;
  description?: string;
  participants?: number[]; // Character IDs
  game_date?: string;
  real_date: string;
}

export interface CharacterDevelopmentLog {
  id?: number;
  character_id: number;
  session_id?: number;
  development_type: 'level_up' | 'ability_increase' | 'feat_gained' | 
                   'class_feature' | 'death' | 'resurrection' | 'multiclass';
  description: string;
  mechanical_changes?: Record<string, any>; // What changed
  game_date?: string;
  real_date: string;
}

export interface EditionContent {
  id?: number;
  game_edition_id: number;
  content_type: 'spell' | 'item' | 'monster' | 'class' | 'race' | 'feat' | 'background';
  name: string;
  source_book?: string;
  source_page?: number;
  import_source: 'fandom' | '5etools' | 'manual' | 'homebrew';
  data: Record<string, any>;
  tags?: string[];
  is_homebrew: boolean;
  created_at?: string;
}

export interface SearchResult {
  entity_type: 'session' | 'character' | 'location' | 'quest' | 'item' | 'timeline';
  entity_id: number;
  title: string;
  snippet: string; // Highlighted search result
  campaign_id: number;
  relevance_score: number;
}

// Enhanced existing interfaces
export interface Adventure extends Omit<Adventure, 'description'> {
  campaign_id?: number;
  game_edition_id?: number;
  start_date?: string;
  end_date?: string;
  status: 'planning' | 'active' | 'completed' | 'paused';
  timeline_events?: TimelineEvent[];
}

export interface Session extends Omit<Session, 'text'> {
  // Replace 'text' with structured logs
  logs?: SessionLog[];
  game_date?: string; // In-game date
  duration_hours?: number;
  xp_awarded?: number;
  gold_awarded?: number;
  summary?: string; // Auto-generated or manual summary
  timeline_events?: TimelineEvent[];
}

export interface Quest extends Quest {
  quest_giver_id?: number;
  quest_giver?: Character;
  reward_description?: string;
  xp_reward?: number;
  gold_reward?: number;
  started_date?: string;
  completed_date?: string;
  game_date_start?: string;
  game_date_end?: string;
  progress_logs?: QuestProgressLog[];
}

export interface Character extends Character {
  game_edition_id?: number;
  edition_data?: Record<string, any>; // Edition-specific stats
  development_logs?: CharacterDevelopmentLog[];
  timeline_events?: TimelineEvent[]; // Events this character was involved in
}

export interface Location extends Location {
  events?: LocationEvent[];
  first_discovered_session?: number;
  first_discovered_date?: string;
}
```