import test from "node:test";
import assert from "node:assert/strict";
import { createDiarySession } from "../lib/diary-session";
import { LocalConflictError, sameLocal, type LocalDiary } from "../lib/account-storage";
import { requestJson, RequestError } from "../lib/client-http";
import { createDiary } from "../lib/new-diary";

function fixture(id = "account-a"): LocalDiary {
  return { ...createDiary({ name: id, school: "", semester: "S1", schoolYear: "2026/27", startDate: "2026-08-01", endDate: "2027-01-31", preset: "basic" }), revision: 1, dirty: false, user: { id, username: id } };
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => { resolve = r; });
  return { promise, resolve };
}
function harness() {
  const a = fixture();
  const env = {
    remote: structuredClone(a), disk: new Map<string, LocalDiary>(), active: null as string | null,
    online: true, getError: null as Error | null, saveError: null as Error | null,
    readError: null as Error | null, activateError: null as Error | null,
    putError: null as Error | null, loseAck: false, puts: 0, logouts: 0,
    beforeGet: async () => {}, beforePut: async () => {}, beforeSave: async () => {},
  };
  const io = {
    request: (async (path: string, init?: RequestInit) => {
      if (path === "/api/account") {
        const remote = structuredClone(env.remote);
        await env.beforeGet();
        if (env.getError) throw env.getError;
        return { user: remote.user, diary: { data: remote.data, preferences: remote.preferences, revision: remote.revision } };
      }
      if (path === "/api/auth/logout") { env.logouts++; return {}; }
      assert.equal(path, "/api/diary");
      env.puts++;
      await env.beforePut();
      if (env.putError) throw env.putError;
      const body = JSON.parse(String(init?.body));
      if (body.expectedUserId !== env.remote.user.id) throw new RequestError(401, "account changed");
      if (body.revision !== env.remote.revision) throw new RequestError(409, "concurrent change");
      env.remote = { ...env.remote, ...body.diary, revision: env.remote.revision + 1 };
      if (env.loseAck) { env.loseAck = false; throw new TypeError("lost response"); }
      return { revision: env.remote.revision };
    }) as typeof requestJson,
    read: async (id: string) => {
      if (env.readError) throw env.readError;
      return structuredClone(env.disk.get(id) ?? null);
    },
    save: async (value: LocalDiary, expected: LocalDiary | null) => {
      await env.beforeSave();
      if (env.saveError) throw env.saveError;
      if (!sameLocal(env.disk.get(value.user.id) ?? null, expected)) throw new LocalConflictError();
      env.disk.set(value.user.id, structuredClone(value));
    },
    active: () => env.active,
    activate: (id: string | null) => { if (env.activateError) throw env.activateError; env.active = id; },
    forget: async (id?: string, expected?: LocalDiary | null) => {
      if (id && !sameLocal(env.disk.get(id) ?? null, expected ?? null)) throw new LocalConflictError();
      if (id) env.disk.delete(id);
      env.active = null;
    },
    online: () => env.online,
  };
  return { env, session: createDiarySession(io), another: () => createDiarySession(io) };
}

test("offline edits survive reopen and reconnect; no success before durable save", async () => {
  const { env, session, another } = harness();
  await session.reload();
  env.online = false;
  await session.commit(d => d, { studentName: "Offline draft" });
  assert.equal(session.getState().status, "offline");
  assert.equal(env.disk.get(env.active!)?.dirty, true);
  env.getError = new TypeError("offline");
  const reopened = another();
  await reopened.reload();
  assert.equal(reopened.getState().diary?.preferences.studentName, "Offline draft");
  env.online = true;
  env.getError = null;
  await reopened.retry();
  assert.equal(reopened.getState().status, "saved");
  assert.equal(env.remote.preferences.studentName, "Offline draft");
  assert.equal(env.disk.get(env.active!)?.dirty, false);
});

