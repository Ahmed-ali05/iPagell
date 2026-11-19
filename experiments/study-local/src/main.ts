import { mountStudy } from "./study-ui";
import { mountGeneration } from "./generation-ui";
import { corpus, fixtureName, queries } from "./corpus";
import { baselineReport, scoreRankings, percentile, reportSummary, type CorpusSources } from "./evaluate";
import { Jobs } from "./jobs";
import { downloadModel, modelCache, MODEL, verifiedStream, type PrefixProfile } from "./model";
import { lexicalSearch } from "./search";
import { LabError, LIMITS, resolveChunk, type SourceDocument, type SourceChunk } from "./source";
import { guardFetch } from "./network";
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = $("status"), modelStatus = $("model-status");
const jobs = new Jobs();
const requests = guardFetch(true);
let documents: SourceDocument[] = [], fixtureSources: CorpusSources = [];
let originals = new Map<string, Blob>();
let active: AbortController | undefined, generation = 0, report: unknown;
let modelBlob: Blob | undefined;
const downloadUrls = new Set<string>();
function releaseDownloads() { for (const url of downloadUrls) URL.revokeObjectURL(url); downloadUrls.clear(); }
const environment = { userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency, crossOriginIsolated, secureContext: isSecureContext, gpuApi: "gpu" in navigator };
function message(text: string) { status.textContent = text; }
function resetResults() { $("results").replaceChildren(); $("viewer").hidden = true; }
// Keep source DOM construction entirely text-based, including titles and extracted markup.
function button(text: string, action: () => void) { const el = document.createElement("button"); el.type = "button"; el.textContent = text; el.onclick = action; return el; }
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  downloadUrls.add(url); link.href = url; link.download = filename; link.hidden = true;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => { URL.revokeObjectURL(url); downloadUrls.delete(url); }, 60_000);
}
function drawSources() {
  const list = $("sources"); list.replaceChildren();
  for (const doc of documents) {
    const item = document.createElement("li"), title = document.createElement("strong"); title.textContent = doc.title;
    item.append(title, ` · ${doc.pages.length} pagine · ${doc.chunks.length} passaggi `);
    item.append(button("Scarica originale", () => { const original = originals.get(doc.id); if (original) download(original, `${doc.title}${doc.kind === "pdf" ? ".pdf" : ".txt"}`); }));
    item.append(button("Rimuovi", () => { invalidate(); documents = documents.filter(d => d.id !== doc.id); originals.delete(doc.id); fixtureSources = []; drawSources(); message("Fonte rimossa e risultati invalidati."); }));
    for (const warning of doc.warnings) { const p = document.createElement("p"); p.className = "hint"; p.textContent = warning; item.append(p); }
    list.append(item);
  }
  if (!documents.length) { const item = document.createElement("li"); item.textContent = "Nessuna fonte importata."; list.append(item); }
}
function invalidate() { generation++; active?.abort(); jobs.cancel(); generatorLab?.reset(); resetResults(); report = undefined; $("report").textContent = ""; $<HTMLButtonElement>("export").disabled = true; }
function showChunk(chunk: SourceChunk) {
  const page = resolveChunk(documents, chunk), doc = documents.find(d => d.id === chunk.documentId)!;
  $("viewer").hidden = false; $("viewer-title").textContent = doc.title;
  $("reference").textContent = `Pagina ${chunk.page} · intervallo UTF-16 [${chunk.start}, ${chunk.end}) · SHA-256 ${doc.hash}`;
  const mark = document.createElement("mark"); mark.textContent = chunk.text;
  $("page-text").replaceChildren(document.createTextNode(page.slice(0, chunk.start)), mark, document.createTextNode(page.slice(chunk.end)));
  $("viewer-title").focus();
}
function busy(value: boolean) { for (const el of document.querySelectorAll<HTMLInputElement | HTMLButtonElement>("[data-work]")) el.disabled = value; $<HTMLButtonElement>("cancel").disabled = !value; }
async function work(task: (signal: AbortSignal, ticket: number) => Promise<void>) {
  if (active) return;
  const controller = new AbortController(); active = controller; const ticket = generation;
  busy(true); message("Elaborazione in corso…");
  try { await task(controller.signal, ticket); }
  catch (error) { if (ticket === generation) message(error instanceof LabError ? error.message : controller.signal.aborted ? "Elaborazione annullata." : "Operazione non riuscita. Le fonti già importate restano disponibili."); }
  finally { if (active === controller) { active = undefined; busy(false); } }
}
function progress(data: Record<string, unknown>) { message(`${data.stage || "Elaborazione"}${data.total ? `: ${data.done}/${data.total}` : "…"}`); }
async function extract(payload: object) { return jobs.run<SourceDocument>(() => new Worker(new URL("./source.worker.ts", import.meta.url), { type: "module" }), payload, progress); }
function add(doc: SourceDocument, ticket: number, original: Blob) {
  if (ticket !== generation) return;
  if (documents.some(d => d.id === doc.id)) { message("Questa fonte è già presente."); return; }
  const count = documents.reduce((n, d) => n + d.pages.reduce((sum, p) => sum + [...p.text].length, 0), 0) + doc.pages.reduce((n, p) => n + [...p.text].length, 0);
  if (documents.length >= 24 || count > 200_000 || [...originals.values()].reduce((n, b) => n + b.size, original.size) > 50 * 1024 * 1024) throw new LabError("SPACE_LIMIT", "Limite del laboratorio raggiunto. Rimuovi una fonte oppure riduci il materiale.");
  generatorLab?.reset(); originals.set(doc.id, original);
  documents.push(doc); fixtureSources = []; resetResults(); drawSources(); message(`Importato: ${doc.title}.`);
  report = undefined; $("report").textContent = ""; $<HTMLButtonElement>("export").disabled = true;
}
$("import-form").addEventListener("submit", event => { event.preventDefault(); const text = $<HTMLTextAreaElement>("text").value, title = $<HTMLInputElement>("title").value; void work(async (_, ticket) => add(await extract({ text, title }), ticket, new Blob([text], { type: "text/plain;charset=utf-8" }))); });
$("file").addEventListener("change", () => {
  const input = $<HTMLInputElement>("file"), file = input.files?.[0]; if (!file) return;
  void work(async (signal, ticket) => {
    if (file.size > LIMITS.fileBytes) throw new LabError("FILE_LIMIT", "Il file supera il limite di 10 MiB.");
    const bytes = new Uint8Array(await file.arrayBuffer()); signal.throwIfAborted(); add(await extract({ bytes, title: file.name }), ticket, file);
  }).finally(() => { input.value = ""; });
});
$("cancel").onclick = () => { invalidate(); message("Elaborazione annullata. Nessun risultato tardivo verrà aggiunto."); };
$("clear").onclick = () => { invalidate(); documents = []; originals.clear(); fixtureSources = []; drawSources(); message("Tutte le fonti temporanee sono state rimosse."); };
$("search-form").addEventListener("submit", event => {
  event.preventDefault(); resetResults();
  try {
    const hits = lexicalSearch(documents.flatMap(d => d.chunks), $<HTMLInputElement>("query").value);
    for (const hit of hits) {
      const item = document.createElement("li"), excerpt = document.createElement("p"); excerpt.textContent = hit.chunk.text;
      item.append(button(`${documents.find(d => d.id === hit.chunk.documentId)!.title} · pagina ${hit.chunk.page}`, () => showChunk(hit.chunk)), excerpt); $("results").append(item);
    }
    message(hits.length ? `${hits.length} passaggi trovati. Apri una fonte per verificarli.` : "Nessun passaggio trovato. Prova altre parole; l'assenza di risultati non dimostra che la risposta non esista.");
  } catch (error) { message(error instanceof LabError ? error.message : "Ricerca non riuscita."); }
});
const fixtureUrls = import.meta.glob<string>("../fixtures/*.{txt,pdf}", { query: "?url", import: "default", eager: true });
async function loadFixtures(signal: AbortSignal, ticket: number) {
  const sources: CorpusSources = [], excluded: { fixtureId: string; code: string }[] = [];
  const fixtureOriginals = new Map<string, Blob>();
  for (const fixture of corpus) {
    const url = fixtureUrls[`../fixtures/${fixtureName(fixture)}`];
    const response = await fetch(url, { signal, credentials: "omit" });
    if (!response.ok) throw new LabError("FIXTURE", "Corpus sintetico incompleto.");
    const bytes = new Uint8Array(await response.arrayBuffer()); signal.throwIfAborted();
    try { const source = await extract({ bytes, title: fixture.title, filename: fixtureName(fixture) }); sources.push({ fixtureId: fixture.id, source }); fixtureOriginals.set(source.id, new Blob([bytes])); }
    catch (error) { if (fixture.id !== "D15" || !(error instanceof LabError) || error.code !== "NO_TEXT") throw error; excluded.push({ fixtureId: fixture.id, code: error.code }); }
  }
  signal.throwIfAborted();
  if (ticket !== generation) return;
  generatorLab?.reset(); documents = sources.map(s => s.source); originals = fixtureOriginals; fixtureSources = sources; resetResults(); drawSources();
  const result = await baselineReport(sources, excluded, environment);
  signal.throwIfAborted(); if (ticket !== generation) return;
  report = result; $("report").textContent = JSON.stringify({ corpusHash: result.corpusHash, readableDocuments: result.readableDocuments, chunks: result.chunks, p95Ms: result.baseline.p95Ms, summary: result.baseline.summary, excluded, limitations: result.limitations }, null, 2);
  $<HTMLButtonElement>("export").disabled = false;
  message("Corpus sintetico valutato: 15 fonti leggibili; il PDF senza testo è escluso esplicitamente. Report disponibile.");
}
$("fixtures").onclick = () => { void work(loadFixtures); };
$("export").onclick = () => {
  if (!report) return;
  download(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }), "ipagell-study-local-eval-v1.json");
  message("Download del report richiesto. Se il browser lo blocca, puoi aprire il JSON completo.");
};
$("show-report").onclick = () => {
  if (!report) { message("Esegui una prova prima di aprire il report."); return; }
  const control = $("show-report"), full = control.textContent === "Mostra JSON completo";
  $("report").textContent = JSON.stringify(full ? report : reportSummary(report), null, 2);
  control.textContent = full ? "Mostra sintesi" : "Mostra JSON completo";
};
$("forget-model").onclick = () => { void work(async () => { modelBlob = undefined; await modelCache("clear"); modelStatus.textContent = "Modello locale rimosso."; message("Cache dedicata del modello svuotata."); }); };
$("embedding").onclick = () => { void work(async (signal, ticket) => {
  const capabilities = await jobs.run<object>(() => new Worker(new URL("./capabilities.worker.ts", import.meta.url), { type: "module" }), {}, progress, 10_000);
  signal.throwIfAborted();
  if (fixtureSources.length !== 15) await loadFixtures(signal, ticket);
  signal.throwIfAborted();
  // Cancel may have cleared the previous report while leaving the complete corpus.
  report = await baselineReport(fixtureSources, [{ fixtureId: "D15", code: "NO_TEXT" }], environment);
  signal.throwIfAborted();
  const storage = await navigator.storage?.estimate().catch(() => undefined);
  const enoughCache = !storage?.quota || storage.quota - (storage.usage ?? 0) >= MODEL.bytes * 1.1;
  signal.throwIfAborted();
  if (!modelBlob) {
    modelStatus.textContent = "Verifica archivio del modello…";
    try { const cached = await modelCache("read", undefined, signal); if (cached) modelBlob = await verifiedStream(cached.stream(), signal, bytes => { modelStatus.textContent = `Verifica hash locale: ${bytes}/${MODEL.bytes} byte`; }); }
    catch { signal.throwIfAborted(); modelStatus.textContent = "Cache non disponibile o non valida; download esplicito in corso."; }
  }
  if (!modelBlob) {
    const blob = await downloadModel(AbortSignal.any([signal, AbortSignal.timeout(120_000)]), bytes => { modelStatus.textContent = `Download e hash: ${bytes}/${MODEL.bytes} byte`; });
    signal.throwIfAborted(); modelBlob = blob;
    try { if (!enoughCache) throw new LabError("MODEL_STORAGE", "Quota insufficiente"); await modelCache("write", blob, signal); modelStatus.textContent = "Pesi verificati e conservati nel browser."; }
    catch { signal.throwIfAborted(); modelStatus.textContent = "Pesi verificati in memoria; salvataggio locale non disponibile."; }
  }
  const chunks = fixtureSources.flatMap(s => s.source.chunks), titles = Object.fromEntries(fixtureSources.map(s => [s.source.id, s.source.title]));
  type Result = { rankings: string[][]; queryMs: number[]; loadMs: number; indexMs: number; profile: PrefixProfile };
  const run = (profile: PrefixProfile, texts: string[]) => jobs.run<Result>(() => new Worker("/runtime/embedding-worker.js"), { blob: modelBlob, chunks, titles, profile, queries: texts }, progress, 300_000);
  const development = queries.filter(q => q.split === "development"), evaluation = queries.filter(q => q.split === "evaluation");
  const candidates: { result: Result; recall: number; mrr: number }[] = [];
  try {
    for (const profile of ["model-card", "litert-guide"] as const) {
      const result = await run(profile, development.map(q => q.text)); signal.throwIfAborted();
      const rankings = queries.map(q => q.split === "development" ? result.rankings[development.indexOf(q)] : []);
      const score = scoreRankings(rankings, fixtureSources).summary.find(s => s.split === "development" && s.language === "all")!;
      candidates.push({ result, recall: score.recallAt5, mrr: score.mrrAt5 });
    }
    candidates.sort((a, b) => b.recall - a.recall || b.mrr - a.mrr);
    const profile = candidates[0].result.profile; // Frozen before looking at evaluation ranks.
    const result = await run(profile, Array.from({ length: 6 }, () => evaluation.map(q => q.text)).flat()); signal.throwIfAborted();
    const additionalStarts = [];
    for (let i = 0; i < 2; i++) { const repeat = await run(profile, []); signal.throwIfAborted(); additionalStarts.push({ loadMs: repeat.loadMs, indexMs: repeat.indexMs }); }
    const rankings = queries.map(q => q.split === "evaluation" ? result.rankings[evaluation.indexOf(q)] : candidates[0].result.rankings[development.indexOf(q)]);
    const metrics = scoreRankings(rankings, fixtureSources);
    report = { ...(report as object), network: { fetchRequests: requests, scope: "Guarded fetch only; native script/module loads and browser-wide traffic are not exhaustively captured" }, embedding: { status: "experimental-unqualified", model: MODEL, capabilities, selectedProfile: profile, selection: "Development only, Recall@5 then MRR@5; stable model-card tie break", candidates, evaluation: { ...metrics, ...result, rankings: undefined, querySamples: result.queryMs.length - evaluation.length, warmStarts: [{ loadMs: result.loadMs, indexMs: result.indexMs }, ...additionalStarts], p95Ms: percentile(result.queryMs.slice(evaluation.length), .95) }, limitations: ["Historical +5pp utility criterion was impossible from the 96.875% baseline; do not use it to reject the observed gain. See separate challenge v2; no universal correctness claim", "Pooling and activation precision are not independently verified", "Separate physical-device, offline, network and memory qualification required"] } };
    message("Confronto sintetico terminato. L'embedding resta sperimentale; usa il report per la revisione.");
  } catch (error) {
    signal.throwIfAborted();
    report = { ...(report as object), embedding: { status: "probe-failed", model: MODEL, environment, code: error instanceof LabError ? error.code : "RUNTIME", candidatesCompleted: candidates.length } };
    if (error instanceof LabError) message(error.message); else message("Prova del modello non riuscita.");
  }
  if (ticket === generation) { $("report").textContent = JSON.stringify(reportSummary(report), null, 2); $<HTMLButtonElement>("export").disabled = false; }
}); };
window.addEventListener("pagehide", () => {
  invalidate(); releaseDownloads(); documents = []; originals.clear(); fixtureSources = []; modelBlob = undefined;
  $<HTMLTextAreaElement>("text").value = ""; $<HTMLInputElement>("query").value = "";
  drawSources(); busy(false);
});
window.addEventListener("pageshow", event => { if (event.persisted) message("Scheda ripristinata: reimporta le fonti temporanee."); });
drawSources();

