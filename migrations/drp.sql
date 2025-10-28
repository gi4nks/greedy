-- Drop character detail columns from characters table
ALTER TABLE characters DROP COLUMN saving_throws;
ALTER TABLE characters DROP COLUMN skills;
ALTER TABLE characters DROP COLUMN weapons;
ALTER TABLE characters DROP COLUMN spells;
ALTER TABLE characters DROP COLUMN spellcasting_ability;
ALTER TABLE characters DROP COLUMN spell_save_dc;
ALTER TABLE characters DROP COLUMN spell_attack_bonus;
ALTER TABLE characters DROP COLUMN personality_traits;
ALTER TABLE characters DROP COLUMN ideals;
ALTER TABLE characters DROP COLUMN bonds;
ALTER TABLE characters DROP COLUMN flaws;
ALTER TABLE characters DROP COLUMN backstory;
ALTER TABLE characters DROP COLUMN npc_relationships;