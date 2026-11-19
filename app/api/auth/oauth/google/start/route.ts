import { z } from "zod";
import { database } from "@/lib/server/db";
import { checkMutation, errorResponse, json, readJson } from "@/lib/server/http";
import { identity, rateLimit } from "@/lib/server/auth";
import { AuthRepository } from "@/lib/server/auth-repository";
import { randomToken, tokenHash } from "@/lib/server/password";
import { TRANSACTION_TTL_MS, authorizationUrl, pkceVerifier } from "@/lib/server/google-oidc";
import { currentGoogleConfig, ensureBinding } from "@/lib/server/google-auth";
export const dynamic = "force-dynamic";

// The click is the age/terms confirmation shown next to the button.
const schema = z.object({ ageConfirmed: z.literal(true) }).strict();

export async function POST(request: Request) {
  try {
    checkMutation(request);
    const config = currentGoogleConfig(request);
    if (!config) return json({ error: "Accesso con Google non disponibile.", code: "AUTH_UNAVAILABLE" }, 404);
    if (!schema.safeParse(await readJson(request, 1024)).success)
      return json({ error: "Conferma età e regole d’uso.", code: "AUTH_INVALID_SIGNUP" }, 400);
    // A login never silently replaces a session already open in this browser.
    if (await identity(request))
      return json({ error: "Sei già dentro con un altro account.", code: "ACCOUNT_CHANGED" }, 409);
    const binding = ensureBinding(request);
    await rateLimit(request, `oauth:${binding.hash}`, "oauth-google-start");
    const auth = new AuthRepository(database());
    const mode = await auth.mode();
    const id = crypto.randomUUID(), state = randomToken(), nonce = randomToken();
    const created = await auth.createOAuthTransaction({
      id, stateHash: tokenHash(state), bindingHash: binding.hash, nonce,
      redirectUri: config.redirectUri, expiresAt: Date.now() + TRANSACTION_TTL_MS,
    }, mode);
    if (!created)
      return json({ error: "Troppi tentativi in corso. Riprova tra qualche minuto.", code: "AUTH_BUSY" }, 429);
    const url = await authorizationUrl(config, { state, nonce, verifier: await pkceVerifier(binding.token, id) });
    const response = json({ url });
    if (binding.cookie) response.headers.set("Set-Cookie", binding.cookie);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
