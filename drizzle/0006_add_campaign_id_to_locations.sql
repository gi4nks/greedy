-- Add campaign_id column to locations table and drop notes column
ALTER TABLE locations ADD COLUMN campaign_id integer REFERENCES campaigns(id);
ALTER TABLE locations DROP COLUMN notes;