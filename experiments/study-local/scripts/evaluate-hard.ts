import { writeFile } from "node:fs/promises";
import { hardSources, hardQueries, HARD_PROTOCOL } from "../src/hard-corpus";
import { lexicalSearch, retrievalMetrics } from "../src/search";
import { percentile } from "../src/evaluate";
import { sha256 } from "../src/source";
const sources = await hardSources(), chunks = sources.flatMap(s => s.source.chunks), times: number[] = [];
let rows: object[] = [];
for (let repeat = 0; repeat < 5; repeat++) rows = hardQueries.map(q => {
  const start = performance.now(), found = lexicalSearch(chunks, q.text); times.push(performance.now() - start);
  const gold = sources.find(s => s.fixtureId === q.gold)?.source.chunks.map(c => c.id) ?? [];
  return { ...q, gold, found: found.map(h => h.chunk.id), metrics: gold.length ? { ...retrievalMetrics(found,new Set(gold)), hitAt1: gold.includes(found[0]?.chunk.id) ? 1 : 0 } : null };
});
const report = { protocol: HARD_PROTOCOL, corpusHash: await sha256(new TextEncoder().encode(JSON.stringify({ sources, hardQueries }))), rows, querySamples: times.length, medianMs: percentile(times,.5), p95Ms: percentile(times,.95), embedding: "not-run", humanReview: "pending" };
await writeFile(new URL("../reports/retrieval-challenge-v2-baseline.json",import.meta.url),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({ documents: sources.length, positiveQueries:16, negativeQueries:4, querySamples:times.length, p95Ms:report.p95Ms }));
