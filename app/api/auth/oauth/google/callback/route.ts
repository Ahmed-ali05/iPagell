import { database } from "@/lib/server/db";
import { identity, rateLimit, sessionCookie, TTL } from "@/lib/server/auth";
import { AuthRepository } from "@/lib/server/auth-repository";
import { randomToken, tokenHash } from "@/lib/server/password";
import { exchangeCode, pkceVerifier, randomHandle, verifyIdToken } from "@/lib/server/google-oidc";
import { currentGoogleConfig, readBinding, redirectToApp } from "@/lib/server/google-auth";
export const dynamic = "force-dynamic";

// Google returns here with GET. No code, token, state or claim is ever logged.
export async function GET(request: Request) {
  let transactionId: string | null = null;
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
    if (params.has("error") || !code || code.length > 2048) {
      await auth.failOAuthTransaction(transaction.id);
      return redirectToApp(request, params.get("error") === "access_denied" ? "google-cancelled" : "google-error");
    }
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
      newAccount: { id: crypto.randomUUID(), username: randomHandle() },
    }, mode);
    if (!finished) {
      await auth.failOAuthTransaction(transaction.id);
      return redirectToApp(request, "google-error");
    }
    return redirectToApp(request, undefined, sessionCookie(request, token));
  } catch {
    if (transactionId) await auth.failOAuthTransaction(transactionId);
    return redirectToApp(request, "google-error");
  }
}
