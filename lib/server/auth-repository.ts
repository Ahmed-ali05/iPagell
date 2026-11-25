import { HttpError } from "./http";
import { NO_PASSWORD } from "./password";

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

  // --- Google sign-in (legacy mode only: identities need the 0007 expansion) ---

  async createOAuthTransaction(input: { id: string; stateHash: string; bindingHash: string; nonce: string; redirectUri: string; expiresAt: number }, mode: AuthMode) {
    if (mode !== "legacy") throw new HttpError(503, "Accesso con Google non disponibile.", "AUTH_UNAVAILABLE");
    const now = Date.now();
    const [, inserted] = await this.db.batch([
      this.db.prepare(`DELETE FROM auth_transactions WHERE expires_at<? AND ${this.gate(mode)}`).bind(now),
      // At most 3 pending transactions per browser binding.
      this.db.prepare(`INSERT INTO auth_transactions(id,state_hash,binding_hash,browser_epoch,provider,purpose,nonce,redirect_uri,status,expires_at)
        SELECT ?,?,?,0,'google','login',?,?,'pending',? WHERE ${this.gate(mode)}
        AND (SELECT count(*) FROM auth_transactions WHERE binding_hash=? AND status='pending' AND expires_at>?)<3 RETURNING id`)
        .bind(input.id, input.stateHash, input.bindingHash, input.nonce, input.redirectUri, input.expiresAt, input.bindingHash, now),
    ]);
    return inserted.results.length === 1;
  }

  // Single winner: only one callback can move a pending transaction to processing.
  async claimOAuthTransaction(stateHash: string, bindingHash: string, mode: AuthMode) {
    if (mode !== "legacy") return null;
    return this.db.prepare(`UPDATE auth_transactions SET status='processing'
      WHERE state_hash=? AND binding_hash=? AND provider='google' AND purpose='login' AND status='pending' AND expires_at>? AND ${this.gate(mode)}
      RETURNING id,nonce,redirect_uri`)
      .bind(stateHash, bindingHash, Date.now()).first<{ id: string; nonce: string; redirect_uri: string }>();
  }

  async failOAuthTransaction(id: string) {
    await this.db.prepare("UPDATE auth_transactions SET status='failed' WHERE id=? AND status IN ('pending','processing')").bind(id).run().catch(() => undefined);
  }

  // Consumes the transaction and creates the session in one batch. A new account
  // and its identity are created in the same batch when the subject is unknown.
  async finishGoogleLogin(input: { transactionId: string; issuer: string; subject: string; sessionHash: string; sessionExpiresAt: number; client: string | null; newAccount: { id: string; username: string } }, mode: AuthMode) {
    if (mode !== "legacy") throw new HttpError(503, "Accesso con Google non disponibile.", "AUTH_UNAVAILABLE");
    const operationId = crypto.randomUUID(), now = Date.now(), gate = this.gate(mode);
    const consumed = `EXISTS(SELECT 1 FROM auth_transactions WHERE id=? AND operation_id=? AND status='consumed')`;
    const { id, username } = input.newAccount;
    const results = await this.db.batch([
      this.db.prepare(`UPDATE auth_transactions SET status='consumed',operation_id=? WHERE id=? AND status='processing' AND ${gate} RETURNING id`)
        .bind(operationId, input.transactionId),
      this.db.prepare(`INSERT INTO accounts(id,username,password_hash,recovery_hash,auth_version,created_at)
        SELECT ?,?,?,?,1,? WHERE ${gate} AND ${consumed}
        AND NOT EXISTS(SELECT 1 FROM account_identities WHERE issuer=? AND subject=?)
        ON CONFLICT(username) DO NOTHING RETURNING id`)
        .bind(id, username, NO_PASSWORD, NO_PASSWORD, now, input.transactionId, operationId, input.issuer, input.subject),
      this.db.prepare(`INSERT INTO account_identities(id,account_id,provider,issuer,subject,status,created_at)
        SELECT ?,?,'google',?,?,'active',? WHERE ${gate} AND ${consumed}
        AND EXISTS(SELECT 1 FROM accounts WHERE id=? AND username=?)
        AND NOT EXISTS(SELECT 1 FROM account_identities WHERE issuer=? AND subject=?)`)
        .bind(crypto.randomUUID(), id, input.issuer, input.subject, now, input.transactionId, operationId, id, username, input.issuer, input.subject),
      this.db.prepare(`INSERT INTO sessions(token_hash,user_id,auth_version,expires_at,created_at,last_seen_at,method,client)
        SELECT ?,a.id,a.auth_version,?,?,?,'google',? FROM account_identities i JOIN accounts a ON a.id=i.account_id
        WHERE i.issuer=? AND i.subject=? AND i.provider='google' AND i.status='active' AND ${gate} AND ${consumed} RETURNING user_id`)
        .bind(input.sessionHash, input.sessionExpiresAt, now, now, input.client, input.issuer, input.subject, input.transactionId, operationId),
    ]);
    const session = results[3].results[0] as { user_id: string } | undefined;
    if (!session) return null;
    return { userId: session.user_id, created: results[1].results.length === 1 };
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
