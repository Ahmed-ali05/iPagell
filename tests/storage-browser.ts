import { activateAccount, activeAccountId, readLocal, saveLocal, forgetLocal, LocalConflictError, type LocalDiary } from "../lib/account-storage";
import { createDiary } from "../lib/new-diary";

const output = document.querySelector("pre")!;
const report = (message: string) => { output.textContent += `${message}\n`; };
function check(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
  report(`PASS ${message}`);
}
const user = { id: `storage-test-${crypto.randomUUID()}`, username: "synthetic" };
const original: LocalDiary = {
  ...createDiary({ name: "Synthetic storage test", school: "", semester: "S1", schoolYear: "2026/27", startDate: "2026-08-01", endDate: "2027-01-31", preset: "empty" }),
  user, revision: 1, dirty: false,
};
async function run() {
  // Run only on the dedicated test origin, never the application preview origin.
  activateAccount(user.id);
  await saveLocal(original, null);
  check((await readLocal(user.id))?.revision === 1, "save resolves after IndexedDB transaction commits");
  const first = { ...original, dirty: true, preferences: { ...original.preferences, studentName: "First writer" } };
  const second = { ...original, dirty: true, preferences: { ...original.preferences, studentName: "Second writer" } };
  const results = await Promise.allSettled([saveLocal(first, original), saveLocal(second, original)]);
  check(results.filter(r => r.status === "fulfilled").length === 1, "exactly one concurrent writer succeeds");
  check(results.some(r => r.status === "rejected" && r.reason instanceof LocalConflictError), "stale writer receives a local conflict");
  const winner = await readLocal(user.id);
  check(winner?.dirty && ["First writer", "Second writer"].includes(winner.preferences.studentName), "pending draft survives concurrent writes");
  try { await forgetLocal(user.id, original); throw new Error("stale delete succeeded"); }
  catch (e) { check(e instanceof LocalConflictError, "stale logout cannot erase the pending draft"); }
  check((await readLocal(user.id))?.dirty, "draft survives rejected delete");
  activateAccount("synthetic-other-account");
  await saveLocal({ ...winner!, revision: 2, dirty: false }, winner);
  check(activeAccountId() === "synthetic-other-account", "late save cannot reactivate the previous account");
  const latest = await readLocal(user.id);
  const originalPut = IDBObjectStore.prototype.put;
  try {
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore["put"]>) {
      const request = originalPut.apply(this, args);
      request.addEventListener("success", () => this.transaction.abort());
      return request;
    };
    let rejected = false;
    try { await saveLocal({ ...latest!, dirty: true }, latest); } catch { rejected = true; }
    check(rejected, "request success followed by transaction abort is not acknowledged");
    check((await readLocal(user.id))?.dirty === false, "aborted transaction leaves the committed snapshot intact");
  } finally { IDBObjectStore.prototype.put = originalPut; }
  await forgetLocal(user.id, latest);
  check(activeAccountId() === "synthetic-other-account", "cleanup of old account preserves active account pointer");
  report("DONE: 10 browser storage checks passed");
}
void run().catch(error => { report(`FAIL ${String(error)}`); });
