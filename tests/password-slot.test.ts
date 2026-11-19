import test from "node:test";
import assert from "node:assert/strict";
import { HASH_CLAIM_STALE_MS, HashBusyError, acquireHashSlot, hashPassword, verifyPassword } from "../lib/server/password";
import { HttpError } from "../lib/server/http";
import { apiErrorKey } from "../lib/i18n/errors";

test("a fresh hashing claim rejects a second job with a coded 503", () => {
  const release = acquireHashSlot(1_000);
  try {
    assert.throws(() => acquireHashSlot(1_001), (error: unknown) =>
      error instanceof HashBusyError && error instanceof HttpError && error.status === 503 && error.code === "AUTH_BUSY");
  } finally { release(); }
  acquireHashSlot(1_002)();
});

test("a claim left by a stopped request expires instead of blocking the isolate", () => {
  const stuck = acquireHashSlot(5_000); // never released, as after exceededCpu
  assert.throws(() => acquireHashSlot(5_000 + HASH_CLAIM_STALE_MS - 1), HashBusyError);
  const fresh = acquireHashSlot(5_000 + HASH_CLAIM_STALE_MS);
  // The late release of the stuck claim must not free the newer one.
  stuck();
  assert.throws(() => acquireHashSlot(5_000 + HASH_CLAIM_STALE_MS + 1), HashBusyError);
  fresh();
  acquireHashSlot(5_000 + HASH_CLAIM_STALE_MS + 2)();
});

test("hashing still works and releases its slot", async () => {
  const hash = await hashPassword("Synthetic slot password 2026!");
  assert.equal(await verifyPassword("Synthetic slot password 2026!", hash), true);
  acquireHashSlot()();
});

test("busy and unavailable codes map to localized messages", () => {
  assert.equal(apiErrorKey("AUTH_BUSY"), "auth.busy");
  assert.equal(apiErrorKey("AUTH_UNAVAILABLE"), "auth.unavailable");
});
