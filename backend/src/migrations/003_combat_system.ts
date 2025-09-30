import Database from 'better-sqlite3';

export default {
  up: (db: any) => {
    // Combat Encounters table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS combat_encounters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        round INTEGER DEFAULT 1,
        active_combatant_id INTEGER,
        status TEXT DEFAULT 'active',
        environment TEXT, -- JSON array of EnvironmentEffect
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `).run();

    // Combat Participants table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS combat_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        encounter_id INTEGER NOT NULL,
        character_id INTEGER NOT NULL,
        initiative INTEGER NOT NULL,
        current_hp INTEGER NOT NULL,
        max_hp INTEGER NOT NULL,
        armor_class INTEGER NOT NULL,
        conditions TEXT, -- JSON array of CombatCondition
        notes TEXT,
        is_npc INTEGER DEFAULT 0,
        has_action INTEGER DEFAULT 1,
        has_bonus_action INTEGER DEFAULT 1,
        has_reaction INTEGER DEFAULT 1,
        has_movement INTEGER DEFAULT 1,
        position TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(encounter_id) REFERENCES combat_encounters(id) ON DELETE CASCADE,
        FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE
      )
    `).run();

    // Create indexes
    db.prepare('CREATE INDEX IF NOT EXISTS idx_combat_encounters_session ON combat_encounters(session_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_combat_participants_encounter ON combat_participants(encounter_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_combat_participants_character ON combat_participants(character_id)').run();
  }
};