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
