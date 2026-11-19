import { LabError, LIMITS, type SourceChunk } from "./source";

const STOP = new Set("a ad al alla alle agli ai anche che chi ci come con da dal dalla dei del della delle di e è ed gli ha i il in la le lo ma nel nella o per più quale quali quanto qué qui que quel quelle quelles quels ou un una uno und der die das den dem des ein eine einer eines im am an auf für mit von zu ist was wie welche welcher the a an and are as at by for from how in is it of on or that the to what which who why with do does did can et les des du de en au aux dans une qu pourquoi sur est le la il sono si non not nicht ne pas".normalize("NFKD").replace(/\p{M}/gu, "").split(/\s+/));
export function terms(text: string): string[] {
  return (text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(t => t.length > 1 && !STOP.has(t));
}
export type SearchHit = { chunk: SourceChunk; score: number };
export function lexicalSearch(chunks: SourceChunk[], query: string, limit = 5): SearchHit[] {
  if ([...query].length > LIMITS.queryCharacters) throw new LabError("QUERY_LIMIT", "La ricerca accetta massimo 512 caratteri.");
  const wanted = [...new Set(terms(query))];
  if (!wanted.length || !chunks.length) return [];
  const records = chunks.map(chunk => {
    const tokens = terms(chunk.text);
    const counts = new Map<string, number>();
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
    return { chunk, counts, length: tokens.length };
  });
  const average = records.reduce((n, r) => n + r.length, 0) / records.length || 1;
  const frequencies = new Map(wanted.map(t => [t, records.filter(r => r.counts.has(t)).length]));
  return records.map(r => {
    let score = 0;
    for (const token of wanted) {
      const tf = r.counts.get(token) ?? 0;
      const df = frequencies.get(token)!;
      const idf = Math.log(1 + (records.length - df + 0.5) / (df + 0.5));
      score += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * r.length / average));
    }
    return { chunk: r.chunk, score };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id, "en")).slice(0, limit);
}
export function normalizedVector(values: ArrayLike<number>, dimensions = 768): number[] {
  const vector = Array.from(values);
  if (vector.length !== dimensions || vector.some(v => !Number.isFinite(v))) throw new LabError("VECTOR_INVALID", "Il modello ha restituito un vettore non valido.");
  const norm = Math.hypot(...vector);
  if (!Number.isFinite(norm) || norm < 1e-12) throw new LabError("VECTOR_INVALID", "Il modello ha restituito un vettore nullo.");
  return vector.map(v => v / norm);
}
export function semanticSearch(chunks: SourceChunk[], vectors: number[][], query: number[], limit = 5): SearchHit[] {
  if (chunks.length !== vectors.length) throw new LabError("INDEX_INVALID", "Indice incompleto: ricostruisci i vettori.");
  const q = normalizedVector(query);
  return chunks.map((chunk, i) => {
    const v = normalizedVector(vectors[i]);
    return { chunk, score: v.reduce((sum, value, j) => sum + value * q[j], 0) };
  }).sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id, "en")).slice(0, limit);
}
export function retrievalMetrics(hits: SearchHit[], relevant: Set<string>): { recall: number; reciprocalRank: number } {
  if (!relevant.size) throw new LabError("ANNOTATION_INVALID", "Una query con risposta richiede almeno una fonte annotata.");
  const found = new Set(hits.filter(h => relevant.has(h.chunk.id)).map(h => h.chunk.id));
  const first = hits.findIndex(h => relevant.has(h.chunk.id));
  return { recall: found.size / relevant.size, reciprocalRank: first < 0 ? 0 : 1 / (first + 1) };
}
