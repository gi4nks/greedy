-- Migration: Add campaign_id and narrative fields to sessions table
-- This adds direct campaign association and a separate field for the "romanced" narrative version
-- Run this migration manually on production before deploying the new code

-- Add the campaign_id column to sessions table (direct campaign reference)
ALTER TABLE sessions ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id);

-- Add the narrative column to sessions table
ALTER TABLE sessions ADD COLUMN narrative TEXT;

-- Add the promoted_to column to sessions table (JSON array of promoted entities)
ALTER TABLE sessions ADD COLUMN promoted_to TEXT;

-- Optional: Backfill campaign_id from adventure relationship
-- UPDATE sessions SET campaign_id = (
--   SELECT adventures.campaign_id FROM adventures WHERE adventures.id = sessions.adventure_id
-- ) WHERE adventure_id IS NOT NULL;
