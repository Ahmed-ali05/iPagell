CREATE TABLE `class_note_pins` (
	`note_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`note_id`, `user_id`),
	FOREIGN KEY (`note_id`) REFERENCES `class_notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `class_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text,
	`class_name` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`subject_id` text NOT NULL,
	`subject_name` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`byte_size` integer NOT NULL,
	`last_mutation_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `class_notes_class_idx` ON `class_notes` (`class_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `class_notes_author_idx` ON `class_notes` (`author_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `class_subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `class_subjects_name_idx` ON `class_subjects` (`class_id`,`name_key`);--> statement-breakpoint
CREATE INDEX `class_subjects_class_idx` ON `class_subjects` (`class_id`);--> statement-breakpoint
CREATE TABLE `personal_note_sequences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `personal_notes` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`subject_name` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`pinned` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`change_seq` integer DEFAULT 0 NOT NULL,
	`byte_size` integer NOT NULL,
	`last_mutation_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `personal_notes_changes_idx` ON `personal_notes` (`user_id`,`change_seq`);
--> statement-breakpoint
-- Old event labels remain free text. Seed a separate class subject list once;
-- created_at=0 marks labels exempt from the post-migration 60-subject quota.
INSERT OR IGNORE INTO class_subjects (id,class_id,name,name_key,revision,archived_at,created_at,updated_at)
SELECT 'legacy-' || min(e.id), e.class_id,
       trim(e.subject), lower(trim(e.subject)), 1, NULL, 0, 0
FROM class_events e WHERE length(trim(e.subject)) > 0
GROUP BY e.class_id, lower(trim(e.subject));
--> statement-breakpoint
CREATE TRIGGER personal_notes_quota_insert BEFORE INSERT ON personal_notes
WHEN NEW.deleted_at IS NULL AND (
  (SELECT count(*) FROM personal_notes WHERE user_id=NEW.user_id AND deleted_at IS NULL) >= 500 OR
  (SELECT coalesce(sum(byte_size),0) FROM personal_notes WHERE user_id=NEW.user_id AND deleted_at IS NULL)+NEW.byte_size > 8388608
) BEGIN SELECT RAISE(ABORT,'NOTES_LIMIT'); END;
--> statement-breakpoint
CREATE TRIGGER personal_notes_quota_update BEFORE UPDATE OF title,content,subject_id,subject_name,pinned,deleted_at,byte_size ON personal_notes
WHEN NEW.deleted_at IS NULL AND (
  (SELECT count(*) FROM personal_notes WHERE user_id=NEW.user_id AND deleted_at IS NULL AND id<>NEW.id) >= 500 OR
  (SELECT coalesce(sum(byte_size),0) FROM personal_notes WHERE user_id=NEW.user_id AND deleted_at IS NULL AND id<>NEW.id)+NEW.byte_size > 8388608
) BEGIN SELECT RAISE(ABORT,'NOTES_LIMIT'); END;
--> statement-breakpoint
CREATE TRIGGER personal_notes_sequence_insert AFTER INSERT ON personal_notes BEGIN
  INSERT INTO personal_note_sequences (user_id,seq) VALUES (NEW.user_id,1)
  ON CONFLICT(user_id) DO UPDATE SET seq=seq+1;
  UPDATE personal_notes SET change_seq=(SELECT seq FROM personal_note_sequences WHERE user_id=NEW.user_id)
  WHERE user_id=NEW.user_id AND id=NEW.id;
END;
--> statement-breakpoint
CREATE TRIGGER personal_notes_sequence_update AFTER UPDATE OF title,content,subject_id,subject_name,pinned,deleted_at ON personal_notes BEGIN
  INSERT INTO personal_note_sequences (user_id,seq) VALUES (NEW.user_id,1)
  ON CONFLICT(user_id) DO UPDATE SET seq=seq+1;
  UPDATE personal_notes SET change_seq=(SELECT seq FROM personal_note_sequences WHERE user_id=NEW.user_id)
  WHERE user_id=NEW.user_id AND id=NEW.id;
END;
--> statement-breakpoint
CREATE TRIGGER class_notes_quota_insert BEFORE INSERT ON class_notes
WHEN NEW.deleted_at IS NULL AND NEW.class_id IS NOT NULL AND (
  (SELECT count(*) FROM class_notes WHERE class_id=NEW.class_id AND deleted_at IS NULL) >= 200 OR
  (SELECT coalesce(sum(byte_size),0) FROM class_notes WHERE class_id=NEW.class_id AND deleted_at IS NULL)+NEW.byte_size > 4194304
) BEGIN SELECT RAISE(ABORT,'NOTES_LIMIT'); END;
--> statement-breakpoint
CREATE TRIGGER class_notes_quota_update BEFORE UPDATE OF title,content,subject_id,subject_name,deleted_at,byte_size ON class_notes
WHEN NEW.deleted_at IS NULL AND NEW.class_id IS NOT NULL AND (
  (SELECT count(*) FROM class_notes WHERE class_id=NEW.class_id AND deleted_at IS NULL AND id<>NEW.id) >= 200 OR
  (SELECT coalesce(sum(byte_size),0) FROM class_notes WHERE class_id=NEW.class_id AND deleted_at IS NULL AND id<>NEW.id)+NEW.byte_size > 4194304
) BEGIN SELECT RAISE(ABORT,'NOTES_LIMIT'); END;
--> statement-breakpoint
-- A cached older client may still create free-text event subjects.
CREATE TRIGGER class_subjects_from_events AFTER INSERT ON class_events
WHEN length(trim(NEW.subject))>0 BEGIN
  INSERT OR IGNORE INTO class_subjects(id,class_id,name,name_key,revision,archived_at,created_at,updated_at)
  VALUES('legacy-' || NEW.id,NEW.class_id,trim(NEW.subject),lower(trim(NEW.subject)),1,NULL,0,0);
END;
