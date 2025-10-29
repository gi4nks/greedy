-- Add character diary entries table
CREATE TABLE IF NOT EXISTS `character_diary_entries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `character_id` integer NOT NULL,
  `description` text NOT NULL,
  `date` text NOT NULL,
  `linked_entities` text,
  `is_important` integer DEFAULT 0,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS `idx_diary_character` ON `character_diary_entries` (`character_id`);
CREATE INDEX IF NOT EXISTS `idx_diary_date` ON `character_diary_entries` (`date`);
