-- Add diary entries tables for locations and quests
CREATE TABLE IF NOT EXISTS `location_diary_entries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `location_id` integer NOT NULL,
  `description` text NOT NULL,
  `date` text NOT NULL,
  `linked_entities` text,
  `is_important` integer DEFAULT 0,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS `idx_location_diary_location` ON `location_diary_entries` (`location_id`);
CREATE INDEX IF NOT EXISTS `idx_location_diary_date` ON `location_diary_entries` (`date`);

CREATE TABLE IF NOT EXISTS `quest_diary_entries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `quest_id` integer NOT NULL,
  `description` text NOT NULL,
  `date` text NOT NULL,
  `linked_entities` text,
  `is_important` integer DEFAULT 0,
  `created_at` text DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS `idx_quest_diary_quest` ON `quest_diary_entries` (`quest_id`);
CREATE INDEX IF NOT EXISTS `idx_quest_diary_date` ON `quest_diary_entries` (`date`);