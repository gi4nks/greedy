import Database from 'better-sqlite3';

export default {
  up: (db: any) => {
    // campaigns table
    db.prepare(`
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
    `).run();

    // Add campaign_id to adventures table to link adventures to campaigns
    db.prepare(`
      ALTER TABLE adventures ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL
    `).run();

    // Create indexes for better performance
    db.prepare('CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_campaigns_title ON campaigns(title)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_adventures_campaign ON adventures(campaign_id)').run();
  }
};