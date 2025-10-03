import Database from 'better-sqlite3';

export default {
  up: (db: any) => {
    // character_locations (many-to-many relationship)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS character_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        relationship_type TEXT DEFAULT 'visits', -- 'lives_at', 'visits', 'works_at', 'owns', 'frequents', 'avoids'
        notes TEXT,
        is_current BOOLEAN DEFAULT 0, -- if this is the character's current location
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE CASCADE,
        UNIQUE(character_id, location_id, relationship_type)
      )
    `).run();

    // quest_locations (many-to-many relationship)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS quest_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quest_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        relationship_type TEXT DEFAULT 'takes_place_at', -- 'takes_place_at', 'starts_at', 'ends_at', 'leads_to', 'involves'
        notes TEXT,
        is_primary BOOLEAN DEFAULT 0, -- if this is the primary location for the quest
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(quest_id) REFERENCES quests(id) ON DELETE CASCADE,
        FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE CASCADE,
        UNIQUE(quest_id, location_id, relationship_type)
      )
    `).run();

    // Create indexes for better performance
    db.prepare('CREATE INDEX IF NOT EXISTS idx_character_locations_character ON character_locations(character_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_character_locations_location ON character_locations(location_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_character_locations_type ON character_locations(relationship_type)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_character_locations_current ON character_locations(is_current)').run();
    
    db.prepare('CREATE INDEX IF NOT EXISTS idx_quest_locations_quest ON quest_locations(quest_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_quest_locations_location ON quest_locations(location_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_quest_locations_type ON quest_locations(relationship_type)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_quest_locations_primary ON quest_locations(is_primary)').run();
  },
  
  down: (db: any) => {
    db.prepare('DROP INDEX IF EXISTS idx_quest_locations_primary').run();
    db.prepare('DROP INDEX IF EXISTS idx_quest_locations_type').run();
    db.prepare('DROP INDEX IF EXISTS idx_quest_locations_location').run();
    db.prepare('DROP INDEX IF EXISTS idx_quest_locations_quest').run();
    
    db.prepare('DROP INDEX IF EXISTS idx_character_locations_current').run();
    db.prepare('DROP INDEX IF EXISTS idx_character_locations_type').run();
    db.prepare('DROP INDEX IF EXISTS idx_character_locations_location').run();
    db.prepare('DROP INDEX IF EXISTS idx_character_locations_character').run();
    
    db.prepare('DROP TABLE IF EXISTS quest_locations').run();
    db.prepare('DROP TABLE IF EXISTS character_locations').run();
  }
};