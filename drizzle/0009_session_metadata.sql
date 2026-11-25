-- Phase A (25 Nov 2026): device list metadata for sessions. Additive and nullable:
-- code issued before this migration keeps inserting the four original columns.
ALTER TABLE `sessions` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `sessions` ADD `last_seen_at` integer;--> statement-breakpoint
ALTER TABLE `sessions` ADD `method` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `client` text;--> statement-breakpoint
-- Existing sessions: the TTL has always been a fixed 14 days, so the start is exact.
-- Only UPDATE on sessions; accounts is read, never written. client stays NULL.
UPDATE `sessions` SET
  `created_at` = `expires_at` - 1209600000,
  `method` = CASE WHEN EXISTS(SELECT 1 FROM `accounts` a WHERE a.`id` = `sessions`.`user_id` AND a.`password_hash` = 'none$google') THEN 'google' ELSE 'password' END
WHERE `created_at` IS NULL;
