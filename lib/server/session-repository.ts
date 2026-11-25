import { createHash } from "node:crypto";
import { NO_PASSWORD } from "./password";
import type { AccountIdentity } from "@/types/domain";
import type { SessionMethod, SessionSummary } from "@/lib/session-devices";

/** Valid sessions kept per account; older ones close when a new one is issued. */
export const MAX_SESSIONS = 20;
/** "Last activity" precision: at most one write per active session every 15 minutes. */
export const LAST_SEEN_INTERVAL_MS = 15 * 60 * 1000;

/** Public, stable identifier of a session. The token hash never leaves the server. */
export function publicSessionId(tokenHash: string) {
  return createHash("sha256").update(`ipagell-session-id:${tokenHash}`).digest("hex").slice(0, 32);
}

type Row = {
  token_hash: string;
  method: string | null;
  client: string | null;
  created_at: number | null;
  last_seen_at: number | null;
  expires_at: number;
};

// Every statement is bound to the owner: another account's id simply does not exist.
export class SessionRepository {
  constructor(private db: D1Database) {}

  /**
   * Resolves a session to its account, accepting it only while auth_version
   * matches. Refreshes last_seen_at at most every LAST_SEEN_INTERVAL_MS.
   */
  async resolve(hash: string, now = Date.now()): Promise<AccountIdentity | null> {
    const row = await this.db
      .prepare(
        `SELECT a.id, a.username, CASE WHEN a.password_hash=? THEN 'google' ELSE 'password' END AS method, s.last_seen_at AS seen FROM sessions s JOIN accounts a ON a.id=s.user_id AND a.auth_version=s.auth_version WHERE s.token_hash=? AND s.expires_at>?`,
      )
      .bind(NO_PASSWORD, hash, now)
      .first<AccountIdentity & { seen: number | null }>();
    if (!row) return null;
    const { seen, ...user } = row;
    if (seen === null || now - seen >= LAST_SEEN_INTERVAL_MS) await this.touch(hash, now);
    return user;
  }

  // Best effort: a failed activity write must never fail the request it rides on.
  // The WHERE condition keeps concurrent requests from writing twice.
  private async touch(hash: string, now: number) {
    try {
      await this.db
        .prepare("UPDATE sessions SET last_seen_at=? WHERE token_hash=? AND (last_seen_at IS NULL OR last_seen_at<=?)")
        .bind(now, hash, now - LAST_SEEN_INTERVAL_MS)
        .run();
    } catch {
      // Ignored on purpose; no token or personal data is logged.
    }
  }

  /** Inserts a session for an account whose version still matches; returns rows written. */
  async insert(input: { hash: string; userId: string; version: number; expiresAt: number; method: SessionMethod; client: string | null; gate: string }, now = Date.now()) {
    const result = await this.db
      .prepare(
        `INSERT INTO sessions (token_hash,user_id,auth_version,expires_at,created_at,last_seen_at,method,client) SELECT ?,id,auth_version,?,?,?,?,? FROM accounts WHERE id=? AND auth_version=? AND ${input.gate}`,
      )
      .bind(input.hash, input.expiresAt, now, now, input.method, input.client, input.userId, input.version)
      .run();
    return result.meta.changes ?? 0;
  }

  /** Removes the user's expired or invalidated rows, and those beyond the cap. */
  pruneStatements(userId: string, now = Date.now()) {
    return [
      this.db.prepare(
        `DELETE FROM sessions WHERE user_id=? AND (expires_at<=? OR auth_version<>(SELECT auth_version FROM accounts WHERE id=?))`,
      ).bind(userId, now, userId),
      this.db.prepare(
        `DELETE FROM sessions WHERE user_id=? AND token_hash NOT IN (SELECT token_hash FROM sessions WHERE user_id=? ORDER BY expires_at DESC, token_hash LIMIT ?)`,
      ).bind(userId, userId, MAX_SESSIONS),
    ];
  }

  async prune(userId: string, now = Date.now()) {
    await this.db.batch(this.pruneStatements(userId, now));
  }

  async list(userId: string, currentHash: string, now = Date.now()): Promise<SessionSummary[]> {
    // Targeted cleanup only (no cap): viewing the list never closes a valid session.
    await this.db.batch([this.pruneStatements(userId, now)[0]]);
    const { results } = await this.db.prepare(
      `SELECT s.token_hash, s.method, s.client, s.created_at, s.last_seen_at, s.expires_at
       FROM sessions s JOIN accounts a ON a.id=s.user_id AND a.auth_version=s.auth_version
       WHERE s.user_id=? AND s.expires_at>?
       ORDER BY s.token_hash=? DESC, COALESCE(s.last_seen_at, s.created_at, 0) DESC, s.expires_at DESC
       LIMIT ?`,
    ).bind(userId, now, currentHash, MAX_SESSIONS).all<Row>();
    return results.map((row) => ({
      id: publicSessionId(row.token_hash),
      current: row.token_hash === currentHash,
      method: row.method === "password" || row.method === "google" ? (row.method as SessionMethod) : null,
      client: row.client,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
    }));
  }

  /** Closes one other session by public id. Unknown or already closed ids revoke 0. */
  async revoke(userId: string, currentHash: string, id: string) {
    const { results } = await this.db.prepare("SELECT token_hash FROM sessions WHERE user_id=?")
      .bind(userId).all<{ token_hash: string }>();
    const target = results.find((row) => publicSessionId(row.token_hash) === id)?.token_hash;
    if (!target || target === currentHash) return 0;
    const result = await this.db.prepare("DELETE FROM sessions WHERE user_id=? AND token_hash=? AND token_hash<>?")
      .bind(userId, target, currentHash).run();
    return result.meta.changes ?? 0;
  }

  /** Closes every session of the user except the current one. */
  async revokeOthers(userId: string, currentHash: string) {
    // Drop dead rows first, so the count only reports sessions that were usable.
    const [, closed] = await this.db.batch([
      this.pruneStatements(userId)[0],
      this.db.prepare("DELETE FROM sessions WHERE user_id=? AND token_hash<>?").bind(userId, currentHash),
    ]);
    return closed.meta.changes ?? 0;
  }
}
