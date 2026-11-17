import { GENERATOR, generatorFile, generatorReserve, admitGeneratorStorage, forgetGenerator } from "./generator-model";
import { GENERATION_LIMITS, GENERATION_PROMPT_VERSION, sectionsOf, sourceRef, proposalDiff, type Candidate, type Section } from "./proposals";
import { generationAnnotations, generationSummary, generationReviewRows } from "./generation-eval";
import type { GenerationResult, SectionResult } from "./generation.worker";
import type { Jobs } from "./jobs";
import type { SourceDocument } from "./source";
import { LabError } from "./source";
import type { CorpusSources } from "./evaluate";
import type { Archive } from "./graph";

type Bridge = {
  work: (task: (signal: AbortSignal, ticket: number) => Promise<void>) => Promise<void>;
  jobs: Jobs; sources: () => SourceDocument[]; fixtures: () => CorpusSources;
  network: () => { method: string; url: string }[];
  existing: () => Archive | undefined;
  retrieve: (sections: Section[], documents: SourceDocument[], signal: AbortSignal) => Promise<string[][]>;
};
export function mountGeneration(bridge: Bridge) {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(`generation-${id}`) as T;
  let report: Record<string, unknown> | undefined, prepared = false, reportUrl: string | undefined;
  const status = (text: string) => { $("status").textContent = text; };
  function clearExport() { if (reportUrl) URL.revokeObjectURL(reportUrl); reportUrl = undefined; $("export-ready").hidden = true; $("download").removeAttribute("href"); $<HTMLTextAreaElement>("json").value = ""; }
  function drawReport() { clearExport(); if (report) report.fetchRequests = bridge.network(); $("report").textContent = report ? JSON.stringify(report, null, 2) : ""; $<HTMLButtonElement>("export").disabled = !report; }
  function reset() { prepared = false; report = undefined; $("preview").replaceChildren(); drawReport(); $<HTMLButtonElement>("probe").disabled = true; $<HTMLButtonElement>("compare").disabled = true; status("Prova non avviata. Nessun generatore qualificato."); }
  function newReport() { return { protocol: "study-local-eval-v1", promptVersion: GENERATION_PROMPT_VERSION, model: GENERATOR, limits: GENERATION_LIMITS,
    generationSettings: { backend: "GPU_ARTISAN", contextTokens: 4096, maxOutputTokens: 1024, thinking: false, sampler: { type: "TOP_K", k: 1, temperature: 0, seed: 42 }, prefillPrefaceOnInit: true, filterChannelContentFromKvCache: true, constrainedDecoding: false },
    environment: { userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency, secureContext: isSecureContext, crossOriginIsolated },
    status: "unqualified", startedAt: new Date().toISOString(), networkScope: "Guarded fetch and CSP; browser-wide traffic not exhaustively captured", memory: "Peak CPU/GPU memory not measurable with this browser API", applied: false }; }
  function preview(run: GenerationResult, archive?: Archive) {
    const parent = $("preview"), heading = document.createElement("h3"); heading.textContent = run.mode === "none" ? "Senza recupero" : "Con candidati embedding"; parent.append(heading);
    for (const result of run.results) {
      const details = document.createElement("details"), summary = document.createElement("summary"), content = document.createElement("pre");
      summary.textContent = `${result.sectionId} · ${result.proposal?.nodes.length ?? 0} proposte · ${Math.round(result.ms)} ms${result.code ? ` · ${result.code}` : ""}`;
      content.textContent = JSON.stringify(result.proposal && archive ? proposalDiff(result.proposal, archive.graph) : result.proposal, null, 2);
      details.append(summary, content); parent.append(details);
    }
  }
  async function check(signal: AbortSignal) {
    const capabilities = await bridge.jobs.run(() => new Worker(new URL("./capabilities.worker.ts", import.meta.url), { type: "module" }), {}, () => {}, 10_000);
    signal.throwIfAborted();
    if (!navigator.storage?.getDirectory) throw new LabError("GENERATOR_STORAGE", "OPFS non disponibile. La prova richiede un file locale per evitare una seconda copia dei pesi in memoria.");
    const storage = await navigator.storage.estimate(); signal.throwIfAborted(); admitGeneratorStorage(storage);
    return { capabilities, storage, requiredFreeBytes: generatorReserve };
  }
  async function attempt(task: (signal: AbortSignal) => Promise<void>) {
    await bridge.work(async signal => {
      try { await task(signal); signal.throwIfAborted(); }
      catch (error) {
        signal.throwIfAborted(); report = { ...report, status: "probe-failed", error: error instanceof LabError ? error.code : "GENERATOR_UNAVAILABLE", finishedAt: new Date().toISOString() }; drawReport();
        status(error instanceof LabError ? error.message : "Prova locale non disponibile. Mappa manuale e ricerca restano utilizzabili.");
      }
    });
  }
  $("prepare").onclick = () => { void attempt(async signal => {
    reset(); report = newReport(); report.admission = await check(signal); prepared = true; drawReport();
    status(`Dispositivo ammesso alla prova, non qualificato. Download su comando: ${GENERATOR.bytes} byte da Hugging Face; spazio libero richiesto ${generatorReserve} byte. Pesi/tokenizer locali, nessun documento inviato.`);
  }); };
  async function weights(signal: AbortSignal, allowDownload = false) {
    if (!prepared) throw new LabError("GENERATOR_ADMISSION", "Verifica prima dispositivo e spazio.");
    report!.admission = await check(signal);
    const downloadSignal = AbortSignal.any([signal, AbortSignal.timeout(600_000)]);
    let file: File;
    try { file = await generatorFile(downloadSignal, bytes => { status(`Download/verifica SHA-256: ${bytes}/${GENERATOR.bytes} byte`); }, allowDownload); }
    catch (error) { signal.throwIfAborted(); if (downloadSignal.aborted) throw new LabError("GENERATOR_DOWNLOAD_TIMEOUT", "Download/verifica oltre 10 minuti. Riprova con il comando dedicato; nessuna inferenza è stata avviata."); throw error; }
    signal.throwIfAborted(); report!.weightsVerified = true; return file;
  }
  async function generate(file: Blob, sections: Section[], candidates: Candidate[][], documents: SourceDocument[], mode: "none" | "embedding", signal: AbortSignal) {
    const partial: SectionResult[] = []; report!.partial = { mode, results: partial };
    const result = await bridge.jobs.run<GenerationResult>(() => new Worker("/runtime/generation-worker.js"), { file, sections, candidates, chunks: documents.flatMap(d => d.chunks), mode }, data => {
      if (data.stage === "section-complete") partial.push(data.result as SectionResult);
      status(data.stage === "section-start" ? `${mode}: sezione ${Number(data.done) + 1}/${data.total} · massimo 30 s inclusa riparazione` : String(data.stage));
    }, 120_000, data => data.stage === "section-start" ? GENERATION_LIMITS.sectionMs : undefined);
    signal.throwIfAborted(); delete report!.partial; return result;
  }
  $("probe").onclick = () => { void attempt(async signal => {
    clearExport(); report = { ...newReport(), status: "running-runtime-probe", admission: report?.admission }; drawReport(); const file = await weights(signal, true);
    const probe = await generate(file, [], [], [], "none", signal); report.runtimeProbe = probe; report.status = "runtime-ready-quality-unqualified"; drawReport();
    status("Motore avviato. La qualità resta da verificare sul corpus completo: nessuna proposta applicata.");
  }); };
  $("compare").onclick = () => { void attempt(async signal => {
    clearExport(); $("preview").replaceChildren(); report = { ...newReport(), status: "running-comparison", admission: report?.admission }; drawReport();
    const documents = structuredClone(bridge.sources()), archive = bridge.existing(), fixtures = bridge.fixtures();
    if (!documents.length) throw new LabError("NO_SOURCE", "Carica prima il corpus sintetico L1 oppure importa una fonte.");
    const isCorpus = fixtures.length === 15 && documents.length === 15;
    const sections = sectionsOf(documents, archive?.space.language);
    for (const section of sections) { const fixture = fixtures.find(f => f.source.id === section.chunk.documentId); if (fixture) section.language = corpusLanguage(fixture.fixtureId); }
    report.annotations = isCorpus ? generationAnnotations(fixtures) : [];
    report.sourceScope = { documents: documents.length, readableSections: sections.length, excludedPages: documents.flatMap(d => d.excludedPages.map(page => ({ documentId: d.id, page }))), corpus: isCorpus ? "L1-16-documents-15-readable" : "custom-not-benchmark" };
    drawReport();
    const file = await weights(signal), runs: GenerationResult[] = [];
    const baseline = await generate(file, sections, sections.map(() => []), documents, "none", signal); runs.push(baseline); preview(baseline); report.runs = runs; drawReport();
    // The generator worker has terminated before loading the embedding engine.
    // For the corpus, previously encountered source passages are manual candidates;
    // for user material only concepts already in the L2 archive are candidates.
    const existingDocs = isCorpus ? documents : structuredClone(archive?.documents ?? []);
    const allCandidates: Candidate[] = isCorpus ? existingDocs.flatMap(d => d.chunks.map(c => ({ id: c.id, title: d.title, summary: c.text, evidence: [sourceRef(c)] }))) : (archive?.graph.nodes.filter(n => n.evidence.length) ?? []).map(({ id, title, summary, evidence }) => structuredClone({ id, title, summary, evidence }));
    const rankings = allCandidates.length ? await bridge.retrieve(sections, existingDocs, signal) : [];
    signal.throwIfAborted();
    const candidates = sections.map(section => {
      const docIndex = documents.findIndex(d => d.id === section.chunk.documentId);
      const eligible = allCandidates.filter(c => isCorpus ? c.evidence.some(e => documents.findIndex(d => d.id === e.documentId) < docIndex) : c.evidence.some(e => e.documentId !== section.chunk.documentId));
      return (rankings[sections.indexOf(section)] ?? []).flatMap(id => eligible.filter(c => c.evidence.some(e => e.chunkId === id))).filter((c, i, a) => a.findIndex(x => x.id === c.id) === i).slice(0, 2);
    });
    if (candidates.some(c => c.length)) {
      const allDocs = [...documents, ...existingDocs.filter(d => !documents.some(s => s.id === d.id))];
      const retrieved = await generate(file, sections, candidates, allDocs, "embedding", signal); runs.push(retrieved); preview(retrieved, archive);
    } else report.retrieval = "No eligible existing candidates; comparison unavailable";
    const validSections = runs.reduce((count, run) => count + run.results.filter(r => r.proposal).length, 0);
    report.reviewRows = generationReviewRows(runs,[...documents,...existingDocs.filter(d=>!documents.some(s=>s.id===d.id))]);
    report.summary = generationSummary(runs, isCorpus ? (report.annotations as unknown[]).length : 0); report.status = validSections ? "human-review-required" : "no-valid-proposals"; report.finishedAt = new Date().toISOString(); drawReport();
    status(validSections ? `Prova terminata: ${validSections} sezioni con proposte valide nel contratto. Supporto semantico, copertura e stabilità richiedono revisione. Nessuna modifica alla mappa.` : "Nessuna proposta ha superato il contratto. Generatore non qualificato: usa la mappa manuale e la ricerca. Il report conserva gli errori; nessuna modifica alla mappa.");
  }); };
  $("forget").onclick = () => { void attempt(async signal => { await forgetGenerator(); signal.throwIfAborted(); reset(); status("File del generatore eliminato dal browser."); }); };
  $("export").onclick = () => { if (!report) return; clearExport(); const text = JSON.stringify(report, null, 2); reportUrl = URL.createObjectURL(new Blob([text], { type: "application/json" })); $<HTMLAnchorElement>("download").href = reportUrl; $<HTMLTextAreaElement>("json").value = text; $("export-ready").hidden = false; };
  // work() enables data-work controls on exit; restore the admission gate then.
  const observer = new MutationObserver(() => { if (!prepared) { $<HTMLButtonElement>("probe").disabled = true; $<HTMLButtonElement>("compare").disabled = true; } });
  observer.observe($("prepare"), { attributes: true, attributeFilter: ["disabled"] });
  window.addEventListener("pagehide", reset); reset();
  return { reset };
}

function corpusLanguage(id: string) { const n = Number(id.slice(1)); return n >= 7 && n <= 8 ? "de" : n >= 9 && n <= 10 ? "fr" : n >= 11 && n <= 12 ? "en" : "it"; }
