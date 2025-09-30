import Database from 'better-sqlite3';

export default {
  up: (db: any) => {
    // Add character_type column to characters table
    const tableInfo = db.prepare("PRAGMA table_info(characters)").all() as any[];
    const existingColumns = tableInfo.map(col => col.name);

    if (!existingColumns.includes('character_type')) {
      db.prepare('ALTER TABLE characters ADD COLUMN character_type TEXT DEFAULT \'pc\'').run();
    }

    // Add npc_relationships column for NPC relationship tracking
    if (!existingColumns.includes('npc_relationships')) {
      db.prepare('ALTER TABLE characters ADD COLUMN npc_relationships TEXT').run();
    }

    // Update existing characters: if they have a 'role' field, mark as NPC
    db.prepare(`
      UPDATE characters
      SET character_type = 'npc'
      WHERE role IS NOT NULL AND length(trim(role)) > 0
    `).run();

    // Create index for character_type
    db.prepare('CREATE INDEX IF NOT EXISTS idx_characters_type ON characters(character_type)').run();
  }
};