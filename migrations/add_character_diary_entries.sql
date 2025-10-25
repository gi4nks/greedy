-- Migration: Add character_diary_entries table
-- Date: 2025-10-25
-- Description: Adds a new table to store diary entries for characters with narrative tracking

-- Create character_diary_entries table
CREATE TABLE IF NOT EXISTS character_diary_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  linked_entities TEXT, -- JSON array of {id, type, name}
  is_important INTEGER DEFAULT 0, -- 0 = false, 1 = true
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_diary_character ON character_diary_entries(character_id);
CREATE INDEX IF NOT EXISTS idx_diary_date ON character_diary_entries(date);

-- Note: This migration is non-destructive and only adds new functionality.
-- Existing data is not affected.
