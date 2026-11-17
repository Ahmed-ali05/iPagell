import { Backend, EmbeddingEngine, InputOverflowStrategy, loadLiteRtLm } from "@litert-lm/core";
import { MODEL, prefixed, type PrefixProfile } from "./model";
import { normalizedVector, semanticSearch } from "./search";
import { LabError, type SourceChunk } from "./source";
import { guardFetch } from "./network";

type Input = { jobId: number; blob: Blob; profile: PrefixProfile; chunks: SourceChunk[]; titles: Record<string, string>; queries: string[]; eligibleDocumentIds?: string[][] };
// Native logs are not a diagnostic channel for documents or prompts.
console.log = console.info = console.warn = console.error = () => {};
const requests = guardFetch(false);
self.onmessage = async ({ data }: MessageEvent<Input>) => {
  let engine: EmbeddingEngine | undefined;
  const started = performance.now();
  let maxInputTokens = 0, minRawNorm = Infinity, maxRawNorm = 0;
  const progress = (stage: string, done = 0, total = 0) => self.postMessage({ jobId: data.jobId, type: "progress", stage, done, total });
  let stage = "wasm";
  try {
    // Explicit same-origin assets: never invoke the SDK's default CDN loader.
    progress("Caricamento WASM e verifica WebGPU");
    await loadLiteRtLm(new URL("/runtime/", self.location.origin).href);
    stage = "engine";
    progress("Avvio del motore locale");
    engine = await EmbeddingEngine.create({ model: data.blob, backend: Backend.GPU, maxInputLength: 512, minInputLength: 128 });
    const loadMs = performance.now() - started;
    async function embed(text: string): Promise<number[]> {
      const result = await engine!.computeEmbedding(text, { normalize: true, outputSize: MODEL.dimensions, inputOverflowStrategy: InputOverflowStrategy.ERROR });
      maxInputTokens = Math.max(maxInputTokens, result.inputLength);
      const rawNorm = Math.hypot(...result.embedding); minRawNorm = Math.min(minRawNorm, rawNorm); maxRawNorm = Math.max(maxRawNorm, rawNorm);
      if (result.inputLength > 512 || (result.truncatedLength !== undefined && result.truncatedLength < result.inputLength) || result.numChunks !== 1)
        throw new LabError("MODEL_INPUT", "Il tokenizer segnala un input non supportato. Nessun troncamento viene accettato.");
      return normalizedVector(result.embedding);
    }
    const indexStarted = performance.now();
    stage = "index";
    const vectors: number[][] = [];
    for (const chunk of data.chunks) {
      vectors.push(await embed(prefixed(data.profile, chunk.text, data.titles[chunk.documentId] || "none")));
      progress("Indicizzazione locale", vectors.length, data.chunks.length);
    }
    const indexMs = performance.now() - indexStarted;
    const rankings: string[][] = []; const queryMs: number[] = [];
    stage = "query";
    for (const [queryIndex, query] of data.queries.entries()) {
      const queryStarted = performance.now();
      const vector = await embed(prefixed(data.profile, query));
      const eligible = data.eligibleDocumentIds?.[queryIndex];
      const indices = data.chunks.map((c, i) => ({ c, i })).filter(({ c }) => !eligible || eligible.includes(c.documentId));
      rankings.push(semanticSearch(indices.map(({ c }) => c), indices.map(({ i }) => vectors[i]), vector).map(hit => hit.chunk.id));
      queryMs.push(performance.now() - queryStarted);
      progress("Ricerca locale", rankings.length, data.queries.length);
    }
    const runtimeAssets = performance.getEntriesByType("resource").map(e => e.name).filter(name => name.startsWith(`${self.location.origin}/runtime/`));
    self.postMessage({ jobId: data.jobId, type: "result", result: { rankings, queryMs, loadMs, indexMs, profile: data.profile, runtime: MODEL.runtime, dimensions: MODEL.dimensions, maxInputTokens, minRawNorm, maxRawNorm, requests, runtimeAssets } });
  } catch (error) {
    // Do not propagate SDK messages: native errors can contain the source input.
    self.postMessage({ jobId: data.jobId, type: "error", code: error instanceof LabError ? error.code : `MODEL_RUNTIME_${stage.toUpperCase()}`, message: error instanceof LabError ? error.message : `Prova locale interrotta nella fase ${stage}. Questo runtime/modello non funziona nel browser corrente; la ricerca testuale resta disponibile.` });
  } finally { await engine?.delete().catch(() => {}); }
};
