const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(__dirname, 'campaign.db');
// Ensure directory exists where DB will be created
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const exists = fs.existsSync(DB_PATH);

const db = new Database(DB_PATH);

function migrate() {
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

  // npcs
  db.prepare(`
    CREATE TABLE IF NOT EXISTS npcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adventure_id INTEGER,
      name TEXT,
      role TEXT,
      description TEXT,
      tags TEXT,
      FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE SET NULL
    )
  `).run();

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

  // Seed sample adventures if none exist
  const count = db.prepare('SELECT COUNT(*) as c FROM adventures').get().c;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO adventures (slug, title, description) VALUES (?, ?, ?)');
    insert.run('saltmarsh', 'Ghosts of Saltmarsh', 'A coastal adventure.');
    insert.run('pharaoh', 'Tomb of Annihilation / Pharaoh', 'Ancient tombs and curses.');
  }
}

module.exports = { db, migrate };
