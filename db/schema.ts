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
