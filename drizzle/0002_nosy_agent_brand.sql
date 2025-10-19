CREATE TABLE `character_magic_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character_id` integer NOT NULL,
	`magic_item_id` integer NOT NULL,
	`is_attuned` integer DEFAULT false,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`magic_item_id`) REFERENCES `magic_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character_wiki_monsters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character_id` integer NOT NULL,
	`monster_id` integer NOT NULL,
	`relationship_type` text DEFAULT 'companion',
	`notes` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`monster_id`) REFERENCES `wiki_monsters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character_wiki_spells` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character_id` integer NOT NULL,
	`spell_id` integer NOT NULL,
	`is_prepared` integer DEFAULT false,
	`is_known` integer DEFAULT true,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spell_id`) REFERENCES `wiki_spells`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `wiki_article_entities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wiki_article_id` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`relationship_type` text,
	`relationship_data` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`wiki_article_id`) REFERENCES `wiki_articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `wiki_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content_type` text NOT NULL,
	`wiki_url` text,
	`raw_content` text,
	`parsed_data` text,
	`imported_from` text DEFAULT 'wiki',
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `wiki_monsters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`challenge_rating` text,
	`armor_class` integer,
	`hit_points` integer,
	`speed` text,
	`abilities` text,
	`description` text,
	`wiki_url` text,
	`imported_from` text DEFAULT 'wiki',
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `wiki_spells` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`level` integer DEFAULT 1,
	`school` text,
	`range` text,
	`duration` text,
	`casting_time` text,
	`components` text,
	`description` text,
	`wiki_url` text,
	`imported_from` text DEFAULT 'wiki',
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
