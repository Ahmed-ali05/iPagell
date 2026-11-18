import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { HttpError } from "./http";

// Google OpenID Connect, authorization code flow with PKCE S256.
// Endpoints and issuer are fixed here: never taken from the request or the token.
export const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_ISSUERS = [GOOGLE_ISSUER, "accounts.google.com"];
const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
export const CALLBACK_PATH = "/api/auth/oauth/google/callback";
export const TRANSACTION_TTL_MS = 10 * 60 * 1000;

export type GoogleConfig = { clientId: string; clientSecret: string; redirectUri: string };

// Enabled only with a complete configuration whose redirect is this exact host.
// A different host would bind the browser cookie on one origin and return on another.
export function googleConfig(
  values: { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; GOOGLE_REDIRECT_URI?: string },
  requestUrl: string,
): GoogleConfig | null {
  const clientId = values.GOOGLE_CLIENT_ID?.trim(), clientSecret = values.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = values.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;
  let redirect: URL;
  try { redirect = new URL(redirectUri); } catch { return null; }
  const local = redirect.protocol === "http:" && ["localhost", "127.0.0.1"].includes(redirect.hostname);
  if ((redirect.protocol !== "https:" && !local) || redirect.pathname !== CALLBACK_PATH || redirect.search || redirect.hash)
    return null;
  if (redirect.origin !== new URL(requestUrl).origin) return null;
  return { clientId, clientSecret, redirectUri: redirect.href };
}

const encoder = new TextEncoder();
export function base64url(bytes: ArrayBuffer | Uint8Array) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// The PKCE verifier is never stored: it is an HMAC of the transaction id keyed by
// the browser binding token, which only the browser cookie holds (D1 has its digest).
export async function pkceVerifier(bindingToken: string, transactionId: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(bindingToken), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(`ipagell-pkce:${transactionId}`)));
}
export async function pkceChallenge(verifier: string) {
  return base64url(await crypto.subtle.digest("SHA-256", encoder.encode(verifier)));
}

export async function authorizationUrl(config: GoogleConfig, input: { state: string; nonce: string; verifier: string }) {
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid",
    state: input.state,
    nonce: input.nonce,
    code_challenge: await pkceChallenge(input.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.href;
}

let remoteKeys: JWTVerifyGetKey | null = null;
function googleKeys() {
  remoteKeys ??= createRemoteJWKSet(new URL(JWKS_URL), { timeoutDuration: 5000, cooldownDuration: 30_000 });
  return remoteKeys;
}

export type VerifiedGoogleIdentity = { issuer: typeof GOOGLE_ISSUER; subject: string };

// Signature, algorithm, issuer, audience, expiry, nonce, authorized party and subject.
export async function verifyIdToken(
  idToken: string,
  config: Pick<GoogleConfig, "clientId">,
  nonce: string,
  keys: JWTVerifyGetKey = googleKeys(),
): Promise<VerifiedGoogleIdentity> {
  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, keys, {
      issuer: GOOGLE_ISSUERS,
      audience: config.clientId,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "iat", "exp", "nonce"],
      maxTokenAge: "10m",
      clockTolerance: 60,
    }));
  } catch {
    throw new HttpError(401, "Accesso con Google non verificato.", "AUTH_GOOGLE_FAILED");
  }
  const subject = payload.sub;
  if (payload.nonce !== nonce || typeof subject !== "string" || !/^[\x21-\x7e]{1,255}$/.test(subject))
    throw new HttpError(401, "Accesso con Google non verificato.", "AUTH_GOOGLE_FAILED");
  if (payload.azp !== undefined && payload.azp !== config.clientId)
    throw new HttpError(401, "Accesso con Google non verificato.", "AUTH_GOOGLE_FAILED");
  return { issuer: GOOGLE_ISSUER, subject };
}

// Server-to-server code exchange. Provider error bodies are never logged or returned.
export async function exchangeCode(
  config: GoogleConfig,
  code: string,
  verifier: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  let response: Response;
  try {
    response = await fetcher(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code_verifier: verifier,
      }),
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new HttpError(503, "Google non risponde. Riprova.", "AUTH_GOOGLE_FAILED");
  }
  const body = await response.json().catch(() => null) as { id_token?: unknown } | null;
  if (!response.ok || typeof body?.id_token !== "string")
    throw new HttpError(401, "Accesso con Google non verificato.", "AUTH_GOOGLE_FAILED");
  return body.id_token;
}

// Technical, immutable handle for accounts without a chosen username:
// "u_" + 26 base32 characters of 128 random bits. Not derived from any claim.
export function randomHandle() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  const bytes = crypto.getRandomValues(new Uint8Array(17));
  let bits = 0, value = 0, out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5 && out.length < 26) { out += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  return `u_${out}`;
}
