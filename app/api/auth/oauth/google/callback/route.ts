import { database } from "@/lib/server/db";
import { identity, rateLimit, sessionCookie, sessionTokenHash, TTL } from "@/lib/server/auth";
import { AuthRepository, GRANT_TTL_MS, type ClaimedTransaction, type AuthMode } from "@/lib/server/auth-repository";
import { randomToken, tokenHash } from "@/lib/server/password";
import { clientCode } from "@/lib/server/session-client";
import { SessionRepository } from "@/lib/server/session-repository";
import { exchangeCode, pkceVerifier, randomHandle, verifyIdToken, type GoogleConfig } from "@/lib/server/google-oidc";
import { currentGoogleConfig, readBinding, redirectToApp } from "@/lib/server/google-auth";
export const dynamic = "force-dynamic";

// Google returns here with GET. No code, token, state or claim is ever logged.
export async function GET(request: Request) {
  let transactionId: string | null = null, purpose: ClaimedTransaction["purpose"] = "login";
  const auth = new AuthRepository(database());
  try {
    const config = currentGoogleConfig(request);
    const params = new URL(request.url).searchParams;
    const state = params.get("state"), code = params.get("code");
    const binding = readBinding(request);
    // Missing browser binding means another browser or expired cookie: restart.
    if (!config || !binding || !state || !/^[a-f0-9]{64}$/.test(state)) return redirectToApp(request, "google-error");
    await rateLimit(request, `oauth:${binding.hash}`, "oauth-google-callback");
    const mode = await auth.mode();
    const transaction = await auth.claimOAuthTransaction(tokenHash(state), binding.hash, mode);
    if (!transaction || transaction.redirect_uri !== config.redirectUri) return redirectToApp(request, "google-error");
    transactionId = transaction.id;
    purpose = transaction.purpose;
    if (params.has("error") || !code || code.length > 2048) {
      await auth.failOAuthTransaction(transaction.id);
      const cancelled = params.get("error") === "access_denied";
      if (purpose === "reauth") return redirectToApp(request, cancelled ? "reauth-cancelled" : "reauth-error");
      return redirectToApp(request, cancelled ? "google-cancelled" : "google-error");
    }
    if (purpose === "reauth") return await reauthenticate(request, auth, mode, config, transaction, code, binding.token);
    // A session opened meanwhile in this browser wins; do not replace it.
    if (await identity(request)) {
      await auth.failOAuthTransaction(transaction.id);
      return redirectToApp(request);
    }
    const idToken = await exchangeCode(config, code, await pkceVerifier(binding.token, transaction.id));
    const verified = await verifyIdToken(idToken, config, transaction.nonce);
    const token = randomToken();
    const finished = await auth.finishGoogleLogin({
      transactionId: transaction.id,
      issuer: verified.issuer,
      subject: verified.subject,
      sessionHash: tokenHash(token),
      sessionExpiresAt: Date.now() + TTL * 1000,
      client: clientCode(request.headers),
      newAccount: { id: crypto.randomUUID(), username: randomHandle() },
    }, mode);
    if (!finished) {
      await auth.failOAuthTransaction(transaction.id);
      return redirectToApp(request, "google-error");
    }
    // Keep the account within the session cap; the sign-in already succeeded.
    await new SessionRepository(database()).prune(finished.userId).catch(() => undefined);
    return redirectToApp(request, undefined, sessionCookie(request, token));
  } catch {
    if (transactionId) await auth.failOAuthTransaction(transactionId);
    return redirectToApp(request, purpose === "reauth" ? "reauth-error" : "google-error");
  }
}

// Confirms the same Google account for the session that started the reauth.
// The result is a single-use grant for that session, never a new session.
async function reauthenticate(request: Request, auth: AuthRepository, mode: AuthMode, config: GoogleConfig,
  transaction: ClaimedTransaction, code: string, bindingToken: string) {
  const user = await identity(request);
  if (!user || user.id !== transaction.account_id || sessionTokenHash(request) !== transaction.session_hash) {
    await auth.failOAuthTransaction(transaction.id);
    return redirectToApp(request, "reauth-error");
  }
  const idToken = await exchangeCode(config, code, await pkceVerifier(bindingToken, transaction.id));
  const verified = await verifyIdToken(idToken, config, transaction.nonce);
  const result = await auth.finishGoogleReauth({
    transactionId: transaction.id, issuer: verified.issuer, subject: verified.subject,
    grantHash: tokenHash(randomToken()), expiresAt: Date.now() + GRANT_TTL_MS,
  }, mode);
  if (result !== "granted") await auth.failOAuthTransaction(transaction.id);
  return redirectToApp(request, result === "granted" ? "reauth-ok" : result === "mismatch" ? "reauth-mismatch" : "reauth-error");
}
