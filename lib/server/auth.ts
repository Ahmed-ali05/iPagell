import { database } from "./db";
import { HttpError } from "./http";
import { randomToken, tokenHash } from "./password";
import type { AccountIdentity } from "@/types/domain";

const TTL = 14 * 24 * 60 * 60;
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
export async function identity(
  request: Request,
): Promise<AccountIdentity | null> {
  const token = readToken(request);
  if (!token) return null;
  return database()
    .prepare(
      `SELECT a.id, a.username FROM sessions s JOIN accounts a ON a.id=s.user_id AND a.auth_version=s.auth_version WHERE s.token_hash=? AND s.expires_at>?`,
    )
    .bind(tokenHash(token), Date.now())
    .first<AccountIdentity>();
}
export async function issueSession(
  request: Request,
  userId: string,
  version: number,
) {
  const token = randomToken();
  const db = database();
  const result = await db
    .prepare(
      `INSERT INTO sessions (token_hash,user_id,auth_version,expires_at) SELECT ?,id,auth_version,? FROM accounts WHERE id=? AND auth_version=?`,
    )
    .bind(tokenHash(token), Date.now() + TTL * 1000, userId, version)
    .run();
  if (result.meta.changes !== 1)
    throw new HttpError(401, "Credenziali cambiate. Accedi di nuovo.");
  // Periodic opportunistic cleanup; no personal data or tokens in logs.
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE expires_at<?").bind(Date.now()),
    db.prepare("DELETE FROM auth_limits WHERE expires_at<?").bind(Date.now()),
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
