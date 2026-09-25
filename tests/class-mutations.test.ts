import test from "node:test";
import assert from "node:assert/strict";
import { PendingActions } from "../lib/classes/pending-actions";
import { ClassAgendaCoordinator } from "../lib/classes/agenda-coordinator";
import { refreshAfterConfirmedMutation } from "../lib/classes/confirmed-refresh";
import type { ClassSubscription } from "../lib/classes/events";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function subscription(id: string, revision = 1, completed = false): ClassSubscription {
  return { id, semesterId: "semester", subjectId: "", completed, reminder: false, revision, detachedAt: null,
    event: { id: `event-${id}`, classId: "class", className: "3A", authorId: "author", authorName: "A", subject: "Fisica", kind: "task", title: id, description: "", dueAt: "2026-10-10T08:00:00.000Z", status: "active", revision: 1, updatedAt: 1 } };
}

test("same UI action starts once before React renders; independent keys run together", async () => {
  const actions = new PendingActions();
  for (const key of ["class:create", "class:one:event:create", "class:one:invite:create"]) {
    const gate = deferred<number>();
    let writes = 0;
    const first = actions.run(key, () => { writes++; return gate.promise; });
    const second = actions.run(key, () => { writes++; return Promise.resolve(2); });
    assert.equal(actions.has(key), true);
    assert.deepEqual(await second, { started: false });
    assert.equal(writes, 1);
    gate.resolve(1);
    assert.deepEqual(await first, { started: true, value: 1 });
    assert.equal(actions.has(key), false);
  }
  const a = deferred<void>(), b = deferred<void>();
  const first = actions.run("class:one:member:a", () => a.promise);
  const second = actions.run("class:one:member:b", () => b.promise);
  assert.equal(actions.has("class:one:member:a"), true);
  assert.equal(actions.has("class:one:member:b"), true);
  a.resolve(); b.resolve();
  await Promise.all([first, second]);
  const failing = actions.run("class:create", () => Promise.reject(new Error("network")));
  await assert.rejects(failing, /network/);
  assert.equal(actions.has("class:create"), false);
});

test("a confirmed class creation or join is not reported as a failed write when its refresh fails", async () => {
  const actions = new PendingActions();
  for (const key of ["class:create", "class:join"]) {
    let writes = 0, confirmed = 0, refreshErrors = 0;
    const result = await actions.run(key, async () => {
      writes++;
      const response = { id: "created" }; // POST 201
      confirmed++;
      await refreshAfterConfirmedMutation(
        () => Promise.reject(new Error("GET failed")),
        () => { refreshErrors++; },
      );
      return response;
    });
    assert.deepEqual(result, { started: true, value: { id: "created" } });
    assert.equal(writes, 1);
    assert.equal(confirmed, 1);
    assert.equal(refreshErrors, 1);
    assert.equal(actions.has(key), false);
  }
});

function harness() {
  let items = [subscription("a"), subscription("b")];
  const responses = new Map<string, ReturnType<typeof deferred<{ subscriptions: ClassSubscription[] }>>>();
  const pending: ReadonlySet<string>[] = [];
  const reads: Array<() => Promise<{ subscriptions: ClassSubscription[] }>> = [];
  const coordinator = new ClassAgendaCoordinator({
    read: () => reads.shift()?.() ?? Promise.resolve({ subscriptions: items }),
    write: (path) => {
      const request = deferred<{ subscriptions: ClassSubscription[] }>();
      responses.set(path, request);
      return request.promise;
    },
    current: () => items,
    publish: (next) => { items = next; },
    readError: () => undefined,
    pendingChanged: (keys) => { pending.push(keys); },
  });
  return { coordinator, responses, reads, pending, get items() { return items; } };
}

test("duplicate subscription update sends one request and releases pending after reconciliation", async () => {
  const h = harness();
  const first = h.coordinator.run("subscription:a", { kind: "subscription", id: "a" }, "/a", "PATCH", { revision: 1, completed: true });
  assert.equal(h.coordinator.hasPending("subscription:a"), true);
  assert.equal(await h.coordinator.run("subscription:a", { kind: "subscription", id: "a" }, "/a", "PATCH", { revision: 1, completed: true }), false);
  await Promise.resolve();
  assert.equal(h.responses.size, 1);
  h.reads.push(() => Promise.resolve({ subscriptions: [subscription("a", 2, true), subscription("b")] }));
  h.responses.get("/a")!.resolve({ subscriptions: [subscription("a", 2, true), subscription("b")] });
  assert.equal(await first, true);
  assert.equal(h.coordinator.hasPending("subscription:a"), false);
  assert.equal(h.items[0].completed, true);
});

