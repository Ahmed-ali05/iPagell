CREATE TABLE `account_credentials` (
	`account_id` text PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`recovery_hash` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `account_emails` (
	`account_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_key` text NOT NULL,
	`verified_at` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "emails_status" CHECK("account_emails"."status" IN ('deliverable','bounced'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_emails_email_key_unique` ON `account_emails` (`email_key`);--> statement-breakpoint
CREATE TABLE `account_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider` text NOT NULL,
	`issuer` text NOT NULL,
	`subject` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "identities_provider" CHECK("account_identities"."provider" IN ('google','apple')),
	CONSTRAINT "identities_status" CHECK("account_identities"."status" IN ('active','disabled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identities_subject_unique` ON `account_identities` (`issuer`,`subject`);--> statement-breakpoint
CREATE UNIQUE INDEX `identities_account_provider_unique` ON `account_identities` (`account_id`,`provider`);--> statement-breakpoint
CREATE TABLE `auth_browser_epochs` (
	`binding_hash` text PRIMARY KEY NOT NULL,
	`epoch` integer NOT NULL,
	`account_id` text,
	`operation_id` text,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `browser_epochs_expiry` ON `auth_browser_epochs` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_challenges` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`purpose` text NOT NULL,
	`account_id` text,
	`auth_version` integer,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`operation_id` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "challenges_purpose" CHECK("auth_challenges"."purpose" IN ('verify','signup','reset'))
);
--> statement-breakpoint
CREATE INDEX `challenges_expiry` ON `auth_challenges` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_grants` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`session_hash` text NOT NULL,
	`auth_version` integer NOT NULL,
	`method` text NOT NULL,
	`operation` text NOT NULL,
	`target` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_by` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `grants_expiry` ON `auth_grants` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_schema_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`schema_version` integer NOT NULL,
	`write_mode` text NOT NULL,
	CONSTRAINT "auth_schema_singleton" CHECK("auth_schema_state"."id"=1),
	CONSTRAINT "auth_schema_mode" CHECK("auth_schema_state"."write_mode" IN ('legacy','credentials','paused'))
);
--> statement-breakpoint
CREATE TABLE `auth_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`state_hash` text NOT NULL,
	`binding_hash` text NOT NULL,
	`browser_epoch` integer NOT NULL,
	`provider` text NOT NULL,
	`purpose` text NOT NULL,
	`account_id` text,
	`session_hash` text,
	`auth_version` integer,
	`nonce` text NOT NULL,
	`pkce_encrypted` text,
	`redirect_uri` text NOT NULL,
	`status` text NOT NULL,
	`expires_at` integer NOT NULL,
	`operation_id` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "transactions_provider" CHECK("auth_transactions"."provider" IN ('google','apple')),
	CONSTRAINT "transactions_purpose" CHECK("auth_transactions"."purpose" IN ('login','link','reauth')),
	CONSTRAINT "transactions_status" CHECK("auth_transactions"."status" IN ('pending','processing','verified','consumed','failed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_transactions_state_hash_unique` ON `auth_transactions` (`state_hash`);--> statement-breakpoint
CREATE INDEX `transactions_expiry` ON `auth_transactions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `transactions_browser` ON `auth_transactions` (`binding_hash`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `auth_operation_id` text;
--> statement-breakpoint
-- Schema only: initialization/backfill live in operations/w8a, outside Sites migrations.
-- Auth writes remain fenced until the explicit legacy initialization is completed.
CREATE TRIGGER auth_fence_accounts_insert BEFORE INSERT ON accounts
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_accounts_update BEFORE UPDATE ON accounts
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_accounts_delete BEFORE DELETE ON accounts
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_sessions_insert BEFORE INSERT ON sessions
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_account_credentials_insert BEFORE INSERT ON account_credentials
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_account_credentials_update BEFORE UPDATE ON account_credentials
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_account_credentials_delete BEFORE DELETE ON account_credentials
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_account_identities_insert BEFORE INSERT ON account_identities
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_account_identities_update BEFORE UPDATE ON account_identities
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_account_identities_delete BEFORE DELETE ON account_identities
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_account_emails_insert BEFORE INSERT ON account_emails
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_account_emails_update BEFORE UPDATE ON account_emails
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_account_emails_delete BEFORE DELETE ON account_emails
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_transactions_insert BEFORE INSERT ON auth_transactions
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_transactions_update BEFORE UPDATE ON auth_transactions
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_transactions_delete BEFORE DELETE ON auth_transactions
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_challenges_insert BEFORE INSERT ON auth_challenges
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_challenges_update BEFORE UPDATE ON auth_challenges
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_challenges_delete BEFORE DELETE ON auth_challenges
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_grants_insert BEFORE INSERT ON auth_grants
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_grants_update BEFORE UPDATE ON auth_grants
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_grants_delete BEFORE DELETE ON auth_grants
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_browser_epochs_insert BEFORE INSERT ON auth_browser_epochs
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_browser_epochs_update BEFORE UPDATE ON auth_browser_epochs
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_auth_browser_epochs_delete BEFORE DELETE ON auth_browser_epochs
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_class_invites_delete BEFORE DELETE ON class_invites
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
--> statement-breakpoint
CREATE TRIGGER auth_fence_diaries_delete BEFORE DELETE ON diaries
WHEN NOT EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND
  ((schema_version=7 AND write_mode='legacy') OR (schema_version=8 AND write_mode='credentials')))
BEGIN SELECT RAISE(ABORT,'AUTH_WRITES_PAUSED'); END;
