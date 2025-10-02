import Database from 'better-sqlite3';

export default {
  up: (db: any) => {
    // Add image_path column to adventures table
    db.prepare(`
      ALTER TABLE adventures ADD COLUMN image_path TEXT
    `).run();

    // Add image_path column to sessions table
    db.prepare(`
      ALTER TABLE sessions ADD COLUMN image_path TEXT
    `).run();

    // Add image_path column to quests table
    db.prepare(`
      ALTER TABLE quests ADD COLUMN image_path TEXT
    `).run();

    // Add image_path column to characters table (covers PCs, NPCs, monsters)
    db.prepare(`
      ALTER TABLE characters ADD COLUMN image_path TEXT
    `).run();

    // Add image_path column to magic_items table
    db.prepare(`
      ALTER TABLE magic_items ADD COLUMN image_path TEXT
    `).run();
  },

  down: (db: any) => {
    // Note: SQLite doesn't support dropping columns, so we leave the columns in place
    // In a production environment, you'd need to recreate tables without the columns
  }
};