CREATE TABLE `class_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`secret_hash` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` integer,
	`max_uses` integer DEFAULT 50 NOT NULL,
	`uses` integer DEFAULT 0 NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "class_invites_max_uses_check" CHECK("class_invites"."max_uses" > 0),
	CONSTRAINT "class_invites_uses_check" CHECK("class_invites"."uses" >= 0 and "class_invites"."uses" <= "class_invites"."max_uses")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `class_invites_secret_hash_idx` ON `class_invites` (`secret_hash`);--> statement-breakpoint
CREATE INDEX `class_invites_class_idx` ON `class_invites` (`class_id`);--> statement-breakpoint
CREATE TABLE `class_members` (
	`class_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`display_name` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`class_id`, `user_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "class_members_role_check" CHECK("class_members"."role" in ('owner', 'moderator', 'member'))
);
--> statement-breakpoint
CREATE INDEX `class_members_user_idx` ON `class_members` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `class_members_single_owner_idx` ON `class_members` (`class_id`) WHERE "class_members"."role" = 'owner';--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`owner_id` text NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `classes_owner_idx` ON `classes` (`owner_id`);