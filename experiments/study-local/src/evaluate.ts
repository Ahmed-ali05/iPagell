import { corpus, queries, type Query } from "./corpus";
import { lexicalSearch, retrievalMetrics } from "./search";
import { CHUNKER, LIMITS, resolveChunk, sha256, type SourceDocument } from "./source";
export type CorpusSources = { fixtureId: string; source: SourceDocument }[];
export function goldChunks(query: Query, sources: CorpusSources): string[] {
  return query.gold.flatMap(gold => {
    const doc = sources.find(s => s.fixtureId === gold.document)?.source;
    if (!doc) throw new Error(`Missing annotated source ${gold.document}`);
    const matches = doc.chunks.filter(c => c.text.includes(gold.quote));
    if (matches.length !== 1) throw new Error(`Ambiguous or missing annotation ${query.id}: ${matches.length}`);
    resolveChunk([doc], matches[0]);
    return matches.map(c => c.id);
  });
}
export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? 0;
}
export function scoreRankings(rankings: string[][], sources: CorpusSources) {
  if (rankings.length !== queries.length) throw new Error("Incomplete rankings");
  const chunks = new Map(sources.flatMap(s => s.source.chunks).map(c => [c.id, c]));
  const rows = queries.map((query, i) => {
    const gold = goldChunks(query, sources);
    const found = rankings[i];
    if (found.length > 5 || new Set(found).size !== found.length || found.some(id => !chunks.has(id))) throw new Error("Invalid ranking references");
    return { queryId: query.id, language: query.language, split: query.split, gold, found, metrics: gold.length ? retrievalMetrics(found.map(id => ({ chunk: chunks.get(id)!, score: 0 })), new Set(gold)) : null };
  });
  const subsets = ["all", "it", "de", "fr", "en"];
  const summary = ["development", "evaluation"].flatMap(split => subsets.map(language => {
    const positive = rows.filter(row => row.split === split && row.metrics && (language === "all" || language === row.language));
    return { split, language, n: positive.length, recallAt5: positive.reduce((s, r) => s + r.metrics!.recall, 0) / positive.length, mrrAt5: positive.reduce((s, r) => s + r.metrics!.reciprocalRank, 0) / positive.length };
  }));
  return { summary, negatives: rows.filter(row => !row.metrics).map(({ queryId, split, found }) => ({ queryId, split, returned: found.length })), rows };
}
function pick(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  return Object.fromEntries(keys.filter(key => record[key] !== undefined).map(key => [key, record[key]]));
}
export function reportSummary(value: unknown): object {
  const root = pick(value, ["protocol", "generatedAt", "environment", "corpusHash", "chunker", "limits", "readableDocuments", "chunks", "excluded", "network", "limitations"]);
  const all = value as Record<string, unknown>;
  root.baseline = pick(all.baseline, ["querySamples", "medianMs", "p95Ms", "summary", "negatives"]);
  const embedding = pick(all.embedding, ["status", "model", "capabilities", "selectedProfile", "selection", "code", "candidatesCompleted", "limitations"]);
  if (all.embedding && typeof all.embedding === "object") {
    const details = all.embedding as Record<string, unknown>;
    embedding.evaluation = pick(details.evaluation, ["summary", "negatives", "loadMs", "indexMs", "profile", "dimensions", "maxInputTokens", "minRawNorm", "maxRawNorm", "requests", "runtimeAssets", "querySamples", "warmStarts", "p95Ms"]);
    if (Array.isArray(details.candidates)) embedding.candidates = details.candidates.map(candidate => ({ ...pick(candidate, ["recall", "mrr"]), result: pick(candidate.result, ["profile", "loadMs", "indexMs", "maxInputTokens", "minRawNorm", "maxRawNorm", "requests", "runtimeAssets"]) }));
  }
  root.embedding = embedding;
  return root;
}
export async function baselineReport(sources: CorpusSources, excluded: { fixtureId: string; code: string }[], environment: object) {
  const chunks = sources.flatMap(s => s.source.chunks);
  const timings: number[] = []; let rankings: string[][] = [];
  for (let repeat = 0; repeat < 5; repeat++) {
    rankings = queries.map(query => { const start = performance.now(); const hits = lexicalSearch(chunks, query.text); timings.push(performance.now() - start); return hits.map(h => h.chunk.id); });
  }
  const fingerprints = sources.map(s => ({ id: s.fixtureId, title: s.source.title, hash: s.source.hash, extractor: s.source.extractor, chunks: s.source.chunks.length, excludedPages: s.source.excludedPages }));
  const annotationHash = await sha256(new TextEncoder().encode(JSON.stringify(queries)));
  const corpusHash = await sha256(new TextEncoder().encode(JSON.stringify({ fingerprints, annotationHash, chunker: CHUNKER, chunkUnits: LIMITS.chunkUnits })));
  return { protocol: "study-local-eval-v1", generatedAt: new Date().toISOString(), environment, corpusHash, annotationHash, chunker: CHUNKER, limits: LIMITS, synthetic: true,
    annotationStatus: "Exact anchors verified against extracted text; independent human review pending", documents: corpus.length, readableDocuments: sources.length, chunks: chunks.length,
    fingerprints, excluded, baseline: { tokenizer: "Unicode NFKD letters/numbers; explicit multilingual stop list; BM25 k1=1.2 b=0.75", repetitions: 5, querySamples: timings.length, medianMs: percentile(timings, .5), p95Ms: percentile(timings, .95), ...scoreRankings(rankings, sources) },
    embedding: { status: "not-qualified", reason: "Requires browser worker/model probe and separate development/evaluation comparison" },
    limitations: ["Synthetic authored questions; not independent language or semantic validation", "Negative queries report returned counts; no calibrated abstention threshold", "No mobile, account persistence or offline readiness qualified"] };
}
