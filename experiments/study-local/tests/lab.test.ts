import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { indexedDB } from "fake-indexeddb";
import { LabError, LIMITS, checkFile, chunkPage, createSource, decodeText, resolveChunk, sha256, sourceFromText } from "../src/source";
import { sourceFromPdf, setPdfWorker } from "../src/pdf";
import { lexicalSearch, normalizedVector, semanticSearch } from "../src/search";
import { corpus, queries } from "../src/corpus";
import { goldChunks, type CorpusSources } from "../src/evaluate";
import { Jobs } from "../src/jobs";
import { MODEL, modelCache, prefixed, verifiedStream } from "../src/model";
import { probeGpu } from "../src/capabilities";
setPdfWorker(new URL("../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).href);
const code = (expected: string) => (error: unknown) => error instanceof LabError && error.code === expected;
const bytes = async (id: string, extension: string) => new Uint8Array(await readFile(new URL(`../fixtures/${id}.${extension}`, import.meta.url)));

test("UTF-16 references preserve repeated accents, combining marks and surrogate pairs", async () => {
  const text = `  caffè e\u0301 🧬\n\ncaffè e\u0301 🧬 ${"x".repeat(584)}🧬fine`;
  const doc = await sourceFromText(text, "../titolo\u0000.txt");
  assert(!doc.title.includes("/"));
  for (const chunk of doc.chunks) { assert.equal(resolveChunk([doc], chunk).slice(chunk.start, chunk.end), chunk.text); assert(!/[\uD800-\uDBFF]$/u.test(chunk.text)); }
  assert.throws(() => resolveChunk([doc], { ...doc.chunks[0], start: 1 }), code("SOURCE_REFERENCE"));
  const repeated = createSource({ ...doc, pages: [{ number: 1, text: "Repeated" }, { number: 2, text: "Repeated" }] });
  assert.throws(() => resolveChunk([repeated], { ...repeated.chunks[0], page: 2 }), code("SOURCE_REFERENCE"));
  assert.equal(chunkPage(doc.id, doc.pages[0]).map(c => c.text).join(""), doc.chunks.map(c => c.text).join(""));
});
test("file magic, UTF-8, binary controls and text limits fail closed", async () => {
  assert.throws(() => checkFile(new TextEncoder().encode("not pdf"), "a.pdf"), code("FILE_TYPE"));
  assert.throws(() => checkFile(new TextEncoder().encode("%PDF-1.7"), "a.txt"), code("FILE_TYPE"));
  assert.throws(() => decodeText(new Uint8Array([0xc3, 0x28])), code("TEXT_ENCODING"));
  assert.throws(() => decodeText(new Uint8Array([0])), code("FILE_TYPE"));
  await assert.rejects(sourceFromText("x".repeat(LIMITS.characters + 1), "Too long"), code("TEXT_LIMIT"));
  await assert.rejects(sourceFromText("   ", "Empty"), code("NO_TEXT"));
  await assert.rejects(sourceFromText("\uD800", "Invalid Unicode"), code("TEXT_ENCODING"));
});
test("PDF digital/mixed/image-only and all gold anchors resolve on actual parser output", async () => {
  const sources: CorpusSources = [];
  for (const doc of corpus) {
    const input = await bytes(doc.id, doc.kind === "text" ? "txt" : "pdf");
    if (doc.id === "D15") { await assert.rejects(sourceFromPdf(input, doc.title), code("NO_TEXT")); continue; }
    const source = doc.kind === "text" ? await sourceFromText(decodeText(input), doc.title) : await sourceFromPdf(input, doc.title);
    sources.push({ fixtureId: doc.id, source });
    if (doc.id === "D16") assert.deepEqual(source.excludedPages, [2]);
    if (doc.id === "D13") assert.equal(source.pages.length, 5);
    for (const chunk of source.chunks) resolveChunk([source], chunk);
  }
  assert.equal(sources.length, 15);
  for (const query of queries) assert.equal(goldChunks(query, sources).length, query.gold.length);
});
test("PDF malformed, over-page-limit and pre-aborted do not produce partial sources", async () => {
  await assert.rejects(sourceFromPdf(new TextEncoder().encode("%PDF-bad"), "bad.pdf"), code("PDF_INVALID"));
  const pdf = await PDFDocument.create(); for (let i = 0; i < 51; i++) pdf.addPage();
  await assert.rejects(sourceFromPdf(await pdf.save(), "long.pdf"), code("PAGE_LIMIT"));
  await assert.rejects(sourceFromPdf(await bytes("D02", "pdf"), "a.pdf", AbortSignal.abort()), { name: "AbortError" });
});
test("Unicode retrieval and vectors reject invalid data without confidence claims", async () => {
  const doc = await sourceFromText("La congestione TCP riduce la finestra.\n\nLe cellule producono energia.", "example");
  assert.equal(lexicalSearch(doc.chunks, "CONGESTIÓNE")[0].chunk.id, doc.chunks[0].id);
  assert.deepEqual(lexicalSearch(doc.chunks, "inexistente"), []);
  assert.throws(() => normalizedVector(new Array(768).fill(0)), code("VECTOR_INVALID"));
  assert.throws(() => normalizedVector([NaN]), code("VECTOR_INVALID"));
  assert.throws(() => normalizedVector(new Array(768).fill(Infinity)), code("VECTOR_INVALID"));
  assert.throws(() => semanticSearch(doc.chunks, [], []), code("INDEX_INVALID"));
});
test("corpus has stratified 64 positive and 16 negative queries; no passage leaks across splits", () => {
  for (const split of ["development", "evaluation"]) {
    const subset = queries.filter(q => q.split === split);
    assert.equal(subset.filter(q => q.gold.length).length, 32); assert.equal(subset.filter(q => !q.gold.length).length, 8);
    for (const language of ["it", "de", "fr", "en"]) assert.equal(subset.filter(q => q.language === language && q.gold.length).length, language === "it" ? 20 : 4);
  }
  for (const query of queries) for (const gold of query.gold) assert(queries.filter(q => q.gold.some(g => g.document === gold.document && g.quote === gold.quote)).every(q => q.split === query.split));
});
class FakeWorker {
  terminated = false; onmessage: Worker["onmessage"] = null; onerror: Worker["onerror"] = null; sent?: { jobId: number };
  postMessage(data: { jobId: number }) { this.sent = data; }
  terminate() { this.terminated = true; }
  emit(data: object) { this.onmessage?.call(this as unknown as Worker, { data: { jobId: this.sent?.jobId, ...data } } as MessageEvent); }
}
test("cancel terminates immediately, late results cannot commit, next job recovers", async () => {
  const jobs = new Jobs(), old = new FakeWorker(), next = new FakeWorker();
  const pending = jobs.run(() => old, {}, () => {});
  const rejected = assert.rejects(pending, code("CANCELLED")); jobs.cancel(); await rejected;
  assert(old.terminated); assert(!jobs.busy);
  const result = jobs.run(() => next, {}, () => {});
  old.emit({ type: "result", result: "stale" }); assert(jobs.busy);
  next.emit({ type: "result", result: "current" }); assert.equal(await result, "current"); assert(!jobs.busy);
});
test("stalled worker deadline and concurrent work are bounded", async () => {
  const jobs = new Jobs(), worker = new FakeWorker();
  const pending = jobs.run(() => worker, {}, () => {}, 5);
  await assert.rejects(jobs.run(() => new FakeWorker(), {}, () => {}), code("BUSY"));
  await assert.rejects(pending, code("TIMEOUT")); assert(worker.terminated);
});
test("stream hash checks exact size, wrong hash, interruption; partial bytes never become ready", async () => {
  const data = new TextEncoder().encode("synthetic weights");
  const expected = { ...MODEL, bytes: data.length, sha256: await sha256(data) };
  const stream = () => new Blob([data]).stream();
  assert.equal((await verifiedStream(stream(), new AbortController().signal, () => {}, expected)).size, data.length);
  await assert.rejects(verifiedStream(stream(), new AbortController().signal, () => {}, { ...expected, sha256: "bad" }), code("MODEL_INTEGRITY"));
  await assert.rejects(verifiedStream(stream(), new AbortController().signal, () => {}, { ...expected, bytes: 1 }), code("MODEL_SIZE"));
  await assert.rejects(verifiedStream(stream(), AbortSignal.abort(), () => {}, expected), { name: "AbortError" });
});
test("model cache commits atomically, aborted write leaves previous weights", async () => {
  Object.defineProperty(globalThis, "indexedDB", { value: indexedDB, configurable: true });
  await modelCache("clear"); const blob = new Blob(["synthetic"]);
  await modelCache("write", blob); assert.equal((await modelCache("read"))?.size, blob.size);
  await assert.rejects(modelCache("write", new Blob(["replacement"]), AbortSignal.abort()), { name: "AbortError" });
  assert.equal((await modelCache("read"))?.size, blob.size); await modelCache("clear"); assert.equal(await modelCache("read"), undefined);
});
test("profiles add a single declared query/document prefix", () => {
  assert.equal(prefixed("model-card", "test"), "task: search result | query: test");
  assert.equal(prefixed("litert-guide", "test", "title"), "task: search result | text: test");
});
test("GPU admission rejects insecure, absent or null adapters before model download", async () => {
  await assert.rejects(probeGpu(undefined, true), code("MODEL_BACKEND"));
  await assert.rejects(probeGpu({ requestAdapter: async () => null }, true), code("MODEL_BACKEND"));
  await assert.rejects(probeGpu({ requestAdapter: async () => null }, false), code("MODEL_BACKEND"));
  const result = await probeGpu({ requestAdapter: async () => ({ features: { has: () => false } }) }, true);
  assert(result.workerGpuAdapter); assert(!result.shaderF16Available);
});

test("fetch boundary rejects content, hostile URLs and unpinned model requests", async () => {
  const { allowedRequest } = await import("../src/network"); const origin = "http://127.0.0.1:5174";
  assert(allowedRequest(`${origin}/runtime/a.wasm`, origin, "GET", false, false));
  assert(allowedRequest(MODEL.url, origin, "GET", false, true));
  for (const [url, method, body, model] of [["https://example.invalid/raccogli", "GET", false, false], [`${origin}/api/notes`, "POST", true, false], [`${origin}/assets/a?SENTINELLA`, "GET", false, false], [MODEL.url, "GET", false, false], [MODEL.url.replace(MODEL.revision, "main"), "GET", false, true]] as const)
    assert(!allowedRequest(url, origin, method, body, model));
});
test("storage denied produces an explicit recoverable failure", async () => {
  Object.defineProperty(globalThis, "indexedDB", { value: { open() { throw new DOMException("Denied", "SecurityError"); } }, configurable: true });
  await assert.rejects(modelCache("read"), code("MODEL_STORAGE"));
  Object.defineProperty(globalThis, "indexedDB", { value: indexedDB, configurable: true });
});
test("abort during a streamed download closes the reader without returning a blob", async () => {
  const controller = new AbortController(); let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array([1])); }, cancel() { cancelled = true; } });
  const promise = verifiedStream(stream, controller.signal, () => controller.abort());
  await assert.rejects(promise, { name: "AbortError" }); assert(cancelled);
});

test("challenge v2 keeps fixed separate sources and positive/negative denominators", async () => {
  const {hardSources,hardQueries,HARD_PROTOCOL}=await import("../src/hard-corpus");
  const sources=await hardSources();assert.equal(sources.length,48);assert.equal(hardQueries.filter(q=>q.gold).length,16);assert.equal(hardQueries.filter(q=>!q.gold).length,4);
  for(const q of hardQueries.filter(q=>q.gold)) { const match=sources.filter(s=>s.fixtureId===q.gold);assert.equal(match.length,1);assert.equal(match[0].source.chunks.length,1);resolveChunk([match[0].source],match[0].source.chunks[0]); }
  assert.equal(HARD_PROTOCOL.profile,"model-card");assert.equal(HARD_PROTOCOL.humanReview,"pending");
});
