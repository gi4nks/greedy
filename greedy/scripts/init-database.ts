#!/usr/bin/env tsx
/**
 * Database initialization script
 * Sets up the database schema and runs necessary migrations
 */

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

// SQL to create all necessary tables
const initializeSchema = async () => {
  console.log("🗄️  Initializing database schema...");

  try {
    // Create game_editions table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS game_editions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        version TEXT,
        publisher TEXT,
        is_active INTEGER DEFAULT 1,
        import_sources TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create campaigns table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        start_date TEXT,
        end_date TEXT,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create adventures table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS adventures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER REFERENCES campaigns(id),
        slug TEXT,
        title TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'active',
        images TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adventure_id INTEGER REFERENCES adventures(id),
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        text TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create session_logs table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS session_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
        entry_type TEXT NOT NULL,
        timestamp TEXT,
        content TEXT NOT NULL,
        characters_mentioned TEXT,
        locations_mentioned TEXT,
        items_mentioned TEXT,
        quests_mentioned TEXT,
        tags TEXT,
        is_summary INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create timeline_events table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        game_date TEXT,
        real_date TEXT NOT NULL,
        session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
        related_entities TEXT,
        importance_level INTEGER DEFAULT 3,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create characters table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adventure_id INTEGER REFERENCES adventures(id),
        character_type TEXT DEFAULT 'pc',
        name TEXT NOT NULL,
        race TEXT,
        class TEXT,
        level INTEGER DEFAULT 1,
        background TEXT,
        alignment TEXT,
        experience INTEGER DEFAULT 0,
        strength INTEGER DEFAULT 10,
        dexterity INTEGER DEFAULT 10,
        constitution INTEGER DEFAULT 10,
        intelligence INTEGER DEFAULT 10,
        wisdom INTEGER DEFAULT 10,
        charisma INTEGER DEFAULT 10,
        hit_points INTEGER DEFAULT 0,
        max_hit_points INTEGER DEFAULT 0,
        armor_class INTEGER DEFAULT 10,
        initiative INTEGER DEFAULT 0,
        speed INTEGER DEFAULT 30,
        proficiency_bonus INTEGER DEFAULT 2,
        saving_throws TEXT,
        skills TEXT,
        equipment TEXT,
        weapons TEXT,
        spells TEXT,
        spellcasting_ability TEXT,
        spell_save_dc INTEGER,
        spell_attack_bonus INTEGER,
        personality_traits TEXT,
        ideals TEXT,
        bonds TEXT,
        flaws TEXT,
        backstory TEXT,
        role TEXT,
        npc_relationships TEXT,
        classes TEXT,
        description TEXT,
        tags TEXT,
        images TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create locations table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adventure_id INTEGER REFERENCES adventures(id),
        name TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        tags TEXT,
        images TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create quests table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adventure_id INTEGER REFERENCES adventures(id),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        priority TEXT DEFAULT 'medium',
        type TEXT DEFAULT 'main',
        due_date TEXT,
        assigned_to TEXT,
        tags TEXT,
        images TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create magic_items table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS magic_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rarity TEXT,
        type TEXT,
        description TEXT,
        properties TEXT,
        attunement_required INTEGER DEFAULT 0,
        images TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Database schema initialized successfully");

    // Create default game edition if none exists
    try {
      const existingEditions = await db.run(
        sql`SELECT COUNT(*) as count FROM game_editions LIMIT 1`,
      );
      console.log("📚 Creating default game edition...");
      await db.run(sql`
        INSERT OR IGNORE INTO game_editions (code, name, publisher, is_active)
        VALUES ('dnd5e', 'D&D 5th Edition', 'Wizards of the Coast', 1)
      `);
      console.log("✅ Default game edition created");
    } catch (error) {
      console.log("ℹ️  Default game edition setup skipped");
    }

    // Verify tables exist
    console.log("📋 Database tables created successfully");
    console.log("🎉 Database initialization complete!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
};

// Run initialization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSchema().catch(console.error);
}

export { initializeSchema };
