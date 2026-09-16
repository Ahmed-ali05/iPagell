import { env } from "cloudflare:workers";
import { database } from "@/lib/server/db";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const tableQueries = {
  accounts:
    "SELECT id,username,password_hash,recovery_hash,auth_version,created_at FROM accounts",
  diaries:
    "SELECT user_id,payload,revision,created_at,updated_at FROM diaries",
  classes:
    "SELECT id,name,description,owner_id,settings,created_at,updated_at FROM classes",
  class_members:
    "SELECT class_id,user_id,role,display_name,joined_at FROM class_members",
  class_invites:
    "SELECT id,class_id,secret_hash,created_by,expires_at,max_uses,uses,revoked_at,created_at FROM class_invites",
  class_events:
    "SELECT id,class_id,author_id,subject,kind,title,description,due_at,status,revision,created_at,updated_at FROM class_events",
  class_departures:
    "SELECT class_id,user_id,departed_at FROM class_departures",
  class_event_subscriptions:
    "SELECT id,user_id,source_event_id,event_id,snapshot,semester_id,subject_id,completed,reminder,revision,detached_at FROM class_event_subscriptions",
  sessions:
    "SELECT token_hash,user_id,auth_version,expires_at FROM sessions WHERE expires_at>?",
} as const;

type TableName = keyof typeof tableQueries;
type Row = Record<string, unknown>;
type MigrationPayload = {
  schemaVersion: 5;
  tables: Record<TableName, Row[]>;
};

async function digest(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function authorized(request: Request) {
  const expected = (env as unknown as { IPAGELL_MIGRATION_SECRET?: string })
    .IPAGELL_MIGRATION_SECRET;
  const supplied = request.headers.get("x-ipagell-migration-secret");
  if (!expected || !supplied) return false;
  const [left, right] = await Promise.all([digest(expected), digest(supplied)]);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index++)
    difference |= left[index % left.length] ^ right[index % right.length];
  return difference === 0;
}

function payload(value: unknown): MigrationPayload | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<MigrationPayload>;
  if (candidate.schemaVersion !== 5 || !candidate.tables) return null;
  if (!Object.keys(tableQueries).every((name) => Array.isArray(candidate.tables?.[name as TableName])))
    return null;
  return candidate as MigrationPayload;
}

function bindRows(
  rows: Row[],
  sql: string,
  columns: string[],
): D1PreparedStatement[] {
  const db = database();
  return rows.map((row) =>
    db.prepare(sql).bind(...columns.map((column) => row[column] ?? null)),
  );
}

export async function GET(request: Request) {
  if (!(await authorized(request))) return json({ error: "Non autorizzato" }, 404);
  const db = database();
  const names = Object.keys(tableQueries) as TableName[];
  const results = await db.batch(
    names.map((name) =>
      name === "sessions"
        ? db.prepare(tableQueries[name]).bind(Date.now())
        : db.prepare(tableQueries[name]),
    ),
  );
  const tables = Object.fromEntries(
    names.map((name, index) => [name, results[index].results]),
  ) as MigrationPayload["tables"];
  return json({ schemaVersion: 5, tables });
}

export async function POST(request: Request) {
  if (!(await authorized(request))) return json({ error: "Non autorizzato" }, 404);
  const input = payload(await request.json().catch(() => null));
  if (!input) return json({ error: "Esportazione non valida" }, 400);

  const db = database();
  const occupied = await db
    .prepare(
      "SELECT (SELECT count(*) FROM accounts)+(SELECT count(*) FROM diaries)+(SELECT count(*) FROM classes) AS total",
    )
    .first<{ total: number }>();
  if (Number(occupied?.total ?? 0) !== 0)
    return json({ error: "Il database di destinazione non è vuoto" }, 409);

  const statements = [
    ...bindRows(
      input.tables.accounts,
      "INSERT INTO accounts (id,username,password_hash,recovery_hash,auth_version,created_at) VALUES (?,?,?,?,?,?)",
      ["id", "username", "password_hash", "recovery_hash", "auth_version", "created_at"],
    ),
    ...bindRows(
      input.tables.diaries,
      "INSERT INTO diaries (user_id,payload,revision,created_at,updated_at) VALUES (?,?,?,?,?)",
      ["user_id", "payload", "revision", "created_at", "updated_at"],
    ),
    ...bindRows(
      input.tables.classes,
      "INSERT INTO classes (id,name,description,owner_id,settings,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
      ["id", "name", "description", "owner_id", "settings", "created_at", "updated_at"],
    ),
    ...bindRows(
      input.tables.class_members,
      "INSERT INTO class_members (class_id,user_id,role,display_name,joined_at) VALUES (?,?,?,?,?)",
      ["class_id", "user_id", "role", "display_name", "joined_at"],
    ),
    ...bindRows(
      input.tables.class_invites,
      "INSERT INTO class_invites (id,class_id,secret_hash,created_by,expires_at,max_uses,uses,revoked_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      ["id", "class_id", "secret_hash", "created_by", "expires_at", "max_uses", "uses", "revoked_at", "created_at"],
    ),
    ...bindRows(
      input.tables.class_events,
      "INSERT INTO class_events (id,class_id,author_id,subject,kind,title,description,due_at,status,revision,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      ["id", "class_id", "author_id", "subject", "kind", "title", "description", "due_at", "status", "revision", "created_at", "updated_at"],
    ),
    ...bindRows(
      input.tables.class_departures,
      "INSERT INTO class_departures (class_id,user_id,departed_at) VALUES (?,?,?)",
      ["class_id", "user_id", "departed_at"],
    ),
    ...bindRows(
      input.tables.class_event_subscriptions,
      "INSERT INTO class_event_subscriptions (id,user_id,source_event_id,event_id,snapshot,semester_id,subject_id,completed,reminder,revision,detached_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      ["id", "user_id", "source_event_id", "event_id", "snapshot", "semester_id", "subject_id", "completed", "reminder", "revision", "detached_at"],
    ),
    ...bindRows(
      input.tables.sessions,
      "INSERT INTO sessions (token_hash,user_id,auth_version,expires_at) VALUES (?,?,?,?)",
      ["token_hash", "user_id", "auth_version", "expires_at"],
    ),
  ];
  if (statements.length) await db.batch(statements);
  return json({
    ok: true,
    imported: Object.fromEntries(
      (Object.keys(input.tables) as TableName[]).map((name) => [
        name,
        input.tables[name].length,
      ]),
    ),
  });
}
