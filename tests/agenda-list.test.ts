import { test } from "node:test";
import assert from "node:assert/strict";
import { groupAgendaItems, isOpenActivity, localAgendaDay, orderAgendaItems } from "../lib/agenda-list";
import { subscriptionAgenda, type ClassSubscription } from "../lib/classes/events";
import type { AgendaItem } from "../types/domain";

const item = (id: string, dueAt: string, completed = false): AgendaItem => ({
  id, dueAt, completed, title: id, subjectId: "math", semesterId: "period", kind: "task",
});
const subscription = (id: string, status: "active" | "cancelled", completed = false, detachedAt: number | null = null): ClassSubscription => ({
  id, completed, detachedAt, reminder: true, revision: 1, semesterId: "period", subjectId: "math",
  event: { id, classId: "class", className: "Class", authorId: "author", authorName: "Author", revision: 1, updatedAt: 1,
    status, title: id, subject: "Math", kind: "task", dueAt: "2026-10-13T12:00:00Z", description: "" },
});

test("completed history never precedes open work, cancelled overrides completion, detached active stays open", () => {
  const shared = subscriptionAgenda([subscription("cancelled", "cancelled"), subscription("both", "cancelled", true), subscription("detached", "active", false, 1)]);
  const source = [item("done", "2026-09-01T12:00:00Z", true), item("open", "2026-10-14T12:00:00Z"), ...shared];
  const groups = groupAgendaItems(source, new Date("2026-10-10T12:00:00Z"));
  assert.deepEqual(groups.upcoming.map(i => i.id), ["class:detached", "open"]);
  assert.deepEqual(groups.completed.map(i => i.id), ["done"]);
  assert.deepEqual(groups.cancelled.map(i => i.id), ["class:both", "class:cancelled"]);
  assert.deepEqual(source.filter(isOpenActivity).map(i => i.id), ["open", "class:detached"]);
  assert.equal(source[0].id, "done");
  assert.equal(shared[0].completed, false);
});

test("local day boundaries include earlier hours today, midnight and DST without UTC misclassification", () => {
  const previous = process.env.TZ;
  process.env.TZ = "Europe/Zurich";
  try {
    const now = new Date("2026-10-24T22:30:00Z"); // 00:30 on the DST-change day locally.
    const groups = groupAgendaItems([
      item("yesterday", "2026-10-24T21:59:59Z"),
      item("earlier-today", "2026-10-24T22:00:00Z"),
      item("later-today", "2026-10-25T22:59:59Z"),
      item("tomorrow", "2026-10-25T23:00:00Z"),
    ], now);
    assert.equal(localAgendaDay(now), "2026-10-25");
    assert.deepEqual(groups.overdue.map(i => i.id), ["yesterday"]);
    assert.deepEqual(groups.today.map(i => i.id), ["earlier-today", "later-today"]);
    assert.deepEqual(groups.upcoming.map(i => i.id), ["tomorrow"]);
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test("sort compares instants with offsets and ties remain deterministic; history uses latest due date", () => {
  const source = [item("z", "2026-10-11T10:00:00Z"), item("early", "2026-10-11T11:00:00+02:00"), item("a", "2026-10-11T10:00:00Z")];
  assert.deepEqual(orderAgendaItems(source).map(i => i.id), ["early", "a", "z"]);
  assert.deepEqual(orderAgendaItems(source, true).map(i => i.id), ["a", "z", "early"]);
  const groups = groupAgendaItems(source.map(i => ({ ...i, completed: true })), new Date("2026-10-10T12:00:00Z"));
  assert.deepEqual(groups.completed.map(i => i.id), ["a", "z", "early"]);
});

test("completion, reopening and midnight reclassify without losing activities; empty filters stay empty", () => {
  const source = [item("task", "2026-10-10T12:00:00Z")];
  assert.equal(groupAgendaItems(source, new Date("2026-10-10T08:00:00Z")).today.length, 1);
  const done = source.map(i => ({ ...i, completed: true }));
  assert.equal(groupAgendaItems(done, new Date("2026-10-10T08:00:00Z")).completed.length, 1);
  assert.equal(groupAgendaItems(source, new Date("2026-10-11T08:00:00Z")).overdue.length, 1);
  assert.deepEqual(Object.values(groupAgendaItems([], new Date())).flat(), []);
});

test("large history counts every item without hiding outstanding past work or changing input", () => {
  const source = Array.from({ length: 1500 }, (_, n) => item(`done-${n}`, "2026-09-01T12:00:00Z", true));
  source.push(item("past-open", "2026-09-01T12:00:00Z"), item("next-open", "2026-10-13T12:00:00Z"));
  const frozen = Object.freeze(source.map(i => Object.freeze(i)));
  const groups = groupAgendaItems(frozen, new Date("2026-10-10T12:00:00Z"));
  assert.equal(groups.completed.length, 1500);
  assert.equal(groups.overdue[0].id, "past-open");
  assert.equal(groups.upcoming[0].id, "next-open");
  assert.equal(Object.values(groups).flat().length, 1502);
});