test("two offline tabs cannot overwrite the other tab's pending draft", async () => {
  const { env, session, another } = harness();
  await session.reload();
  const second = another();
  await second.reload();
  env.online = false;
  await session.commit(d => d, { studentName: "First tab" });
  await assert.rejects(second.commit(d => d, { studentName: "Second tab" }), LocalConflictError);
  assert.equal(second.getState().status, "device-conflict");
  assert.equal(env.disk.get(env.active!)?.preferences.studentName, "First tab");
  await second.reload();
  await second.commit(d => d, { school: "Second tab addition" });
  assert.equal(second.getState().diary?.preferences.studentName, "First tab");
  assert.equal(second.getState().diary?.preferences.school, "Second tab addition");
});

test("refresh and commit share a queue: a delayed GET cannot erase an edit", async () => {
  const { env, session } = harness();
  await session.reload();
  const gate = deferred();
  env.beforeGet = () => gate.promise;
  const reload = session.reload();
  const commit = session.commit(d => d, { studentName: "Must survive" });
  gate.resolve();
  await Promise.all([reload, commit]);
  assert.equal(env.remote.preferences.studentName, "Must survive");
  assert.equal(session.getState().diary?.preferences.studentName, "Must survive");
});

test("lost response after remote commit is reconciled without a second write", async () => {
  const { env, session } = harness();
  await session.reload();
  env.loseAck = true;
  await session.commit(d => d, { studentName: "Committed once" });
  assert.equal(session.getState().diary?.dirty, true);
  assert.equal(env.remote.revision, 2);
  await session.retry();
  assert.equal(session.getState().status, "saved");
  assert.equal(session.getState().diary?.revision, 2);
  assert.equal(env.remote.revision, 2);
});

test("reopen also reconciles a lost acknowledgement; a real conflict stays dirty", async () => {
  const { env, session, another } = harness();
  await session.reload();
  env.loseAck = true;
  await session.commit(d => d, { studentName: "Committed once" });
  const reopened = another();
  await reopened.reload();
  assert.equal(reopened.getState().status, "saved");
  env.remote.preferences.studentName = "Other device";
  env.remote.revision++;
  await reopened.commit(d => d, { studentName: "Local choice" });
  assert.equal(reopened.getState().status, "conflict");
  assert.equal(env.remote.preferences.studentName, "Other device");
  assert.equal(env.disk.get(env.active!)?.preferences.studentName, "Local choice");
  assert.equal(env.disk.get(env.active!)?.dirty, true);
});

test("storage failure after identifying B never falls back to account A", async () => {
  for (const failure of ["readError", "saveError", "activateError"] as const) {
    const { env, session } = harness();
    await session.reload();
    const original = structuredClone(env.disk.get(env.active!)!);
    env.remote = fixture("account-b");
    env[failure] = new Error("storage unavailable");
    await session.reload();
    assert.equal(session.getState().phase, "error");
    assert.equal(session.getState().user?.id, "account-b");
    assert.equal(session.getState().diary, null);
    assert.deepEqual(env.disk.get(original.user.id), original);
  }
});

test("quota error does not publish or mutate data, even for an impure recipe", async () => {
  const { env, session } = harness();
  await session.reload();
  const before = structuredClone(session.getState().diary);
  env.saveError = new DOMException("Storage pieno", "QuotaExceededError");
  await assert.rejects(session.commit(d => { d.subjects[0].name = "Changed in place"; return d; }), /Storage pieno/);
  assert.deepEqual(session.getState().diary, before);
  assert.deepEqual(env.disk.get(env.active!), before);
  assert.equal(env.puts, 0);
  assert.equal(session.getState().status, "error");
});

test("storage failure after server success keeps dirty data and reports an error", async () => {
  const { env, session } = harness();
  await session.reload();
  env.beforePut = async () => { env.saveError = new Error("disk failed"); };
  await session.commit(d => d, { studentName: "Recoverable" });
  assert.equal(session.getState().status, "error");
  assert.equal(session.getState().diary?.dirty, true);
  assert.equal(env.remote.preferences.studentName, "Recoverable");
  env.beforePut = async () => {};
  env.saveError = null;
  await session.retry();
  assert.equal(session.getState().status, "saved");
});

test("401 during a mutation preserves the draft and blocks further edits", async () => {
  const { env, session } = harness();
  await session.reload();
  env.putError = new RequestError(401, "Sessione scaduta");
  await session.commit(d => d, { studentName: "Safe draft" });
  assert.equal(session.getState().status, "expired");
  assert.equal(env.disk.get(env.active!)?.preferences.studentName, "Safe draft");
  await assert.rejects(session.commit(d => d), /Accedi/);
});

