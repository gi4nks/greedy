import Database from 'better-sqlite3';

export default {
  up: (db: any) => {
    // Add classes column to characters table for multiclass support
    const tableInfo = db.prepare("PRAGMA table_info(characters)").all() as any[];
    const existingColumns = tableInfo.map(col => col.name);

    if (!existingColumns.includes('classes')) {
      db.prepare('ALTER TABLE characters ADD COLUMN classes TEXT').run();
    }
  }
};