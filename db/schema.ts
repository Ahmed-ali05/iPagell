import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  recoveryHash: text("recovery_hash").notNull(),
  authVersion: integer("auth_version").notNull().default(1),
  authOperationId: text("auth_operation_id"),
  createdAt: integer("created_at").notNull(),
});
export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    authVersion: integer("auth_version").notNull(),
    expiresAt: integer("expires_at").notNull(),
    // Device list metadata (0009). Nullable: rows issued before 0009, or by
    // older code during a rollout, have none. Never an IP or raw User-Agent.
    createdAt: integer("created_at"),
    lastSeenAt: integer("last_seen_at"),
    method: text("method"),
    client: text("client"),
  },
  (table) => [
    index("sessions_user_idx").on(table.userId),
    index("sessions_expiry_idx").on(table.expiresAt),
  ],
);
export const authLimits = sqliteTable(
  "auth_limits",
  {
    key: text("key").primaryKey(),
    attempts: integer("attempts").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [index("limits_expiry_idx").on(table.expiresAt)],
);

// One validated, versioned diary per authenticated identity. Atomic snapshots
// avoid partially restored imports and permit compare-and-swap synchronization.
export const diaries = sqliteTable("diaries", {
  userId: text("user_id").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Shared class data stays normalized and outside the private diary payload.
// Class routes remain gated until the first complete member flow is ready.
export const classes = sqliteTable(
  "classes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    ownerId: text("owner_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    settings: text("settings").notNull().default("{}"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("classes_owner_idx").on(table.ownerId)],
);

export const classMembers = sqliteTable(
  "class_members",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    displayName: text("display_name").notNull(),
    joinedAt: integer("joined_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.classId, table.userId] }),
    index("class_members_user_idx").on(table.userId),
    uniqueIndex("class_members_single_owner_idx")
      .on(table.classId)
      .where(sql`${table.role} = 'owner'`),
    check(
      "class_members_role_check",
      sql`${table.role} in ('owner', 'moderator', 'member')`,
    ),
  ],
);

export const classInvites = sqliteTable(
  "class_invites",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    secretHash: text("secret_hash").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    expiresAt: integer("expires_at"),
    maxUses: integer("max_uses").notNull().default(50),
    uses: integer("uses").notNull().default(0),
    revokedAt: integer("revoked_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("class_invites_secret_hash_idx").on(table.secretHash),
    index("class_invites_class_idx").on(table.classId),
    check("class_invites_max_uses_check", sql`${table.maxUses} > 0`),
    check(
      "class_invites_uses_check",
      sql`${table.uses} >= 0 and ${table.uses} <= ${table.maxUses}`,
    ),
  ],
);

export const classEvents = sqliteTable("class_events", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => accounts.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  dueAt: text("due_at").notNull(),
  status: text("status").notNull().default("active"),
  revision: integer("revision").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => [index("class_events_due_idx").on(t.classId, t.dueAt),
  check("class_events_kind_check", sql`${t.kind} in ('task','test')`),
  check("class_events_status_check", sql`${t.status} in ('active','cancelled')`)]);

export const classDepartures = sqliteTable("class_departures", {
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  departedAt: integer("departed_at").notNull(),
}, (t) => [primaryKey({ columns: [t.classId, t.userId] })]);

// Snapshot survives event/class deletion. Private preferences never enter class responses.
export const classSubscriptions = sqliteTable("class_event_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  sourceEventId: text("source_event_id").notNull(),
  eventId: text("event_id").references(() => classEvents.id, { onDelete: "set null" }),
  snapshot: text("snapshot").notNull(),
  semesterId: text("semester_id").notNull(),
  subjectId: text("subject_id").notNull().default(""),
  completed: integer("completed").notNull().default(0),
  reminder: integer("reminder").notNull().default(0),
  revision: integer("revision").notNull().default(1),
  detachedAt: integer("detached_at"),
}, (t) => [uniqueIndex("class_subscriptions_user_event_idx").on(t.userId, t.sourceEventId), index("class_subscriptions_event_idx").on(t.eventId)]);

// Notes intentionally live outside the version-one diary snapshot. Subject IDs
// are soft references because diary imports and subject deletion must not erase text.
export const personalNotes = sqliteTable("personal_notes", {
  id: text("id").notNull(),
  userId: text("user_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").notNull(),
  subjectName: text("subject_name").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentFormat: text("content_format", { enum: ["plain", "md-lite-v1"] }).notNull().default("plain"),
  pinned: integer("pinned").notNull().default(0),
  revision: integer("revision").notNull().default(1),
  changeSeq: integer("change_seq").notNull().default(0),
  byteSize: integer("byte_size").notNull(),
  lastMutationId: text("last_mutation_id").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  deletedAt: integer("deleted_at"),
}, (t) => [primaryKey({ columns: [t.userId, t.id] }), index("personal_notes_changes_idx").on(t.userId, t.changeSeq), check("personal_notes_format_check", sql`${t.contentFormat} IN ('plain','md-lite-v1')`)]);

export const personalNoteSequences = sqliteTable("personal_note_sequences", {
  userId: text("user_id").primaryKey().references(() => accounts.id, { onDelete: "cascade" }),
  seq: integer("seq").notNull().default(0),
});

export const classSubjects = sqliteTable("class_subjects", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameKey: text("name_key").notNull(),
  revision: integer("revision").notNull().default(1),
  archivedAt: integer("archived_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => [uniqueIndex("class_subjects_name_idx").on(t.classId, t.nameKey), index("class_subjects_class_idx").on(t.classId)]);

export const classNotes = sqliteTable("class_notes", {
  id: text("id").primaryKey(),
  classId: text("class_id").references(() => classes.id, { onDelete: "set null" }),
  className: text("class_name").notNull(),
  authorId: text("author_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  subjectId: text("subject_id").notNull(),
  subjectName: text("subject_name").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentFormat: text("content_format", { enum: ["plain", "md-lite-v1"] }).notNull().default("plain"),
  revision: integer("revision").notNull().default(1),
  byteSize: integer("byte_size").notNull(),
  lastMutationId: text("last_mutation_id").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  deletedAt: integer("deleted_at"),
}, (t) => [index("class_notes_class_idx").on(t.classId, t.updatedAt), index("class_notes_author_idx").on(t.authorId, t.updatedAt), check("class_notes_format_check", sql`${t.contentFormat} IN ('plain','md-lite-v1')`)]);

export const classNotePins = sqliteTable("class_note_pins", {
  noteId: text("note_id").notNull().references(() => classNotes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.noteId, t.userId] })]);

// W8-A expansion: reserved protocol tables remain unused until their rollout gates.
export const authSchemaState = sqliteTable("auth_schema_state", {
  id: integer("id").primaryKey(),
  schemaVersion: integer("schema_version").notNull(),
  writeMode: text("write_mode", { enum: ["legacy", "credentials", "paused"] }).notNull(),
}, t => [check("auth_schema_singleton", sql`${t.id}=1`),
  check("auth_schema_mode", sql`${t.writeMode} IN ('legacy','credentials','paused')`)]);
export const accountCredentials = sqliteTable("account_credentials", {
  accountId: text("account_id").primaryKey().references(() => accounts.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  recoveryHash: text("recovery_hash"),
  updatedAt: integer("updated_at").notNull(),
});
export const accountIdentities = sqliteTable("account_identities", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), issuer: text("issuer").notNull(), subject: text("subject").notNull(),
  status: text("status").notNull(), createdAt: integer("created_at").notNull(),
}, t => [uniqueIndex("identities_subject_unique").on(t.issuer,t.subject),
  uniqueIndex("identities_account_provider_unique").on(t.accountId,t.provider),
  check("identities_provider", sql`${t.provider} IN ('google','apple')`),
  check("identities_status", sql`${t.status} IN ('active','disabled')`)]);
export const accountEmails = sqliteTable("account_emails", {
  accountId: text("account_id").primaryKey().references(() => accounts.id, { onDelete: "cascade" }),
  email: text("email").notNull(), emailKey: text("email_key").notNull().unique(),
  verifiedAt: integer("verified_at").notNull(), status: text("status").notNull(),
}, t => [check("emails_status", sql`${t.status} IN ('deliverable','bounced')`)]);
export const authBrowserEpochs = sqliteTable("auth_browser_epochs", {
  bindingHash: text("binding_hash").primaryKey(), epoch: integer("epoch").notNull(),
  accountId: text("account_id").references(() => accounts.id, { onDelete: "set null" }),
  operationId: text("operation_id"), expiresAt: integer("expires_at").notNull(),
}, t => [index("browser_epochs_expiry").on(t.expiresAt)]);
export const authTransactions = sqliteTable("auth_transactions", {
  id: text("id").primaryKey(), stateHash: text("state_hash").notNull().unique(),
  bindingHash: text("binding_hash").notNull(), browserEpoch: integer("browser_epoch").notNull(),
  provider: text("provider").notNull(), purpose: text("purpose").notNull(),
  accountId: text("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  sessionHash: text("session_hash"), authVersion: integer("auth_version"),
  nonce: text("nonce").notNull(), pkceEncrypted: text("pkce_encrypted"), redirectUri: text("redirect_uri").notNull(),
  status: text("status").notNull(), expiresAt: integer("expires_at").notNull(), operationId: text("operation_id"),
}, t => [index("transactions_expiry").on(t.expiresAt), index("transactions_browser").on(t.bindingHash),
  check("transactions_provider", sql`${t.provider} IN ('google','apple')`),
  check("transactions_purpose", sql`${t.purpose} IN ('login','link','reauth')`),
  check("transactions_status", sql`${t.status} IN ('pending','processing','verified','consumed','failed')`)]);
export const authChallenges = sqliteTable("auth_challenges", {
  tokenHash: text("token_hash").primaryKey(), purpose: text("purpose").notNull(),
  accountId: text("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  authVersion: integer("auth_version"), email: text("email").notNull(),
  expiresAt: integer("expires_at").notNull(), usedAt: integer("used_at"), operationId: text("operation_id"),
}, t => [index("challenges_expiry").on(t.expiresAt),
  check("challenges_purpose", sql`${t.purpose} IN ('verify','signup','reset')`)]);
export const authGrants = sqliteTable("auth_grants", {
  tokenHash: text("token_hash").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  sessionHash: text("session_hash").notNull(), authVersion: integer("auth_version").notNull(),
  method: text("method").notNull(), operation: text("operation").notNull(), target: text("target").notNull(),
  expiresAt: integer("expires_at").notNull(), consumedBy: text("consumed_by"),
}, t => [index("grants_expiry").on(t.expiresAt)]);