const study = mountStudy({ contextChanged: invalidate, sources: () => ({ documents, originals }), download, clear: () => { invalidate(); releaseDownloads(); documents = []; originals.clear(); fixtureSources = []; modelBlob = undefined; drawSources(); $<HTMLInputElement>("title").value = "Testo incollato"; modelStatus.textContent = "Modello non caricato."; message("Area temporanea svuotata."); for (const id of ["text", "query", "file"]) $<HTMLInputElement>(id).value = ""; } });
const generatorLab = mountGeneration({ work, jobs, network: () => structuredClone(requests), sources: () => documents, fixtures: () => fixtureSources, existing: () => study.current(), retrieve: async (sections, existingDocs, signal) => {
  // L3 cannot silently download a second model: L1's explicit model command must
  // have populated its verified cache first. Engines run in separate workers.
  let weights = modelBlob;
  if (!weights) { const cached = await modelCache("read", undefined, signal); if (cached) weights = await verifiedStream(cached.stream(), signal, () => {}); }
  signal.throwIfAborted();
  if (!weights) throw new LabError("EMBEDDING_REQUIRED", "Confronto interrotto dopo la baseline: esegui prima il comando esplicito del modello L1. Il report senza recupero resta disponibile.");
  const eligibleDocumentIds = sections.map(s => fixtureSources.length === 15 ? existingDocs.slice(0, existingDocs.findIndex(d => d.id === s.chunk.documentId)).map(d => d.id) : existingDocs.filter(d => d.id !== s.chunk.documentId).map(d => d.id));
  const result = await jobs.run<{ rankings: string[][] }>(() => new Worker("/runtime/embedding-worker.js"), { blob: weights, profile: "model-card", chunks: existingDocs.flatMap(d => d.chunks), titles: Object.fromEntries(existingDocs.map(d => [d.id, d.title])), queries: sections.map(s => s.chunk.text), eligibleDocumentIds }, progress, 300_000);
  signal.throwIfAborted(); return result.rankings;
} });
