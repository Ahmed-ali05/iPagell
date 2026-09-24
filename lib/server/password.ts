import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";

// OWASP's 16 MiB scrypt profile fits Workers' 128 MiB isolate budget.
// Hash parameters are versioned; no bespoke cryptographic construction.
const N = 16384,
  r = 8,
  p = 5,
  SIZE = 32;
const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
let hashing = false;
export class HashBusyError extends Error {}
async function derive(password: string, salt: Buffer): Promise<Buffer> {
  // Reject overload instead of allocating many memory-hard jobs in one isolate.
  if (hashing) throw new HashBusyError("Riprova tra qualche secondo");
  hashing = true;
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
    hashing = false;
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
// Fixed public dummy record equalizes the KDF cost of unknown usernames.
export const DUMMY_HASH = `scrypt$${N}$${r}$${p}$${"0".repeat(32)}$${"0".repeat(64)}`;
export const randomToken = () => toHex(randomBytes(32));
export const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
