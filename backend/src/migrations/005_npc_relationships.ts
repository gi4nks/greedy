import Database from 'better-sqlite3';

export default {
  up: (db: any) => {
    // NPC Relationships table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS npc_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        npc_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL, -- Can be character, location, or another NPC
        target_type TEXT NOT NULL, -- 'character', 'npc', 'location'
        relationship_type TEXT NOT NULL, -- 'ally', 'enemy', 'friend', 'rival', 'mentor', 'student', etc.
        strength INTEGER DEFAULT 0, -- -100 to 100, negative = hostile, positive = friendly
        trust INTEGER DEFAULT 50, -- 0-100, how much they trust the target
        fear INTEGER DEFAULT 0, -- 0-100, how much they fear the target
        respect INTEGER DEFAULT 50, -- 0-100, how much they respect the target
        description TEXT,
        is_mutual INTEGER DEFAULT 1, -- Whether the relationship is mutual
        discovered_by_players INTEGER DEFAULT 0, -- Whether players know about this relationship
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(npc_id) REFERENCES characters(id) ON DELETE CASCADE
      )
    `).run();

    // Add missing columns if they don't exist
    const tableInfo = db.prepare("PRAGMA table_info(npc_relationships)").all() as any[];
    const existingColumns = tableInfo.map(col => col.name);

    if (!existingColumns.includes('trust')) {
      db.prepare('ALTER TABLE npc_relationships ADD COLUMN trust INTEGER DEFAULT 50').run();
    }
    if (!existingColumns.includes('fear')) {
      db.prepare('ALTER TABLE npc_relationships ADD COLUMN fear INTEGER DEFAULT 0').run();
    }
    if (!existingColumns.includes('respect')) {
      db.prepare('ALTER TABLE npc_relationships ADD COLUMN respect INTEGER DEFAULT 50').run();
    }

    // Relationship Events table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS relationship_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        relationship_id INTEGER NOT NULL,
        event_type TEXT NOT NULL, -- 'improved', 'worsened', 'discovered', 'changed'
        description TEXT NOT NULL,
        strength_change INTEGER DEFAULT 0,
        trust_change INTEGER DEFAULT 0,
        fear_change INTEGER DEFAULT 0,
        respect_change INTEGER DEFAULT 0,
        session_id INTEGER,
        event_date TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(relationship_id) REFERENCES npc_relationships(id) ON DELETE CASCADE,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL
      )
    `).run();

    // Create indexes
    db.prepare('CREATE INDEX IF NOT EXISTS idx_npc_relationships_npc ON npc_relationships(npc_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_npc_relationships_target ON npc_relationships(target_id, target_type)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_relationship_events_relationship ON relationship_events(relationship_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_relationship_events_session ON relationship_events(session_id)').run();
  }
};