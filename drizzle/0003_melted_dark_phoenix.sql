CREATE TABLE `class_events` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`author_id` text,
	`subject` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`due_at` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "class_events_kind_check" CHECK("class_events"."kind" in ('task','test')),
	CONSTRAINT "class_events_status_check" CHECK("class_events"."status" in ('active','cancelled'))
);
--> statement-breakpoint
CREATE INDEX `class_events_due_idx` ON `class_events` (`class_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `class_event_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source_event_id` text NOT NULL,
	`event_id` text,
	`snapshot` text NOT NULL,
	`semester_id` text NOT NULL,
	`subject_id` text DEFAULT '' NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`reminder` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`detached_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `class_events`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `class_subscriptions_user_event_idx` ON `class_event_subscriptions` (`user_id`,`source_event_id`);--> statement-breakpoint
CREATE INDEX `class_subscriptions_event_idx` ON `class_event_subscriptions` (`event_id`);

--> statement-breakpoint
-- All snapshot updates/detachments share the originating mutation's transaction.
CREATE TRIGGER class_event_snapshot_update AFTER UPDATE ON class_events BEGIN
  UPDATE class_event_subscriptions SET snapshot = (SELECT json_object('id',e.id,'classId',e.class_id,'className',c.name,'authorId',e.author_id,'authorName',COALESCE(m.display_name,'Ex membro'),'subject',e.subject,'kind',e.kind,'title',e.title,'description',e.description,'dueAt',e.due_at,'status',e.status,'revision',e.revision,'updatedAt',e.updated_at) FROM class_events e JOIN classes c ON c.id=e.class_id LEFT JOIN class_members m ON m.class_id=e.class_id AND m.user_id=e.author_id WHERE e.id=NEW.id)
  WHERE event_id=NEW.id;
END;
--> statement-breakpoint
CREATE TRIGGER class_event_snapshot_delete BEFORE DELETE ON class_events BEGIN
  UPDATE class_event_subscriptions SET snapshot=json_set(snapshot,'$.status','cancelled'), event_id=NULL, detached_at=CAST(unixepoch('subsec')*1000 AS INTEGER), revision=revision+1 WHERE event_id=OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER class_member_detach BEFORE DELETE ON class_members BEGIN
  UPDATE class_event_subscriptions SET snapshot=(SELECT json_object('id',e.id,'classId',e.class_id,'className',c.name,'authorId',e.author_id,'authorName',COALESCE(m.display_name,'Ex membro'),'subject',e.subject,'kind',e.kind,'title',e.title,'description',e.description,'dueAt',e.due_at,'status',e.status,'revision',e.revision,'updatedAt',e.updated_at) FROM class_events e JOIN classes c ON c.id=e.class_id LEFT JOIN class_members m ON m.class_id=e.class_id AND m.user_id=e.author_id WHERE e.id=event_id),
    event_id=NULL, detached_at=CAST(unixepoch('subsec')*1000 AS INTEGER), revision=revision+1
  WHERE user_id=OLD.user_id AND event_id IN (SELECT id FROM class_events WHERE class_id=OLD.class_id)
    AND EXISTS (SELECT 1 FROM classes WHERE id=OLD.class_id);
END;
--> statement-breakpoint
CREATE TRIGGER class_delete_detach BEFORE DELETE ON classes BEGIN
  UPDATE class_event_subscriptions SET snapshot=(SELECT json_object('id',e.id,'classId',e.class_id,'className',c.name,'authorId',e.author_id,'authorName',COALESCE(m.display_name,'Ex membro'),'subject',e.subject,'kind',e.kind,'title',e.title,'description',e.description,'dueAt',e.due_at,'status',e.status,'revision',e.revision,'updatedAt',e.updated_at) FROM class_events e JOIN classes c ON c.id=e.class_id LEFT JOIN class_members m ON m.class_id=e.class_id AND m.user_id=e.author_id WHERE e.id=event_id),
    event_id=NULL, detached_at=CAST(unixepoch('subsec')*1000 AS INTEGER), revision=revision+1
  WHERE event_id IN (SELECT id FROM class_events WHERE class_id=OLD.id);
END;
--> statement-breakpoint
CREATE TRIGGER class_rename_snapshot AFTER UPDATE OF name ON classes BEGIN
  UPDATE class_event_subscriptions SET snapshot=json_set(snapshot,'$.className',NEW.name)
  WHERE event_id IN (SELECT id FROM class_events WHERE class_id=NEW.id);
END;
