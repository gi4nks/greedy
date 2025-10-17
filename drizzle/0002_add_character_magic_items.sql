CREATE TABLE `character_magic_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character_id` integer NOT NULL,
	`magic_item_id` integer NOT NULL,
	`is_attuned` integer DEFAULT false,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`magic_item_id`) REFERENCES `magic_items`(`id`) ON UPDATE no action ON DELETE cascade
);