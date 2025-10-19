-- Create relations table
CREATE TABLE relations (
    id integer PRIMARY KEY AUTOINCREMENT,
    campaign_id integer NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    source_entity_type text NOT NULL,
    source_entity_id integer NOT NULL,
    target_entity_type text NOT NULL,
    target_entity_id integer NOT NULL,
    relation_type text NOT NULL,
    description text,
    bidirectional integer DEFAULT 0,
    metadata text,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_relations_campaign ON relations(campaign_id);
CREATE INDEX idx_relations_source ON relations(source_entity_type, source_entity_id);
CREATE INDEX idx_relations_target ON relations(target_entity_type, target_entity_id);

-- Create unique constraint to prevent duplicate relations
CREATE UNIQUE INDEX uniq_relation ON relations(
    campaign_id,
    source_entity_type,
    source_entity_id,
    target_entity_type,
    target_entity_id,
    relation_type
);