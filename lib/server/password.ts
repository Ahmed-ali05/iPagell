import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { HttpError } from "./http";

// OWASP's 16 MiB scrypt profile fits Workers' 128 MiB isolate budget.
// Hash parameters are versioned; no bespoke cryptographic construction.
const N = 16384,
  r = 8,
  p = 5,
  SIZE = 32;
const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
export class HashBusyError extends HttpError {
  constructor() {
    super(503, "Accesso momentaneamente occupato. Riprova tra qualche secondo.", "AUTH_BUSY");
  }
}
// A Worker stopped for CPU or wall time never runs `finally`, so a claim must
// expire on its own. Normal derivations end well below this threshold.
export const HASH_CLAIM_STALE_MS = 10_000;
let claim: { since: number } | null = null;
// Reject overload instead of allocating many memory-hard jobs in one isolate.
// The returned release only clears its own claim, never a newer one.
export function acquireHashSlot(now = Date.now()): () => void {
  if (claim && now - claim.since < HASH_CLAIM_STALE_MS) throw new HashBusyError();
  const own = { since: now };
  claim = own;
  return () => {
    if (claim === own) claim = null;
  };
}
async function derive(password: string, salt: Buffer): Promise<Buffer> {
  const release = acquireHashSlot();
  try {
    return await new Promise<Buffer>((resolve, reject) =>
      scrypt(
        password,
        salt,
        SIZE,
        { N, r, p, maxmem: 32 * 1024 * 1024 },
        (error, key) => (error ? reject(error) : resolve(key)),
      ),
    );
  } finally {
    release();
  }
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derive(password, salt);
  return `scrypt$${N}$${r}$${p}$${toHex(salt)}$${toHex(hash)}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split("$");
  if (
    parts.length !== 6 ||
    parts[0] !== "scrypt" ||
    Number(parts[1]) !== N ||
    Number(parts[2]) !== r ||
    Number(parts[3]) !== p ||
    !/^[a-f0-9]{32}$/.test(parts[4]) ||
    !/^[a-f0-9]{64}$/.test(parts[5])
  )
    return false;
  const actual = await derive(password, Buffer.from(parts[4], "hex"));
  return timingSafeEqual(actual, Buffer.from(parts[5], "hex"));
}
// Explicit "no password" marker for accounts created with Google. It is not a
// hash: verifyPassword rejects it on format, before any KDF, so it never matches.
// accounts.password_hash stays NOT NULL because D1 cannot relax it without
// rebuilding a table with cascading children (owner decision, 18 Nov 2026).
export const NO_PASSWORD = "none$google";
// Fixed public dummy record equalizes the KDF cost of unknown usernames.
export const DUMMY_HASH = `scrypt$${N}$${r}$${p}$${"0".repeat(32)}$${"0".repeat(64)}`;
export const randomToken = () => toHex(randomBytes(32));
export const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
