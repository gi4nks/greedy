#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.resolve(__dirname, '../app/database/campaign.db');

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Setting up database at: ${DB_PATH}`);

const db = new Database(DB_PATH);

// Migration tracking table
db.prepare(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    executed_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Basic schema setup - simplified version for the Next.js app
const migrations = [
  {
    version: 1,
    name: '001_initial_schema',
    up: (db: Database.Database) => {
      // Campaigns table
      db.prepare(`
        CREATE TABLE campaigns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'active',
          start_date TEXT,
          end_date TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Adventures table
      db.prepare(`
        CREATE TABLE adventures (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          campaign_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          start_date TEXT,
          end_date TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
        )
      `).run();

      // Characters table
      db.prepare(`
        CREATE TABLE characters (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          adventure_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          character_type TEXT DEFAULT 'pc',
          race TEXT,
          class TEXT,
          level INTEGER,
          description TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
        )
      `).run();

      // Sessions table
      db.prepare(`
        CREATE TABLE sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          adventure_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          date TEXT NOT NULL,
          text TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
        )
      `).run();

      // Session logs table
      db.prepare(`
        CREATE TABLE session_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          entry_type TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `).run();

      // Locations table
      db.prepare(`
        CREATE TABLE locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          adventure_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
        )
      `).run();

      // Quests table
      db.prepare(`
        CREATE TABLE quests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          adventure_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'active',
          priority TEXT DEFAULT 'medium',
          type TEXT DEFAULT 'main',
          assigned_to TEXT,
          due_date TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
        )
      `).run();

      // Magic items table
      db.prepare(`
        CREATE TABLE magic_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          rarity TEXT,
          type TEXT,
          properties TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    }
  }
];

function runMigrations() {
  const executedMigrations = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[];
  const executedVersions = new Set(executedMigrations.map(m => m.version));

  for (const migration of migrations) {
    if (executedVersions.has(migration.version)) {
      console.log(`Skipping already executed migration: ${migration.name}`);
      continue;
    }

    console.log(`Running migration: ${migration.name}`);

    try {
      db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
      })();
      console.log(`✅ Migration ${migration.name} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${migration.name} failed:`, error);
      throw error;
    }
  }
}

try {
  runMigrations();
  console.log('🎉 Database setup completed successfully!');
} catch (error) {
  console.error('💥 Database setup failed:', error);
  process.exit(1);
} finally {
  db.close();
}