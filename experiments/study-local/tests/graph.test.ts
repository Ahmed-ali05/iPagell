import test from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import { LabError, sourceFromText, sha256 } from "../src/source";
import { changeGraph, emptyArchive, exportArchive, importArchive, newId, remapArchive, removeSource, undoGraph, validateArchive, validateOriginals, type Evidence, type Graph } from "../src/graph";
import { commitStudy, readStudy, StudySession, type Snapshot } from "../src/study-store";
Object.defineProperty(globalThis, "indexedDB", { value: indexedDB, configurable: true });
const code = (expected: string) => (error: unknown) => error instanceof LabError && error.code === expected;
async function fixture(): Promise<Snapshot> {
  const text = "La cellula 🧬 produce energia.\n\n<script>sentinella</script>", document = await sourceFromText(text, "Biologia");
  const archive = emptyArchive(); archive.documents.push(document);
  const chunk = document.chunks[0];
  const evidence: Evidence = { documentId: document.id, chunkId: chunk.id, page: chunk.page, start: chunk.start, end: chunk.end, unit: "utf16" };
  archive.graph.nodes.push({ id: newId(), title: "Cellula", summary: "Sintesi manuale", origin: "manual", evidence: [evidence] });
  archive.graph.personal.push({ nodeId: archive.graph.nodes[0].id, note: "Nota privata", state: "studying" });
  return { archive, originals: [{ documentId: document.id, blob: new Blob([text]) }] };
}
const node = (id: string) => ({ id, title: id, summary: "", origin: "manual" as const, evidence: [] });

