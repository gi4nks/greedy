import Database from 'better-sqlite3';

export default {
  up: (db: any) => {
    // adventures
    db.prepare(`
      CREATE TABLE IF NOT EXISTS adventures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // sessions
    db.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adventure_id INTEGER,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        text TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE SET NULL
      )
    `).run();

    // characters (unified PC/NPC table)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adventure_id INTEGER,
        character_type TEXT DEFAULT 'pc', -- 'pc', 'npc', 'monster'
        name TEXT NOT NULL,
        race TEXT,
        class TEXT,
        level INTEGER DEFAULT 1,
        background TEXT,
        alignment TEXT,
        experience INTEGER DEFAULT 0,
        -- Ability Scores
        strength INTEGER DEFAULT 10,
        dexterity INTEGER DEFAULT 10,
        constitution INTEGER DEFAULT 10,
        intelligence INTEGER DEFAULT 10,
        wisdom INTEGER DEFAULT 10,
        charisma INTEGER DEFAULT 10,
        -- Combat Stats
        hit_points INTEGER DEFAULT 0,
        max_hit_points INTEGER DEFAULT 0,
        armor_class INTEGER DEFAULT 10,
        initiative INTEGER DEFAULT 0,
        speed INTEGER DEFAULT 30,
        proficiency_bonus INTEGER DEFAULT 2,
        -- Saving Throws (stored as JSON)
        saving_throws TEXT,
        -- Skills (stored as JSON)
        skills TEXT,
        -- Equipment & Inventory (stored as JSON)
        equipment TEXT,
        weapons TEXT,
        -- Spells (stored as JSON)
        spells TEXT,
        spellcasting_ability TEXT,
        spell_save_dc INTEGER,
        spell_attack_bonus INTEGER,
        -- Background & Personality (stored as JSON/text)
        personality_traits TEXT,
        ideals TEXT,
        bonds TEXT,
        flaws TEXT,
        backstory TEXT,
        -- NPC-specific fields
        role TEXT, -- for NPCs
        npc_relationships TEXT, -- JSON array of relationships
        -- Legacy fields (keeping for backward compatibility)
        description TEXT,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE SET NULL
      )
    `).run();

    // locations
    db.prepare(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adventure_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE SET NULL
      )
    `).run();

    // magic items
    db.prepare(`
      CREATE TABLE IF NOT EXISTS magic_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rarity TEXT,
        type TEXT,
        description TEXT,
        properties TEXT,
        attunement_required INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // character_magic_items (many-to-many relationship)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS character_magic_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        magic_item_id INTEGER NOT NULL,
        equipped INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY(magic_item_id) REFERENCES magic_items(id) ON DELETE CASCADE,
        UNIQUE(character_id, magic_item_id)
      )
    `).run();

    // quests
    db.prepare(`
      CREATE TABLE IF NOT EXISTS quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adventure_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        priority TEXT DEFAULT 'medium',
        type TEXT DEFAULT 'main',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        due_date TEXT,
        assigned_to TEXT,
        tags TEXT,
        FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE SET NULL
      )
    `).run();

    // quest objectives (sub-tasks)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS quest_objectives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quest_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(quest_id) REFERENCES quests(id) ON DELETE CASCADE
      )
    `).run();

    // parking lot for imported content
    db.prepare(`
      CREATE TABLE IF NOT EXISTS parking_lot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        content_type TEXT NOT NULL,
        wiki_url TEXT,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create indexes for better performance
    db.prepare('CREATE INDEX IF NOT EXISTS idx_characters_adventure ON characters(adventure_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_characters_type ON characters(character_type)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_sessions_adventure ON sessions(adventure_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_locations_adventure ON locations(adventure_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_magic_items_rarity ON magic_items(rarity)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_magic_items_type ON magic_items(type)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_character_magic_items_character ON character_magic_items(character_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_character_magic_items_item ON character_magic_items(magic_item_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_quests_adventure ON quests(adventure_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_quests_priority ON quests(priority)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(type)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_quest_objectives_quest ON quest_objectives(quest_id)').run();

    // Insert default adventures if none exist
    const countResult = db.prepare('SELECT COUNT(*) as c FROM adventures').get() as { c: number };
    if (countResult.c === 0) {
      const insert = db.prepare('INSERT INTO adventures (slug, title, description) VALUES (?, ?, ?)');
      insert.run('saltmarsh', 'Ghosts of Saltmarsh', 'A coastal adventure.');
      insert.run('pharaoh', 'Tomb of Annihilation / Pharaoh', 'Ancient tombs and curses.');
    }
  }
};