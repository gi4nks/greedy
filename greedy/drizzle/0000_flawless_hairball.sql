CREATE TABLE `adventures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer,
	`slug` text,
	`title` text NOT NULL,
	`description` text,
	`start_date` text,
	`end_date` text,
	`status` text DEFAULT 'active',
	`images` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_edition_id` integer DEFAULT 1,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active',
	`start_date` text,
	`end_date` text,
	`tags` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`game_edition_id`) REFERENCES `game_editions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer,
	`adventure_id` integer,
	`character_type` text DEFAULT 'pc',
	`name` text NOT NULL,
	`race` text,
	`class` text,
	`level` integer DEFAULT 1,
	`background` text,
	`alignment` text,
	`experience` integer DEFAULT 0,
	`strength` integer DEFAULT 10,
	`dexterity` integer DEFAULT 10,
	`constitution` integer DEFAULT 10,
	`intelligence` integer DEFAULT 10,
	`wisdom` integer DEFAULT 10,
	`charisma` integer DEFAULT 10,
	`hit_points` integer DEFAULT 0,
	`max_hit_points` integer DEFAULT 0,
	`armor_class` integer DEFAULT 10,
	`initiative` integer DEFAULT 0,
	`speed` integer DEFAULT 30,
	`proficiency_bonus` integer DEFAULT 2,
	`saving_throws` text,
	`skills` text,
	`equipment` text,
	`weapons` text,
	`spells` text,
	`spellcasting_ability` text,
	`spell_save_dc` integer,
	`spell_attack_bonus` integer,
	`personality_traits` text,
	`ideals` text,
	`bonds` text,
	`flaws` text,
	`backstory` text,
	`role` text,
	`npc_relationships` text,
	`classes` text,
	`description` text,
	`tags` text,
	`images` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`adventure_id`) REFERENCES `adventures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `game_editions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`version` text,
	`publisher` text,
	`is_active` integer DEFAULT true,
	`import_sources` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_editions_code_unique` ON `game_editions` (`code`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`adventure_id` integer,
	`name` text NOT NULL,
	`description` text,
	`notes` text,
	`tags` text,
	`images` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`adventure_id`) REFERENCES `adventures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `magic_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`rarity` text,
	`type` text,
	`description` text,
	`properties` text,
	`attunement_required` integer DEFAULT false,
	`images` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`adventure_id` integer,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active',
	`priority` text DEFAULT 'medium',
	`type` text DEFAULT 'main',
	`due_date` text,
	`assigned_to` text,
	`tags` text,
	`images` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`adventure_id`) REFERENCES `adventures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer,
	`entry_type` text NOT NULL,
	`timestamp` text,
	`content` text NOT NULL,
	`characters_mentioned` text,
	`locations_mentioned` text,
	`items_mentioned` text,
	`quests_mentioned` text,
	`tags` text,
	`is_summary` integer DEFAULT false,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`adventure_id` integer,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`text` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`adventure_id`) REFERENCES `adventures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer,
	`event_type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`game_date` text,
	`real_date` text NOT NULL,
	`session_id` integer,
	`related_entities` text,
	`importance_level` integer DEFAULT 3,
	`tags` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE set null
);
