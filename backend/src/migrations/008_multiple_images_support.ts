import Database from 'better-sqlite3';

export default {
  up: (db: any) => {
    // Create new entity_images table for multiple images per entity
    db.prepare(`
      CREATE TABLE IF NOT EXISTS entity_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entity_type, entity_id, image_path)
      )
    `).run();

    // Create indexes for better performance
    db.prepare('CREATE INDEX IF NOT EXISTS idx_entity_images_entity ON entity_images(entity_type, entity_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_entity_images_order ON entity_images(display_order)').run();

    // Migrate existing image data to new table
    const tables = [
      { name: 'adventures', type: 'adventures' },
      { name: 'sessions', type: 'sessions' }
    ];

    const insertImage = db.prepare(`
      INSERT INTO entity_images (entity_type, entity_id, image_path, display_order)
      VALUES (?, ?, ?, 0)
    `);

    for (const table of tables) {
      const rows = db.prepare(`SELECT id, image_path FROM ${table.name} WHERE image_path IS NOT NULL`).all() as any[];
      for (const row of rows) {
        if (row.image_path) {
          insertImage.run(table.type, row.id, row.image_path);
        }
      }
    }
  },

  down: (db: any) => {
    // Drop the new table
    db.prepare('DROP TABLE IF EXISTS entity_images').run();
  }
};