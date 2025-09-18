import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(__dirname, 'campaign.db');
// Ensure directory exists where DB will be created
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);

export function migrate(): void {
  // adventures
  db.prepare(`
    CREATE TABLE IF NOT EXISTS adventures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      title TEXT,
      description TEXT
    )
  `).run();

  // sessions
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adventure_id INTEGER,
      title TEXT,
      date TEXT,
      text TEXT,
      FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE SET NULL
    )
  `).run();

  // characters (renamed from npcs)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adventure_id INTEGER,
      name TEXT,
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
      -- Legacy fields (keeping for backward compatibility)
      role TEXT,
      description TEXT,
      tags TEXT,
      FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE SET NULL
    )
  `).run();

  // Add new columns to existing characters table if they don't exist
  const tableInfo = db.prepare("PRAGMA table_info(characters)").all() as any[];
  const existingColumns = tableInfo.map(col => col.name);

  const newColumns = [
    { name: 'race', type: 'TEXT' },
    { name: 'class', type: 'TEXT' },
    { name: 'level', type: 'INTEGER DEFAULT 1' },
    { name: 'background', type: 'TEXT' },
    { name: 'alignment', type: 'TEXT' },
    { name: 'experience', type: 'INTEGER DEFAULT 0' },
    { name: 'classes', type: 'TEXT' },
    { name: 'items', type: 'TEXT' },
    { name: 'strength', type: 'INTEGER DEFAULT 10' },
    { name: 'dexterity', type: 'INTEGER DEFAULT 10' },
    { name: 'constitution', type: 'INTEGER DEFAULT 10' },
    { name: 'intelligence', type: 'INTEGER DEFAULT 10' },
    { name: 'wisdom', type: 'INTEGER DEFAULT 10' },
    { name: 'charisma', type: 'INTEGER DEFAULT 10' },
    { name: 'hit_points', type: 'INTEGER DEFAULT 0' },
    { name: 'max_hit_points', type: 'INTEGER DEFAULT 0' },
    { name: 'armor_class', type: 'INTEGER DEFAULT 10' },
    { name: 'initiative', type: 'INTEGER DEFAULT 0' },
    { name: 'speed', type: 'INTEGER DEFAULT 30' },
    { name: 'proficiency_bonus', type: 'INTEGER DEFAULT 2' },
    { name: 'saving_throws', type: 'TEXT' },
    { name: 'skills', type: 'TEXT' },
    { name: 'equipment', type: 'TEXT' },
    { name: 'weapons', type: 'TEXT' },
    { name: 'spells', type: 'TEXT' },
    { name: 'spellcasting_ability', type: 'TEXT' },
    { name: 'spell_save_dc', type: 'INTEGER' },
    { name: 'spell_attack_bonus', type: 'INTEGER' },
    { name: 'personality_traits', type: 'TEXT' },
    { name: 'ideals', type: 'TEXT' },
    { name: 'bonds', type: 'TEXT' },
    { name: 'flaws', type: 'TEXT' },
    { name: 'backstory', type: 'TEXT' }
  ];

  for (const col of newColumns) {
    if (!existingColumns.includes(col.name)) {
      db.prepare(`ALTER TABLE characters ADD COLUMN ${col.name} ${col.type}`).run();
    }
  }

  // Rename npcs table to characters if it exists (for migration)
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='npcs'").all();
  if (tables.length > 0) {
    db.prepare('ALTER TABLE npcs RENAME TO characters_temp').run();
    // Copy data from old table to new table
    const oldData = db.prepare('SELECT * FROM characters_temp').all();
    for (const row of oldData as any[]) {
      db.prepare(`
        INSERT INTO characters (id, adventure_id, name, role, description, tags)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(row.id, row.adventure_id, row.name, row.role, row.description, row.tags);
    }
    db.prepare('DROP TABLE characters_temp').run();
  }

  // locations
  db.prepare(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adventure_id INTEGER,
      name TEXT,
      description TEXT,
      notes TEXT,
      tags TEXT,
      FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE SET NULL
    )
  `).run();

  // global notes (not linked to adventures)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS global_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      text TEXT,
      created_at TEXT
    )
  `).run();

  // magic items
  // If the existing table has an adventure_id column, migrate to a schema
  // that no longer stores adventure_id on magic items (many-to-many is handled
  // by character_magic_items). Migration copies existing rows preserving ids.
  const magicInfo = db.prepare("PRAGMA table_info(magic_items)").all() as any[];
  const magicHasAdventure = magicInfo.some(c => c.name === 'adventure_id');
  if (magicInfo.length === 0) {
    // table doesn't exist yet; create with desired schema
    db.prepare(`
      CREATE TABLE IF NOT EXISTS magic_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        rarity TEXT,
        type TEXT,
        description TEXT,
        properties TEXT,
        attunement_required INTEGER DEFAULT 0
      )
    `).run();
  } else if (magicHasAdventure) {
    // perform safe migration: create new table, copy data, drop old, rename
    db.prepare('PRAGMA foreign_keys = OFF').run();
    db.prepare(`
      CREATE TABLE IF NOT EXISTS magic_items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        rarity TEXT,
        type TEXT,
        description TEXT,
        properties TEXT,
        attunement_required INTEGER DEFAULT 0
      )
    `).run();

    // copy rows preserving id
    db.prepare(`
      INSERT OR REPLACE INTO magic_items_new (id, name, rarity, type, description, properties, attunement_required)
      SELECT id, name, rarity, type, description, properties, attunement_required FROM magic_items
    `).run();

    db.prepare('DROP TABLE magic_items').run();
    db.prepare('ALTER TABLE magic_items_new RENAME TO magic_items').run();
    db.prepare('PRAGMA foreign_keys = ON').run();
  } else {
    // table exists and already has desired schema; ensure it's created (no-op)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS magic_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        rarity TEXT,
        type TEXT,
        description TEXT,
        properties TEXT,
        attunement_required INTEGER DEFAULT 0
      )
    `).run();
  }

  // quests/objectives
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

  // Create indexes for better performance
  db.prepare('CREATE INDEX IF NOT EXISTS idx_characters_adventure ON characters(adventure_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_sessions_adventure ON sessions(adventure_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_locations_adventure ON locations(adventure_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_magic_items_rarity ON magic_items(rarity)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_magic_items_type ON magic_items(type)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_quests_adventure ON quests(adventure_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_quests_priority ON quests(priority)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(type)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_quest_objectives_quest ON quest_objectives(quest_id)').run();
  const countResult = db.prepare('SELECT COUNT(*) as c FROM adventures').get() as { c: number };
  const count = countResult.c;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO adventures (slug, title, description) VALUES (?, ?, ?)');
    insert.run('saltmarsh', 'Ghosts of Saltmarsh', 'A coastal adventure.');
    insert.run('pharaoh', 'Tomb of Annihilation / Pharaoh', 'Ancient tombs and curses.');
  }
}

export { db };