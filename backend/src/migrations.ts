import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_FILE === ':memory:'
  ? ':memory:'
  : (process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(__dirname, '../data/campaign.db'));

// Ensure directory exists where DB will be created (skip for in-memory)
if (DB_PATH !== ':memory:') {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Migration tracking table
db.prepare(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    executed_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

export function runMigrations(): void {
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    .sort();

  const executedMigrations = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[];
  const executedVersions = new Set(executedMigrations.map(m => m.version));

  for (const file of migrationFiles) {
    const version = parseInt(file.split('_')[0]);
    if (executedVersions.has(version)) continue;

    console.log(`Running migration: ${file}`);

    try {
      // Dynamic import of migration
      const migrationModule = require(path.join(migrationsDir, file));
      const migration = migrationModule.default || migrationModule;

      if (typeof migration.up === 'function') {
        db.transaction(() => {
          migration.up(db);
          db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(version, file);
        })();
        console.log(`✅ Migration ${file} completed successfully`);
      }
    } catch (error) {
      console.error(`❌ Migration ${file} failed:`, error);
      throw error;
    }
  }
}

export { db };