test("independent writes and reversed full snapshots cannot roll back UI or cache", async () => {
  const h = harness();
  const a = h.coordinator.run("subscription:a", { kind: "subscription", id: "a" }, "/a", "PATCH", { revision: 1, completed: true });
  const b = h.coordinator.run("subscription:b", { kind: "subscription", id: "b" }, "/b", "PATCH", { revision: 1, completed: true });
  await Promise.resolve();
  assert.equal(h.responses.size, 2);
  h.reads.push(() => Promise.resolve({ subscriptions: [subscription("a", 2, true), subscription("b", 2, true)] }));
  h.responses.get("/b")!.resolve({ subscriptions: [subscription("a"), subscription("b", 2, true)] });
  await Promise.resolve();
  assert.equal(h.items.find(item => item.id === "b")!.completed, true);
  assert.equal(h.coordinator.hasPending("subscription:b"), true);
  h.responses.get("/a")!.resolve({ subscriptions: [subscription("a", 2, true), subscription("b")] });
  await Promise.all([a, b]);
  assert.deepEqual(h.items.map(item => item.completed), [true, true]);
  assert.equal(h.pending.at(-1)?.size, 0);
});

test("an early response stays pending until the final read finishes", async () => {
  const h = harness();
  const read = deferred<{ subscriptions: ClassSubscription[] }>();
  h.reads.push(() => read.promise);
  const a = h.coordinator.run("subscription:a", { kind: "subscription", id: "a" }, "/a", "PATCH", { revision: 1 });
  const b = h.coordinator.run("subscription:b", { kind: "subscription", id: "b" }, "/b", "PATCH", { revision: 1 });
  await Promise.resolve();
  h.responses.get("/b")!.resolve({ subscriptions: [subscription("a"), subscription("b", 2, true)] });
  await Promise.resolve();
  assert.equal(h.coordinator.hasPending("subscription:b"), true);
  h.responses.get("/a")!.resolve({ subscriptions: [subscription("a", 2, true), subscription("b")] });
  await Promise.resolve();
  assert.equal(h.coordinator.hasPending("subscription:a"), true);
  assert.equal(h.coordinator.hasPending("subscription:b"), true);
  read.resolve({ subscriptions: [subscription("a", 2, true), subscription("b", 2, true)] });
  await Promise.all([a, b]);
  assert.equal(h.coordinator.hasPending("subscription:a"), false);
  assert.equal(h.coordinator.hasPending("subscription:b"), false);
});

test("409 reconciles revision; stale retry is rejected before another write", async () => {
  const h = harness();
  const first = h.coordinator.run("subscription:a", { kind: "subscription", id: "a" }, "/a", "PATCH", { revision: 1, completed: true });
  await Promise.resolve();
  h.reads.push(() => Promise.resolve({ subscriptions: [subscription("a", 2, true), subscription("b")] }));
  h.responses.get("/a")!.reject(new Error("409"));
  await assert.rejects(first, /409/);
  assert.equal(h.coordinator.hasPending("subscription:a"), false);
  assert.equal(h.items[0].revision, 2);
  await assert.rejects(h.coordinator.run("subscription:a", { kind: "subscription", id: "a" }, "/a", "PATCH", { revision: 1, completed: true }), /versione corrente/);
  assert.equal(h.responses.size, 1);
});

test("confirmed mutation remains successful when the following read fails", async () => {
  const h = harness();
  const first = h.coordinator.run("subscription:a", { kind: "subscription", id: "a" }, "/a", "PATCH", { revision: 1, completed: true });
  await Promise.resolve();
  h.reads.push(() => Promise.reject(new Error("refresh failed")));
  h.responses.get("/a")!.resolve({ subscriptions: [subscription("a", 2, true), subscription("b")] });
  assert.equal(await first, true);
  assert.equal(h.items[0].completed, true);
  assert.equal(h.coordinator.hasPending("subscription:a"), false);
});

test("network or server error releases pending and does not reuse an uncertain revision", async () => {
  const h = harness();
  const first = h.coordinator.run("subscription:a", { kind: "subscription", id: "a" }, "/a", "PATCH", { revision: 1, completed: true });
  await Promise.resolve();
  h.reads.push(() => Promise.reject(new Error("offline")));
  h.responses.get("/a")!.reject(new Error("server unavailable"));
  await assert.rejects(first, /server unavailable/);
  assert.equal(h.coordinator.hasPending("subscription:a"), false);
  assert.equal(h.coordinator.isBlocked("subscription:a"), true);
  await assert.rejects(h.coordinator.run("subscription:a", { kind: "subscription", id: "a" }, "/a", "PATCH", { revision: 1 }), /Aggiorna/);
  h.reads.push(() => Promise.resolve({ subscriptions: [subscription("a", 2, true), subscription("b")] }));
  await h.coordinator.refresh();
  assert.equal(h.coordinator.isBlocked("subscription:a"), false);
  assert.equal(h.items[0].revision, 2);
});
