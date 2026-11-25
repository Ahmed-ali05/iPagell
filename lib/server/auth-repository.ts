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
/**
 * A recent proof of identity for one session (auth_grants, 0007). Generic on
 * purpose: any sensitive operation consumes it, and each grant is single-use.
 */
export const GRANT_OPERATION = "reauth";
export const GRANT_TTL_MS = 10 * 60 * 1000;
export type ReauthContext = { accountId: string; sessionHash: string; authVersion: number };
export type ClaimedTransaction = {
  id: string; nonce: string; redirect_uri: string;
  purpose: "login" | "reauth"; account_id: string | null; session_hash: string | null;
};
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

  /**
   * A login transaction, or a reauth one bound to the account, its current
   * session and auth_version (only while that session is valid and the account
   * has an active Google identity).
   */
  async createOAuthTransaction(input: { id: string; stateHash: string; bindingHash: string; nonce: string; redirectUri: string; expiresAt: number; reauth?: ReauthContext }, mode: AuthMode) {
    if (mode !== "legacy") throw new HttpError(503, "Accesso con Google non disponibile.", "AUTH_UNAVAILABLE");
    const now = Date.now(), reauth = input.reauth;
    const owner = reauth
      ? `AND EXISTS(SELECT 1 FROM sessions s JOIN accounts a ON a.id=s.user_id AND a.auth_version=s.auth_version
          WHERE s.token_hash=? AND s.user_id=? AND a.auth_version=? AND s.expires_at>?)
        AND EXISTS(SELECT 1 FROM account_identities WHERE account_id=? AND provider='google' AND status='active')`
      : "";
    const ownerArgs = reauth ? [reauth.sessionHash, reauth.accountId, reauth.authVersion, now, reauth.accountId] : [];
    const [, inserted] = await this.db.batch([
      this.db.prepare(`DELETE FROM auth_transactions WHERE expires_at<? AND ${this.gate(mode)}`).bind(now),
      // At most 3 pending transactions per browser binding.
      this.db.prepare(`INSERT INTO auth_transactions(id,state_hash,binding_hash,browser_epoch,provider,purpose,account_id,session_hash,auth_version,nonce,redirect_uri,status,expires_at)
        SELECT ?,?,?,0,'google',?,?,?,?,?,?,'pending',? WHERE ${this.gate(mode)} ${owner}
        AND (SELECT count(*) FROM auth_transactions WHERE binding_hash=? AND status='pending' AND expires_at>?)<3 RETURNING id`)
        .bind(input.id, input.stateHash, input.bindingHash, reauth ? "reauth" : "login",
          reauth?.accountId ?? null, reauth?.sessionHash ?? null, reauth?.authVersion ?? null,
          input.nonce, input.redirectUri, input.expiresAt, ...ownerArgs, input.bindingHash, now),
    ]);
    return inserted.results.length === 1;
  }

  /** Google subject of the account's active identity, used as login_hint. */
  async googleSubject(accountId: string) {
    const row = await this.db.prepare("SELECT subject FROM account_identities WHERE account_id=? AND provider='google' AND status='active'")
      .bind(accountId).first<{ subject: string }>();
    return row?.subject ?? null;
  }

  // Single winner: only one callback can move a pending transaction to processing.
  async claimOAuthTransaction(stateHash: string, bindingHash: string, mode: AuthMode) {
    if (mode !== "legacy") return null;
    return this.db.prepare(`UPDATE auth_transactions SET status='processing'
      WHERE state_hash=? AND binding_hash=? AND provider='google' AND purpose IN ('login','reauth') AND status='pending' AND expires_at>? AND ${this.gate(mode)}
      RETURNING id,nonce,redirect_uri,purpose,account_id,session_hash`)
      .bind(stateHash, bindingHash, Date.now()).first<ClaimedTransaction>();
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

  /**
   * Turns a verified reauth callback into a single-use grant for the session
   * that started it. "mismatch": Google returned a different account.
   * null: the transaction, session or identity is no longer valid.
   */
  async finishGoogleReauth(input: { transactionId: string; issuer: string; subject: string; grantHash: string; expiresAt: number }, mode: AuthMode): Promise<"granted" | "mismatch" | null> {
    if (mode !== "legacy") return null;
    const owner = await this.db.prepare(`SELECT i.issuer,i.subject FROM auth_transactions t JOIN account_identities i
      ON i.account_id=t.account_id AND i.provider='google' AND i.status='active'
      WHERE t.id=? AND t.purpose='reauth' AND t.status='processing'`)
      .bind(input.transactionId).first<{ issuer: string; subject: string }>();
    if (!owner) return null;
    if (owner.issuer !== input.issuer || owner.subject !== input.subject) return "mismatch";
    const operationId = crypto.randomUUID(), now = Date.now(), gate = this.gate(mode);
    const consumed = `EXISTS(SELECT 1 FROM auth_transactions WHERE id=? AND operation_id=? AND status='consumed')`;
    const results = await this.db.batch([
      // The same identity, and the starting session still valid at the same version.
      this.db.prepare(`UPDATE auth_transactions SET status='consumed',operation_id=?
        WHERE id=? AND purpose='reauth' AND status='processing' AND ${gate}
        AND EXISTS(SELECT 1 FROM account_identities i WHERE i.account_id=auth_transactions.account_id
          AND i.provider='google' AND i.issuer=? AND i.subject=? AND i.status='active')
        AND EXISTS(SELECT 1 FROM sessions s JOIN accounts a ON a.id=s.user_id AND a.auth_version=s.auth_version
          WHERE s.token_hash=auth_transactions.session_hash AND s.user_id=auth_transactions.account_id
          AND a.auth_version=auth_transactions.auth_version AND s.expires_at>?) RETURNING id`)
        .bind(operationId, input.transactionId, input.issuer, input.subject, now),
      // One open grant per session: a new confirmation replaces the previous one.
      this.db.prepare(`DELETE FROM auth_grants WHERE ${consumed} AND (expires_at<=?
        OR (session_hash=(SELECT session_hash FROM auth_transactions WHERE id=?) AND consumed_by IS NULL))`)
        .bind(input.transactionId, operationId, now, input.transactionId),
      this.db.prepare(`INSERT INTO auth_grants(token_hash,account_id,session_hash,auth_version,method,operation,target,expires_at)
        SELECT ?,account_id,session_hash,auth_version,'google','${GRANT_OPERATION}',account_id,? FROM auth_transactions
        WHERE id=? AND operation_id=? AND status='consumed' AND ${gate} RETURNING token_hash`)
        .bind(input.grantHash, input.expiresAt, input.transactionId, operationId),
    ]);
    return results[2].results.length === 1 ? "granted" : null;
  }

  /** Expiry of the session's open grant, or null. Grants exist only in legacy mode. */
  /**
   * What the Account panel shows: creation date and the linked sign-in
   * identities (provider and date only, never issuer or subject).
   * Schema 6 has no identities table, so it lists none.
   */
  async profile(accountId: string, mode: AuthMode) {
    const account = await this.db.prepare("SELECT created_at FROM accounts WHERE id=?")
      .bind(accountId).first<{ created_at: number }>();
    if (!account) return null;
    const identities = mode === "legacy-unexpanded" ? [] : (await this.db.prepare(
      "SELECT provider,created_at FROM account_identities WHERE account_id=? AND status='active' ORDER BY created_at",
    ).bind(accountId).all<{ provider: "google" | "apple"; created_at: number }>()).results;
    return {
      createdAt: account.created_at,
      identities: identities.map((identity) => ({ provider: identity.provider, createdAt: identity.created_at })),
    };
  }

  async activeGrant(accountId: string, version: number, sessionHash: string, mode: AuthMode) {
    if (mode !== "legacy") return null;
    const row = await this.db.prepare(`SELECT expires_at FROM auth_grants WHERE account_id=? AND auth_version=? AND session_hash=?
      AND operation='${GRANT_OPERATION}' AND consumed_by IS NULL AND expires_at>? ORDER BY expires_at DESC LIMIT 1`)
      .bind(accountId, version, sessionHash, Date.now()).first<{ expires_at: number }>();
    return row?.expires_at ?? null;
  }

  /**
   * With requireGrant (accounts without a password), the batch also consumes
   * the session's open grant and every side effect requires that consumption.
   */
  async deleteAccount(account: PasswordAccount, mode: AuthMode, sessionHash: string, requireGrant = false) {
    const now = Date.now(), operationId = crypto.randomUUID();
    const grant = requireGrant ? "AND EXISTS(SELECT 1 FROM auth_grants WHERE consumed_by=?)" : "";
    const grantArgs = requireGrant ? [operationId] : [];
    const guard = `EXISTS(SELECT 1 FROM accounts WHERE id=? AND auth_version=? AND ${this.gate(mode)} ${this.sessionGuard(sessionHash)} ${grant})`;
    const args = [account.id, account.auth_version, sessionHash, now, ...grantArgs];
    // Every side effect has the SAME guard. Zero rows does not roll back a batch.
    const results = await this.db.batch([
      ...(requireGrant ? [this.db.prepare(`UPDATE auth_grants SET consumed_by=? WHERE token_hash=(SELECT token_hash FROM auth_grants
        WHERE account_id=? AND auth_version=? AND session_hash=? AND operation='${GRANT_OPERATION}' AND consumed_by IS NULL AND expires_at>?
        ORDER BY expires_at DESC LIMIT 1) AND ${this.gate(mode)}`).bind(operationId, account.id, account.auth_version, sessionHash, now)] : []),
      this.db.prepare(`DELETE FROM class_invites WHERE created_by=? AND ${guard}`).bind(account.id, ...args),
      this.db.prepare(`DELETE FROM diaries WHERE user_id=? AND ${guard}`).bind(account.id, ...args),
      this.db.prepare(`DELETE FROM accounts WHERE id=? AND auth_version=? AND ${this.gate(mode)} ${this.sessionGuard(sessionHash)} ${grant} RETURNING id`)
        .bind(...args),
    ]);
    return results[results.length - 1].results.length === 1;
  }
}
