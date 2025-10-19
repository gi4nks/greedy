CREATE TABLE `npcs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`adventure_id` integer,
	`name` text NOT NULL,
	`role` text,
	`description` text,
	`tags` text,
	`images` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`adventure_id`) REFERENCES `adventures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `images` text;--> statement-breakpoint
ALTER TABLE `characters` DROP COLUMN `class`;