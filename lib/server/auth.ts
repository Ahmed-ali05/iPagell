import { database } from "./db";
import { HttpError } from "./http";
import { randomToken, tokenHash } from "./password";
import { AuthRepository, authWriteGate, type AuthMode } from "./auth-repository";
import { clientCode } from "./session-client";
import { SessionRepository } from "./session-repository";
import type { AccountIdentity } from "@/types/domain";
import type { SessionMethod } from "@/lib/session-devices";

export const TTL = 14 * 24 * 60 * 60;
function cookieName(request: Request) {
  return new URL(request.url).protocol === "https:"
    ? "__Host-ipagell-session"
    : "ipagell-dev-session";
}
function readToken(request: Request) {
  const name = cookieName(request);
  const matches = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.startsWith(`${name}=`));
  if (matches.length !== 1) return null;
  const token = matches[0].slice(name.length + 1);
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export function sessionCookie(request: Request, token: string, maxAge = TTL) {
  const secure = new URL(request.url).protocol === "https:";
  // Production always uses HTTPS + the __Host- prefix (no Domain attribute).
  return `${cookieName(request)}=${token}; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
export function sessionTokenHash(request: Request) {
  const token = readToken(request);
  return token ? tokenHash(token) : null;
}
export async function identity(
  request: Request,
): Promise<AccountIdentity | null> {
  const token = readToken(request);
  if (!token) return null;
  return new SessionRepository(database()).resolve(tokenHash(token));
}
// Seconds since the current session was issued. Rows from before 0009 have no
// created_at; the TTL has always been fixed, so expires_at - TTL is exact.
export async function sessionAgeSeconds(request: Request) {
  const token = readToken(request);
  if (!token) return null;
  const row = await database().prepare("SELECT created_at, expires_at FROM sessions WHERE token_hash=?")
    .bind(tokenHash(token)).first<{ created_at: number | null; expires_at: number }>();
  if (!row) return null;
  return (Date.now() - (row.created_at ?? row.expires_at - TTL * 1000)) / 1000;
}
export async function issueSession(
  request: Request,
  userId: string,
  version: number,
  expectedMode: AuthMode,
  method: SessionMethod = "password",
) {
  const db = database();
  const mode = await new AuthRepository(db).mode();
  if (mode !== expectedMode) throw new HttpError(503, "Accesso temporaneamente sospeso. Riprova.", "AUTH_UNAVAILABLE");
  const token = randomToken(), now = Date.now();
  const sessions = new SessionRepository(db);
  const written = await sessions.insert({
    hash: tokenHash(token), userId, version, expiresAt: now + TTL * 1000,
    method, client: clientCode(request.headers), gate: authWriteGate(mode),
  }, now);
  if (written !== 1)
    throw new HttpError(401, "Credenziali cambiate. Accedi di nuovo.");
  // Periodic opportunistic cleanup; no personal data or tokens in logs.
  // Also keeps the account within MAX_SESSIONS: the new session is the newest.
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE expires_at<?").bind(now),
    db.prepare("DELETE FROM auth_limits WHERE expires_at<?").bind(now),
    ...sessions.pruneStatements(userId, now),
  ]);
  return sessionCookie(request, token);
}
export async function revokeSession(request: Request) {
  const token = readToken(request);
  if (token)
    await database()
      .prepare("DELETE FROM sessions WHERE token_hash=?")
      .bind(tokenHash(token))
      .run();
}

export async function rateLimit(
  request: Request,
  username: string,
  action: string,
) {
  const now = Date.now(),
    windowMs = 15 * 60 * 1000,
    bucket = Math.floor(now / windowMs);
  // CF-Connecting-IP is supplied by the edge; never trust arbitrary X-Forwarded-For.
  // A missing edge address uses a shared restrictive bucket, not an unrestricted bypass.
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const buckets: [string, number][] = [
    [`ip:${ip}`, 40],
    [`user:${username}`, 12],
    [`global`, 400],
  ];
  const results = await database().batch(
    buckets.map(([key]) =>
      database()
        .prepare(
          `INSERT INTO auth_limits (key,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts`,
        )
        .bind(tokenHash(`${action}:${key}:${bucket}`), (bucket + 1) * windowMs),
    ),
  );
  if (
    results.some(
      (result, i) =>
        Number((result.results[0] as { attempts: number })?.attempts) >
        buckets[i][1],
    )
  )
    throw new HttpError(429, "Troppi tentativi. Riprova tra 15 minuti.");
}
