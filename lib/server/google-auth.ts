import { env } from "cloudflare:workers";
import { googleConfig } from "./google-oidc";
import { randomToken, tokenHash } from "./password";

type GoogleEnv = { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; GOOGLE_REDIRECT_URI?: string };

export function currentGoogleConfig(request: Request) {
  return googleConfig(env as unknown as GoogleEnv, request.url);
}

// Dedicated browser binding for OAuth transactions, separate from the session.
// Stable per browser (not rewritten per tab); D1 stores only its digest.
function bindingName(request: Request) {
  return new URL(request.url).protocol === "https:" ? "__Host-ipagell-oauth-browser" : "ipagell-dev-oauth-browser";
}
export function readBinding(request: Request) {
  const name = bindingName(request);
  const matches = (request.headers.get("cookie") ?? "").split(";").map((s) => s.trim()).filter((s) => s.startsWith(`${name}=`));
  if (matches.length !== 1) return null;
  const token = matches[0].slice(name.length + 1);
  return /^[a-f0-9]{64}$/.test(token) ? { token, hash: tokenHash(token) } : null;
}
export function ensureBinding(request: Request) {
  const existing = readBinding(request);
  if (existing) return { ...existing, cookie: null };
  const token = randomToken();
  const secure = new URL(request.url).protocol === "https:";
  // 30 days: long enough to stay stable across logins, never a credential by itself.
  const cookie = `${bindingName(request)}=${token}; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`;
  return { token, hash: tokenHash(token), cookie };
}

// Same-origin redirect to the app with a short, non-sensitive outcome flag.
export type AppOutcome = "google-error" | "google-cancelled" | "reauth-ok" | "reauth-cancelled" | "reauth-mismatch" | "reauth-error";
export function redirectToApp(request: Request, outcome?: AppOutcome, cookie?: string) {
  const target = new URL("/app", request.url);
  if (outcome) target.searchParams.set("accesso", outcome);
  const headers = new Headers({
    Location: target.pathname + target.search,
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}
