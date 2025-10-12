CREATE TABLE IF NOT EXISTS `magic_item_assignments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `magic_item_id` integer NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` integer NOT NULL,
  `campaign_id` integer,
  `source` text DEFAULT 'manual',
  `notes` text,
  `metadata` text,
  `assigned_at` text DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `uniq_magic_item_assignment` UNIQUE(`magic_item_id`, `entity_type`, `entity_id`),
  FOREIGN KEY (`magic_item_id`) REFERENCES `magic_items`(`id`) ON DELETE cascade ON UPDATE no action,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS `idx_magic_item_assignments_magic_item` ON `magic_item_assignments` (`magic_item_id`);
CREATE INDEX IF NOT EXISTS `idx_magic_item_assignments_entity` ON `magic_item_assignments` (`entity_type`, `entity_id`);
CREATE INDEX IF NOT EXISTS `idx_magic_item_assignments_campaign` ON `magic_item_assignments` (`campaign_id`);

INSERT OR IGNORE INTO `magic_item_assignments` (
  `magic_item_id`,
  `entity_type`,
  `entity_id`,
  `campaign_id`,
  `source`,
  `assigned_at`
)
SELECT
  cmi.`magic_item_id`,
  'character',
  cmi.`character_id`,
  characters.`campaign_id`,
  'manual',
  COALESCE(cmi.`created_at`, CURRENT_TIMESTAMP)
FROM `character_magic_items` AS cmi
LEFT JOIN `characters` ON characters.`id` = cmi.`character_id`;