test("401 and 503 never become offline logins; an open draft remains accessible", async () => {
  for (const status of [401, 503]) {
    const { env, session, another } = harness();
    await session.reload();
    env.online = false;
    await session.commit(d => d, { studentName: "Safe draft" });
    env.getError = new RequestError(status, "unavailable");
    await session.reload();
    assert.equal(session.getState().diary?.preferences.studentName, "Safe draft");
    assert.equal(session.getState().status, status === 401 ? "expired" : "error");
    const reopened = another();
    await reopened.reload();
    assert.equal(reopened.getState().diary, null);
    assert.equal(reopened.getState().phase, status === 401 ? "anonymous" : "error");
  }
});

test("account transition invalidates in-flight responses and queued edits", async () => {
  const { env, session } = harness();
  await session.reload();
  const entered = deferred(), release = deferred();
  env.beforePut = async () => { entered.resolve(); await release.promise; };
  const first = session.commit(d => d, { studentName: "Account A draft" });
  await entered.promise;
  const queued = session.commit(d => d, { studentName: "Stale queued edit" });
  session.reauthenticate();
  env.remote = fixture("account-b");
  const login = session.reload();
  release.resolve();
  await first;
  await assert.rejects(queued, /sessione è cambiata/);
  await login;
  assert.equal(session.getState().user?.id, "account-b");
  assert.equal(session.getState().status, "saved");
  assert.equal(env.disk.get("account-a")?.preferences.studentName, "Account A draft");
});

test("another tab changing account invalidates responses and cannot be logged out", async () => {
  const { env, session } = harness();
  await session.reload();
  env.active = "account-b";
  session.accountChanged();
  assert.equal(session.getState().status, "expired");
  await assert.rejects(session.commit(d => d), /Accedi/);
  await assert.rejects(session.logout(true), /account attivo/);
  assert.equal(env.logouts, 0);
});

test("logout and use-server cannot discard a draft written by another tab", async () => {
  const { env, session, another } = harness();
  await session.reload();
  const second = another();
  await second.reload();
  env.online = false;
  await second.commit(d => d, { studentName: "Other tab draft" });
  await assert.rejects(session.logout(true), LocalConflictError);
  await assert.rejects(session.useServer(), LocalConflictError);
  assert.equal(session.getState().status, "device-conflict");
  assert.equal(env.disk.get(env.active!)?.preferences.studentName, "Other tab draft");
  assert.equal(env.logouts, 0);
  await assert.rejects(second.logout(), /Esporta/);
});

test("a GET started before another tab's save cannot roll back its newer revision", async () => {
  const { env, session } = harness();
  await session.reload();
  env.beforeGet = async () => {
    const newer = structuredClone(env.remote);
    newer.revision++;
    newer.preferences.studentName = "Newer committed value";
    env.disk.set(newer.user.id, newer);
  };
  await session.reload();
  assert.equal(session.getState().diary?.preferences.studentName, "Newer committed value");
  assert.equal(env.disk.get(env.active!)?.revision, 2);
});

test("HTTP errors preserve their status even with HTML or malformed JSON", async (t) => {
  for (const status of [401, 503, 200]) {
    for (const type of ["text/html", "application/json"]) {
      t.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
        assert.ok(init.signal, "all requests have a timeout");
        return new Response("invalid response", { status, headers: { "Content-Type": type } });
      });
      await assert.rejects(requestJson("/api/account"), (e: unknown) => e instanceof RequestError && e.status === (status === 200 ? 502 : status));
      t.mock.restoreAll();
    }
  }
});

test("unmount invalidates a pending load and cannot reactivate its account", async () => {
  const { env, session } = harness();
  const entered = deferred(), release = deferred();
  env.beforeGet = async () => { entered.resolve(); await release.promise; };
  const loading = session.reload();
  await entered.promise;
  session.cancelPending();
  env.active = "account-b";
  release.resolve();
  await loading;
  assert.equal(env.active, "account-b");
  assert.equal(session.getState().diary, null);
});
