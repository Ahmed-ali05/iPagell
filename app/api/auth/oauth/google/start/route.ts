import { z } from "zod";
import { database } from "@/lib/server/db";
import { checkMutation, errorResponse, json, readJson } from "@/lib/server/http";
import { identity, rateLimit, sessionTokenHash } from "@/lib/server/auth";
import { AuthRepository, type ReauthContext } from "@/lib/server/auth-repository";
import { randomToken, tokenHash } from "@/lib/server/password";
import { TRANSACTION_TTL_MS, authorizationUrl, pkceVerifier } from "@/lib/server/google-oidc";
import { currentGoogleConfig, ensureBinding } from "@/lib/server/google-auth";
export const dynamic = "force-dynamic";

// Sign-in: the click is the age/terms confirmation shown next to the button.
// Reauth: an open Google session confirms the same account before a sensitive operation.
const schema = z.union([
  z.object({ ageConfirmed: z.literal(true) }).strict(),
  z.object({ purpose: z.literal("reauth"), expectedUserId: z.string().max(100) }).strict(),
]);

export async function POST(request: Request) {
  try {
    checkMutation(request);
    const config = currentGoogleConfig(request);
    if (!config) return json({ error: "Accesso con Google non disponibile.", code: "AUTH_UNAVAILABLE" }, 404);
    const parsed = schema.safeParse(await readJson(request, 1024));
    if (!parsed.success)
      return json({ error: "Conferma età e regole d’uso.", code: "AUTH_INVALID_SIGNUP" }, 400);
    const input = parsed.data;
    const user = await identity(request);
    const auth = new AuthRepository(database());
    let reauth: ReauthContext | undefined, loginHint: string | undefined;
    if ("purpose" in input) {
      const sessionHash = sessionTokenHash(request);
      if (!user || !sessionHash) return json({ error: "Accedi di nuovo.", code: "SECURITY_SESSION_REQUIRED" }, 401);
      if (input.expectedUserId !== user.id)
        return json({ error: "Account cambiato. Ricarica la pagina.", code: "ACCOUNT_CHANGED" }, 401);
      const mode = await auth.mode();
      const account = await auth.find(user.username, mode);
      const subject = account ? await auth.googleSubject(account.id) : null;
      if (!account || !subject)
        return json({ error: "Questo account non accede con Google.", code: "SECURITY_NOT_GOOGLE" }, 400);
      reauth = { accountId: account.id, sessionHash, authVersion: account.auth_version };
      loginHint = subject;
    } else if (user) {
      // A login never silently replaces a session already open in this browser.
      return json({ error: "Sei già dentro con un altro account.", code: "ACCOUNT_CHANGED" }, 409);
    }
    const binding = ensureBinding(request);
    await rateLimit(request, `oauth:${binding.hash}`, reauth ? "oauth-google-reauth" : "oauth-google-start");
    const mode = await auth.mode();
    const id = crypto.randomUUID(), state = randomToken(), nonce = randomToken();
    const created = await auth.createOAuthTransaction({
      id, stateHash: tokenHash(state), bindingHash: binding.hash, nonce,
      redirectUri: config.redirectUri, expiresAt: Date.now() + TRANSACTION_TTL_MS, reauth,
    }, mode);
    if (!created)
      return json({ error: "Troppi tentativi in corso. Riprova tra qualche minuto.", code: "AUTH_BUSY" }, 429);
    const url = await authorizationUrl(config, { state, nonce, verifier: await pkceVerifier(binding.token, id), loginHint });
    const response = json({ url });
    if (binding.cookie) response.headers.set("Set-Cookie", binding.cookie);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
