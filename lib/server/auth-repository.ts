import { HttpError } from "./http";

export type AuthMode = "legacy-unexpanded" | "legacy" | "credentials";

const expansionObjects = "'auth_schema_state','account_credentials','account_identities','account_emails','auth_browser_epochs','auth_transactions','auth_challenges','auth_grants'";
const legacyColumns = "'id','username','password_hash','recovery_hash','auth_version','created_at'";

// Schema 6 is a separate supported state, never a fallback for a damaged expansion.
// Repeat the shape check in each final write to fence a concurrent expansion.
export function authWriteGate(mode: AuthMode): string {
  if (mode === "legacy-unexpanded") return `
    NOT EXISTS(SELECT 1 FROM sqlite_master WHERE name IN (${expansionObjects}))
    AND (SELECT count(*) FROM pragma_table_info('accounts'))=6
    AND (SELECT count(*) FROM pragma_table_info('accounts') WHERE name IN (${legacyColumns}))=6`;
  return `EXISTS(SELECT 1 FROM auth_schema_state WHERE id=1 AND schema_version=${mode === "legacy" ? 7 : 8} AND write_mode='${mode}')`;
}
export type PasswordAccount = {
  id: string; username: string; password_hash: string | null;
  recovery_hash: string | null; auth_version: number;
};

// The expansion copy is deliberately NOT a fallback. One store is authoritative.
export class AuthRepository {
  constructor(private db: D1Database) {}

  async mode(): Promise<AuthMode> {
    const expanded = await this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_schema_state'").first();
    if (!expanded) {
      const unexpanded = await this.db.prepare(`SELECT 1 AS supported WHERE ${authWriteGate("legacy-unexpanded")}`).first();
      if (unexpanded) return "legacy-unexpanded";
      throw new HttpError(503, "Accesso temporaneamente sospeso. Riprova.", "AUTH_UNAVAILABLE");
    }
    const state = await this.db.prepare("SELECT schema_version,write_mode FROM auth_schema_state WHERE id=1")
      .first<{ schema_version: number; write_mode: string }>();
    if (state?.schema_version === 7 && state.write_mode === "legacy") return "legacy";
    if (state?.schema_version === 8 && state.write_mode === "credentials") return "credentials";
    throw new HttpError(503, "Accesso temporaneamente sospeso. Riprova.", "AUTH_UNAVAILABLE");
  }

  private gate(mode: AuthMode) {
    return authWriteGate(mode);
  }

  async find(username: string, mode: AuthMode) {
    const secrets = mode !== "credentials" ? "a.password_hash,a.recovery_hash" : "c.password_hash,c.recovery_hash";
    const join = mode !== "credentials" ? "" : "LEFT JOIN account_credentials c ON c.account_id=a.id";
    return this.db.prepare(`SELECT a.id,a.username,a.auth_version,${secrets} FROM accounts a ${join} WHERE a.username=? AND ${this.gate(mode)}`)
      .bind(username).first<PasswordAccount>();
  }

  async register(id: string, username: string, passwordHash: string, recoveryHash: string, mode: AuthMode) {
    const now = Date.now();
    if (mode !== "credentials") {
      const result = await this.db.prepare(`INSERT INTO accounts(id,username,password_hash,recovery_hash,auth_version,created_at)
        SELECT ?,?,?,?,1,? WHERE ${this.gate(mode)} ON CONFLICT(username) DO NOTHING RETURNING id`)
        .bind(id, username, passwordHash, recoveryHash, now).all();
      return result.results.length === 1;
    }
    const results = await this.db.batch([
      this.db.prepare(`INSERT INTO accounts(id,username,auth_version,created_at) SELECT ?,?,1,? WHERE ${this.gate(mode)} ON CONFLICT(username) DO NOTHING RETURNING id`)
        .bind(id, username, now),
      this.db.prepare(`INSERT INTO account_credentials(account_id,password_hash,recovery_hash,updated_at)
        SELECT id,?,?,? FROM accounts WHERE id=? AND ${this.gate(mode)}`).bind(passwordHash, recoveryHash, now, id),
    ]);
    return results[0].results.length === 1;
  }

  // Revalidate the original session at the mutation, after the expensive KDF.
  private sessionGuard(sessionHash?: string) {
    return sessionHash ? "AND EXISTS(SELECT 1 FROM sessions s WHERE s.token_hash=? AND s.user_id=accounts.id AND s.auth_version=accounts.auth_version AND s.expires_at>?)" : "";
  }

  async replacePassword(account: PasswordAccount, passwordHash: string, recoveryHash: string | null, mode: AuthMode, sessionHash?: string) {
    const sessionArgs = sessionHash ? [sessionHash, Date.now()] : [];
    if (mode !== "credentials") {
      const result = await this.db.prepare(`UPDATE accounts SET password_hash=?,recovery_hash=?,auth_version=auth_version+1
        WHERE id=? AND auth_version=? AND ${this.gate(mode)} ${this.sessionGuard(sessionHash)} RETURNING id`)
        .bind(passwordHash, recoveryHash, account.id, account.auth_version, ...sessionArgs).all();
      return result.results.length === 1;
    }
    const operationId = crypto.randomUUID();
    const results = await this.db.batch([
      this.db.prepare(`UPDATE accounts SET auth_version=auth_version+1,auth_operation_id=?
        WHERE id=? AND auth_version=? AND ${this.gate(mode)} ${this.sessionGuard(sessionHash)}
        AND EXISTS(SELECT 1 FROM account_credentials WHERE account_id=accounts.id) RETURNING id`)
        .bind(operationId, account.id, account.auth_version, ...sessionArgs),
      this.db.prepare(`UPDATE account_credentials SET password_hash=?,recovery_hash=?,updated_at=?
        WHERE account_id=? AND EXISTS(SELECT 1 FROM accounts WHERE id=? AND auth_version=? AND auth_operation_id=?)`)
        .bind(passwordHash, recoveryHash, Date.now(), account.id, account.id, account.auth_version + 1, operationId),
    ]);
    return results[0].results.length === 1;
  }

  async deleteAccount(account: PasswordAccount, mode: AuthMode, sessionHash: string) {
    const guard = `EXISTS(SELECT 1 FROM accounts WHERE id=? AND auth_version=? AND ${this.gate(mode)} ${this.sessionGuard(sessionHash)})`;
    const args = [account.id, account.auth_version, sessionHash, Date.now()];
    // Every side effect has the SAME guard. Zero rows does not roll back a batch.
    const results = await this.db.batch([
      this.db.prepare(`DELETE FROM class_invites WHERE created_by=? AND ${guard}`).bind(account.id, ...args),
      this.db.prepare(`DELETE FROM diaries WHERE user_id=? AND ${guard}`).bind(account.id, ...args),
      this.db.prepare(`DELETE FROM accounts WHERE id=? AND auth_version=? AND ${this.gate(mode)} ${this.sessionGuard(sessionHash)} RETURNING id`)
        .bind(...args),
    ]);
    return results[2].results.length === 1;
  }
}