test("closed graph schema rejects unknown fields, wrong versions, oversized and hostile structures", async () => {
  const { archive } = await fixture(); validateArchive(archive);
  assert.throws(() => validateArchive({ ...archive, tool: "fetch" }), code("GRAPH_INVALID"));
  assert.throws(() => validateArchive({ ...archive, format: "study-graph-v2" }), code("GRAPH_INVALID"));
  const long = structuredClone(archive); long.graph.nodes[0].title = "x".repeat(121); assert.throws(() => validateArchive(long), code("GRAPH_INVALID"));
  const extra = structuredClone(archive); Object.assign(extra.graph.nodes[0], { html: "<script>" }); assert.throws(() => validateArchive(extra), code("GRAPH_INVALID"));
  const hostile = structuredClone(archive); hostile.graph.nodes[0].title = "<img src=x onerror=alert(1)>"; validateArchive(hostile); // Stored text, not executable markup.
  const tooMany = structuredClone(archive); tooMany.graph.nodes = Array.from({ length: 201 }, (_, i) => node(`n${i}`)); assert.throws(() => validateArchive(tooMany), code("GRAPH_INVALID"));
  const polluted = JSON.parse(JSON.stringify(archive).replace('"format":', '"__proto__":{},"format":')); assert.throws(() => validateArchive(polluted), code("GRAPH_INVALID"));
});
test("canonical UTF-16 evidence and extracted chunks fail closed when altered", async () => {
  const { archive } = await fixture();
  for (const alter of [(a: typeof archive) => a.graph.nodes[0].evidence[0].start++, (a: typeof archive) => a.graph.nodes[0].evidence[0].documentId = "missing", (a: typeof archive) => a.documents[0].chunks[0].text = "altered", (a: typeof archive) => a.documents[0].pages[0].number = 2]) {
    const changed = structuredClone(archive); alter(changed); assert.throws(() => validateArchive(changed), code("GRAPH_INVALID"));
  }
});
test("hierarchy rejects cycles/multiple parents/missing endpoints; transverse cycles are allowed", () => {
  const archive = emptyArchive(); archive.graph.nodes = [node("a"), node("b"), node("c")];
  const edge = (id: string, from: string, to: string, type: Graph["edges"][number]["type"] = "hierarchy") => ({ id, from, to, type, evidence: [] });
  archive.graph.edges = [edge("e1", "a", "b"), edge("e2", "b", "a")]; assert.throws(() => validateArchive(archive), code("GRAPH_INVALID"));
  archive.graph.edges = [edge("e1", "a", "b"), edge("e2", "c", "b")]; assert.throws(() => validateArchive(archive), code("GRAPH_INVALID"));
  archive.graph.edges = [edge("e1", "a", "missing")]; assert.throws(() => validateArchive(archive), code("GRAPH_INVALID"));
  archive.graph.edges = [edge("e1", "a", "b", "related"), edge("e2", "b", "a", "related")]; validateArchive(archive);
});
test("undo restores stable IDs, manual text, personal state and evidence; failed edit is immutable", async () => {
  const { archive } = await fixture(), before = structuredClone(archive);
  const edited = changeGraph(archive, "Rinomina", g => { g.nodes[0].title = "Nuovo titolo"; g.personal[0].state = "learned"; });
  assert.deepEqual(archive, before); assert.deepEqual(undoGraph(edited), before);
  assert.throws(() => changeGraph(archive, "Invalid", g => { g.nodes[0].evidence[0].end++; }), code("GRAPH_INVALID")); assert.deepEqual(archive, before);
});
test("source deletion retains alternatives and manual nodes, purges history and cannot be undone", async () => {
  const { archive } = await fixture(), second = await sourceFromText("Fonte alternativa", "Seconda"); archive.documents.push(second);
  const c = second.chunks[0]; archive.graph.nodes[0].evidence.push({ documentId: second.id, chunkId: c.id, page: c.page, start: c.start, end: c.end, unit: "utf16" });
  const edited = changeGraph(archive, "Rinomina", g => { g.nodes[0].title = "Energia"; });
  const clean = removeSource(edited, archive.documents[0].id); assert.equal(clean.graph.nodes[0].reviewReason, "source-removed"); assert.equal(clean.graph.personal[0].state, "studying"); assert.equal(clean.history.length, 0); assert.equal(clean.graph.nodes[0].evidence.length, 1); assert.equal(clean.graph.nodes[0].id, archive.graph.nodes[0].id); assert(!JSON.stringify(clean).includes(archive.documents[0].hash));
  const orphan = removeSource(clean, second.id); assert.equal(orphan.graph.nodes.length, 1); assert.equal(orphan.graph.nodes[0].evidence.length, 0); assert.throws(() => undoGraph(orphan), code("NO_HISTORY"));
});
test("dedicated backup roundtrip includes originals/history and remaps graph, personal and subject IDs", async () => {
  const snapshot = await fixture(); snapshot.archive = changeGraph(snapshot.archive, "Modifica", g => { g.nodes[0].title = "Aggiornato"; });
  const text = await exportArchive(snapshot.archive, snapshot.originals), imported = await importArchive(text);
  assert.deepEqual(imported.archive, snapshot.archive); assert.equal(await imported.originals[0].blob.text(), await snapshot.originals[0].blob.text());
  assert(!text.includes('"accountId"')); assert(!text.includes('"revision"'));
  const mapped = remapArchive(imported.archive, "Materia importata"); assert.notEqual(mapped.space.id, snapshot.archive.space.id); assert.notEqual(mapped.space.subjectId, snapshot.archive.space.subjectId);
  assert.notEqual(mapped.graph.nodes[0].id, snapshot.archive.graph.nodes[0].id); assert.equal(mapped.graph.personal[0].nodeId, mapped.graph.nodes[0].id); assert.equal(mapped.history[0].graph.nodes[0].id, mapped.graph.nodes[0].id);
  assert.deepEqual(mapped.graph.nodes[0].evidence, snapshot.archive.graph.nodes[0].evidence);
});
test("backup rejects truncation, corrupt checksum, forged original hash and V3 without partial import", async () => {
  const snapshot = await fixture(), text = await exportArchive(snapshot.archive, snapshot.originals);
  await assert.rejects(importArchive(text.slice(0, -5)), code("BACKUP_INVALID"));
  await assert.rejects(importArchive(text.replace("Cellula", "Alterata")), code("GRAPH_INVALID"));
  const outer = JSON.parse(text), inner = JSON.parse(outer.payload); inner.files[0].base64 = btoa("other bytes"); outer.payload = JSON.stringify(inner); outer.hash = await sha256(new TextEncoder().encode(outer.payload));
  await assert.rejects(importArchive(JSON.stringify(outer)), code("GRAPH_INVALID"));
  await assert.rejects(importArchive('{"version":3,"diary":{}}'), code("GRAPH_INVALID"));
  await assert.rejects(validateOriginals(snapshot.archive, []), code("GRAPH_INVALID"));
});
test("two tabs committing one base revision produce exactly one success, never a lost update", async () => {
  const account = newId(), initial = await fixture(), record = await commitStudy(account, null, initial);
  const a = structuredClone(initial), b = structuredClone(initial); a.archive.graph.nodes[0].title = "Tab A"; b.archive.graph.nodes[0].title = "Tab B";
  const results = await Promise.allSettled([commitStudy(account, record.revision, a), commitStudy(account, record.revision, b)]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  const failure = results.find(r => r.status === "rejected") as PromiseRejectedResult; assert(code("STUDY_CONFLICT")(failure.reason));
  const saved = await readStudy(account); assert(["Tab A", "Tab B"].includes(saved!.archive!.graph.nodes[0].title));
});
test("account archives and originals stay separate, including after deleting one account", async () => {
  const a = newId(), b = newId(), snapshot = await fixture(); const first = await commitStudy(a, null, snapshot); await commitStudy(b, null, { archive: emptyArchive(), originals: [] });
  assert.equal((await readStudy(b))!.originals.length, 0); await commitStudy(a, first.revision, null);
  assert.equal((await readStudy(a))!.archive, null); assert((await readStudy(b))!.archive); assert.equal((await readStudy(a))!.originals.length, 0);
});
test("tombstone rejects stale writes and stale creation after erase; fresh recreation works", async () => {
  const account = newId(), snapshot = await fixture(), initial = await commitStudy(account, null, snapshot), erased = await commitStudy(account, initial.revision, null);
  await assert.rejects(commitStudy(account, initial.revision, snapshot), code("STUDY_CONFLICT")); await assert.rejects(commitStudy(account, null, snapshot), code("STUDY_CONFLICT"));
  await commitStudy(account, erased.revision, { archive: emptyArchive(), originals: [] }); assert.equal((await readStudy(account))!.archive!.documents.length, 0);
});
test("invalid commit, abort and changed immutable source preserve the entire previous record", async () => {
  const account = newId(), snapshot = await fixture(), initial = await commitStudy(account, null, snapshot);
  const invalid = structuredClone(snapshot); invalid.archive.graph.nodes[0].evidence[0].end++;
  await assert.rejects(commitStudy(account, initial.revision, invalid), code("GRAPH_INVALID"));
  await assert.rejects(commitStudy(account, initial.revision, snapshot, { signal: AbortSignal.abort() }), { name: "AbortError" });
  const altered = structuredClone(snapshot); altered.archive.documents[0].title = "Mutated";
  await assert.rejects(commitStudy(account, initial.revision, altered), code("SOURCE_IMMUTABLE")); assert.deepEqual(await readStudy(account), initial);
});
test("source purge rejects hidden history, removes originals and invalidates another session", async () => {
  const account = newId(), snapshot = await fixture(); await commitStudy(account, null, snapshot);
  const stale = new StudySession(); await stale.open(account);
  const clean = { archive: removeSource(snapshot.archive, snapshot.archive.documents[0].id), originals: [] };
  await assert.rejects(commitStudy(account, stale.record!.revision, clean), code("PURGE_REQUIRED"));
  await commitStudy(account, stale.record!.revision, clean, { purge: true });
  await assert.rejects(stale.checkFreshness(), code("STUDY_PURGED")); assert.equal(stale.draft, undefined); assert.equal((await readStudy(account))!.originals.length, 0);
});
test("session switch cancels pending save and late open cannot populate the other account", async () => {
  const a = newId(), b = newId(), session = new StudySession(); await session.open(a); const snapshot = await fixture();
  const saving = session.save(snapshot), rejected = assert.rejects(saving, { name: "AbortError" }); await session.open(b); await rejected;
  assert.equal(session.accountId, b); assert.equal(session.draft!.archive.documents.length, 0); assert.equal(await readStudy(a), undefined);
  const opening = session.open(a), openRejected = assert.rejects(opening, { name: "AbortError" }); await session.open(b); await openRejected; assert.equal(session.accountId, b);
});
test("storage failure leaves a recoverable draft and never claims saved; retry works", async () => {
  const account = newId(), session = new StudySession(); await session.open(account); const snapshot = await fixture();
  Object.defineProperty(globalThis, "indexedDB", { value: { open() { throw new DOMException("Denied", "SecurityError"); } }, configurable: true });
  try { await assert.rejects(session.save(snapshot), code("STUDY_STORAGE")); assert(session.dirty); assert.equal(session.record, undefined); assert.deepEqual(session.draft!.archive, snapshot.archive); await exportArchive(session.draft!.archive, session.draft!.originals); }
  finally { Object.defineProperty(globalThis, "indexedDB", { value: indexedDB, configurable: true }); }
  await session.save(session.draft!); assert(!session.dirty); assert(session.record);
});
test("full restore is atomic into chosen account and imported history remains undoable", async () => {
  const account = newId(), snapshot = await fixture(); snapshot.archive = changeGraph(snapshot.archive, "Rinomina", g => { g.nodes[0].title = "Finale"; });
  const initial = await commitStudy(account, null, { archive: emptyArchive(), originals: [] }), restored = await importArchive(await exportArchive(snapshot.archive, snapshot.originals));
  restored.archive = remapArchive(restored.archive, "Nuova materia"); await commitStudy(account, initial.revision, restored, { purge: true });
  const saved = await readStudy(account); assert.equal(undoGraph(saved!.archive!).graph.nodes[0].title, "Cellula");
});

test("transaction rollback after put failure preserves originals, graph and revision", async () => {
  const { IDBObjectStore } = await import("fake-indexeddb"), account = newId(), snapshot = await fixture();
  const initial = await commitStudy(account, null, snapshot), originalPut = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...args: Parameters<typeof originalPut>) { originalPut.apply(this, args); throw new DOMException("Quota exhausted", "QuotaExceededError"); };
  try { await assert.rejects(commitStudy(account, initial.revision, snapshot), { name: "QuotaExceededError" }); }
  finally { IDBObjectStore.prototype.put = originalPut; }
  assert.deepEqual(await readStudy(account), initial);
});
test("failed source purge retries with its privacy barrier and clears another tab", async () => {
  const account = newId(), snapshot = await fixture(); await commitStudy(account, null, snapshot);
  const session = new StudySession(), other = new StudySession(); await session.open(account); await other.open(account);
  const clean = { archive: removeSource(snapshot.archive, snapshot.archive.documents[0].id), originals: [] };
  Object.defineProperty(globalThis, "indexedDB", { value: { open() { throw new DOMException("Denied", "SecurityError"); } }, configurable: true });
  try { await assert.rejects(session.save(clean, true), code("STUDY_STORAGE")); }
  finally { Object.defineProperty(globalThis, "indexedDB", { value: indexedDB, configurable: true }); }
  await session.save(session.draft!); assert(!session.dirty); await assert.rejects(other.checkFreshness(), code("STUDY_PURGED"));
});
test("history is bounded and stale draft survives ordinary conflicts for explicit export", async () => {
  let snapshot = await fixture(); for (let i = 0; i < 25; i++) snapshot = { ...snapshot, archive: changeGraph(snapshot.archive, "Rinomina", g => { g.nodes[0].title = `N${i}`; }) };
  assert.equal(snapshot.archive.history.length, 20);
  const account = newId(); await commitStudy(account, null, snapshot); const a = new StudySession(), b = new StudySession(); await a.open(account); await b.open(account);
  const updated = structuredClone(a.draft!); updated.archive.graph.nodes[0].title = "Altro tab"; await a.save(updated);
  const draft = structuredClone(b.draft!); draft.archive.graph.nodes[0].title = "La mia bozza"; await assert.rejects(b.save(draft), code("STUDY_CONFLICT")); assert(b.dirty); assert(b.conflict); assert.equal(b.draft!.archive.graph.nodes[0].title, "La mia bozza");
  await exportArchive(b.draft!.archive, b.draft!.originals); assert.equal((await readStudy(account))!.archive!.graph.nodes[0].title, "Altro tab");
});
