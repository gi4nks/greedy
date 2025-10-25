#!/usr/bin/env tsx
/**
 * Migration script to add character_diary_entries table
 */

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const runMigration = async () => {
  console.log("🗄️  Running migration: Add character_diary_entries table...");

  try {
    // Create character_diary_entries table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS character_diary_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        linked_entities TEXT, -- JSON array of {id, type, name}
        is_important INTEGER DEFAULT 0, -- 0 = false, 1 = true
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_diary_character ON character_diary_entries(character_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_diary_date ON character_diary_entries(date)`);

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(console.error);
}

export { runMigration };