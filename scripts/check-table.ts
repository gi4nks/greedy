#!/usr/bin/env tsx
/**
 * Check if character_diary_entries table exists and create it if not
 */

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const checkAndCreateTable = async () => {
  console.log("Checking if character_diary_entries table exists...");

  try {
    // Check if table exists
    const result = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table' AND name='character_diary_entries'`);
    console.log("Table check result:", result);

    if (result.changes === undefined || result.changes === 0) {
      console.log("Table does not exist, creating it...");

      // Create the table
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS character_diary_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          character_id INTEGER NOT NULL,
          description TEXT NOT NULL,
          date TEXT NOT NULL,
          linked_entities TEXT,
          is_important INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
        )
      `);

      // Create indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_diary_character ON character_diary_entries(character_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_diary_date ON character_diary_entries(date)`);

      console.log("✅ Table created successfully");
    } else {
      console.log("✅ Table already exists");
    }

    // Test select
    try {
      await db.select().from(sql`character_diary_entries`).limit(1);
      console.log("✅ Table is accessible");
    } catch (error) {
      console.log("❌ Table not accessible:", (error as Error).message);
    }
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
};

// Run check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAndCreateTable().catch(console.error);
}

export { checkAndCreateTable };
