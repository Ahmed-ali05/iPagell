CREATE TABLE `class_departures` (
	`class_id` text NOT NULL,
	`user_id` text NOT NULL,
	`departed_at` integer NOT NULL,
	PRIMARY KEY(`class_id`, `user_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TRIGGER class_member_departure BEFORE DELETE ON class_members BEGIN
  INSERT INTO class_departures (class_id,user_id,departed_at)
  SELECT OLD.class_id,OLD.user_id,CAST(unixepoch('subsec')*1000 AS INTEGER)
  WHERE EXISTS (SELECT 1 FROM classes WHERE id=OLD.class_id) AND EXISTS (SELECT 1 FROM accounts WHERE id=OLD.user_id)
  ON CONFLICT(class_id,user_id) DO UPDATE SET departed_at=excluded.departed_at;
END;
