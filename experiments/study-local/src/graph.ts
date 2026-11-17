import { CHUNKER, LabError, LIMITS, assertTextLimit, chunkPage, decodeText, sha256, type SourceDocument } from "./source";

export const GRAPH_LIMITS = { nodes: 200, edges: 400, evidence: 12, history: 20, metadataBytes: 8 * 1024 * 1024, originalBytes: 50 * 1024 * 1024, backupBytes: 96 * 1024 * 1024 } as const;
export type Evidence = { documentId: string; chunkId: string; page: number; start: number; end: number; unit: "utf16" };
export type Concept = { id: string; title: string; summary: string; origin: "manual"; evidence: Evidence[]; reviewReason?: "source-removed" };
export type Edge = { id: string; from: string; to: string; type: "hierarchy" | "related" | "prerequisite" | "contrast"; evidence: Evidence[] };
export type Personal = { nodeId: string; note: string; state: "review" | "studying" | "learned" };
export type Graph = { nodes: Concept[]; edges: Edge[]; personal: Personal[] };
export type Archive = {
  format: "study-graph-v1";
  space: { id: string; subjectId: string; title: string; language: "it" | "de" | "fr" | "en" };
  documents: SourceDocument[];
  graph: Graph;
  history: { id: string; at: string; label: string; graph: Graph }[];
};
export type Original = { documentId: string; blob: Blob };
export const newId = () => crypto.randomUUID();
const fail = (message = "Formato della mappa non valido o oltre i limiti."): never => { throw new LabError("GRAPH_INVALID", message); };
function object(value: unknown, keys: string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some(k => !Object.hasOwn(value, k))) fail();
}
function list(value: unknown, max: number): asserts value is unknown[] { if (!Array.isArray(value) || value.length > max) fail(); }
function str(value: unknown, max: number, nonempty = true): asserts value is string {
  if (typeof value !== "string" || value.length > max || (nonempty && !value.trim()) || /[\uD800-\uDFFF]/u.test(value)) fail();
}
function integer(value: unknown, min: number, max: number): asserts value is number { if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) fail(); }
function id(value: unknown): asserts value is string { str(value, 400); if (!/^[a-zA-Z0-9:._-]+$/.test(value)) fail(); }
function unique(values: string[]) { if (new Set(values).size !== values.length) fail("Identificatori o riferimenti duplicati."); }
function evidence(value: unknown, documents: SourceDocument[]): asserts value is Evidence[] {
  list(value, GRAPH_LIMITS.evidence);
  for (const ref of value) {
    object(ref, ["documentId", "chunkId", "page", "start", "end", "unit"]);
    id(ref.documentId); id(ref.chunkId);
    const chunk = documents.find(d => d.id === ref.documentId)?.chunks.find(c => c.id === ref.chunkId);
    if (!chunk || ref.unit !== "utf16" || ref.page !== chunk.page || ref.start !== chunk.start || ref.end !== chunk.end) fail("Un collegamento non corrisponde al passaggio conservato.");
  }
  unique((value as Evidence[]).map(e => e.chunkId));
}
export function validateGraph(value: unknown, documents: SourceDocument[]): asserts value is Graph {
  object(value, ["nodes", "edges", "personal"]);
  list(value.nodes, GRAPH_LIMITS.nodes); list(value.edges, GRAPH_LIMITS.edges); list(value.personal, GRAPH_LIMITS.nodes);
  for (const node of value.nodes) {
    object(node, ["id", "title", "summary", "origin", "evidence", ...(node && typeof node === "object" && Object.hasOwn(node, "reviewReason") ? ["reviewReason"] : [])]);
    if (Object.hasOwn(node, "reviewReason") && node.reviewReason !== "source-removed") fail(); id(node.id); str(node.title, 120); str(node.summary, 3000, false);
    if (node.origin !== "manual") fail(); evidence(node.evidence, documents);
  }
  const nodes = value.nodes as Concept[], nodeIds = new Set(nodes.map(n => n.id)); unique(nodes.map(n => n.id));
  const parents = new Map<string, string>();
  for (const edge of value.edges) {
    object(edge, ["id", "from", "to", "type", "evidence"]); id(edge.id); id(edge.from); id(edge.to);
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to) || edge.from === edge.to || !["hierarchy", "related", "prerequisite", "contrast"].includes(edge.type as string)) fail("Relazione non valida o concetto mancante.");
    evidence(edge.evidence, documents);
    if (edge.type === "hierarchy") { if (parents.has(edge.to)) fail("Un concetto può avere un solo genitore nella gerarchia."); parents.set(edge.to, edge.from); }
  }
  const edges = value.edges as Edge[]; unique([...nodes.map(n => n.id), ...edges.map(e => e.id)]); unique(edges.map(e => `${e.type}:${e.from}:${e.to}`));
  for (const node of nodes) {
    const visited = new Set<string>(); let current: string | undefined = node.id;
    while (current) { if (visited.has(current)) fail("La gerarchia contiene un ciclo."); visited.add(current); current = parents.get(current); }
  }
  for (const personal of value.personal) {
    object(personal, ["nodeId", "note", "state"]); id(personal.nodeId); str(personal.note, 3000, false);
    if (!nodeIds.has(personal.nodeId) || !["review", "studying", "learned"].includes(personal.state as string)) fail();
  }
  unique((value.personal as Personal[]).map(p => p.nodeId));
}
export function validateArchive(value: unknown): asserts value is Archive {
  object(value, ["format", "space", "documents", "graph", "history"]);
  if (value.format !== "study-graph-v1") fail("Versione dello studio non supportata.");
  object(value.space, ["id", "subjectId", "title", "language"]); id(value.space.id); id(value.space.subjectId); str(value.space.title, 120);
  if (!["it", "de", "fr", "en"].includes(value.space.language as string)) fail();
  list(value.documents, 24); let characters = 0;
  for (const doc of value.documents) {
    object(doc, ["id", "title", "hash", "kind", "extractor", "pages", "chunks", "excludedPages", "warnings"]);
    id(doc.id); str(doc.title, 120); str(doc.hash, 64); str(doc.extractor, 80);
    if (!/^[a-f0-9]{64}$/.test(doc.hash) || !["text", "pdf"].includes(doc.kind as string) || doc.id !== `d-${doc.hash}-${doc.extractor}-${CHUNKER}` || (doc.kind === "text" ? doc.extractor !== "utf8-v1" : !/^pdfjs-[0-9.]+-stream-v1$/.test(doc.extractor))) fail();
    list(doc.pages, LIMITS.pages); if (!doc.pages.length) fail();
    list(doc.chunks, 4000); list(doc.excludedPages, LIMITS.pages); list(doc.warnings, 10);
    for (const warning of doc.warnings) str(warning, 1000);
    for (const page of doc.pages) { object(page, ["number", "text"]); integer(page.number, 1, LIMITS.pages); str(page.text, 200_000, false); assertTextLimit(page.text); characters += [...page.text].length; }
    const pages = doc.pages as SourceDocument["pages"];
    if (pages.some((p, i) => p.number !== i + 1)) fail();
    assertTextLimit(pages.map(p => p.text).join("\n"));
    if (doc.kind === "text" && (pages.length !== 1 || doc.excludedPages.length)) fail();
    for (const page of doc.excludedPages) integer(page, 1, pages.length);
    if (doc.kind === "pdf" && JSON.stringify(doc.excludedPages) !== JSON.stringify(pages.filter(p => !p.text.trim()).map(p => p.number))) fail();
    const expected = pages.flatMap(p => chunkPage(doc.id as string, p));
    if (!expected.length || expected.length !== doc.chunks.length) fail();
    doc.chunks.forEach((chunk, i) => {
      object(chunk, ["id", "documentId", "page", "start", "end", "text"]);
      if (Object.entries(expected[i]).some(([k, v]) => chunk[k] !== v)) fail("Testo estratto e passaggi incoerenti.");
    });
  }
  if (characters > 200_000) fail("Lo spazio supera 200.000 caratteri estratti.");
  const documents = value.documents as SourceDocument[]; unique(documents.map(d => d.id));
  validateGraph(value.graph, documents); list(value.history, GRAPH_LIMITS.history);
  for (const version of value.history) {
    object(version, ["id", "at", "label", "graph"]); id(version.id); str(version.at, 30); str(version.label, 120);
    if (!Number.isFinite(Date.parse(version.at))) fail(); validateGraph(version.graph, documents);
  }
  unique((value.history as Archive["history"]).map(v => v.id));
  if (new TextEncoder().encode(JSON.stringify(value)).length > GRAPH_LIMITS.metadataBytes) fail("Mappa e cronologia superano 8 MiB. Esporta e riduci il materiale.");
}
export async function validateOriginals(archive: Archive, originals: Original[], signal?: AbortSignal) {
  if (originals.length !== archive.documents.length || originals.reduce((sum, o) => sum + o.blob.size, 0) > GRAPH_LIMITS.originalBytes) fail("Originali mancanti o oltre 50 MiB.");
  unique(originals.map(o => o.documentId));
  for (const doc of archive.documents) {
    signal?.throwIfAborted(); const original = originals.find(o => o.documentId === doc.id)?.blob;
    if (!(original instanceof Blob) || !original.size || original.size > LIMITS.fileBytes) fail("Originale mancante o oltre 10 MiB.");
    const bytes = new Uint8Array(await original!.arrayBuffer());
    if (await sha256(bytes) !== doc.hash) fail("L’hash dell’originale non corrisponde alla fonte.");
    if (doc.kind === "text" && decodeText(bytes) !== doc.pages[0].text) fail("Il testo estratto non corrisponde all’originale TXT.");
    if (doc.kind === "pdf" && new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") fail();
    signal?.throwIfAborted();
  }
}
export function emptyArchive(): Archive {
  return { format: "study-graph-v1", space: { id: newId(), subjectId: newId(), title: "La mia materia", language: "it" }, documents: [], graph: { nodes: [], edges: [], personal: [] }, history: [] };
}
export function changeGraph(archive: Archive, label: string, recipe: (graph: Graph) => void): Archive {
  const next = structuredClone(archive); recipe(next.graph);
  next.history.push({ id: newId(), at: new Date().toISOString(), label, graph: structuredClone(archive.graph) });
  next.history = next.history.slice(-GRAPH_LIMITS.history); validateArchive(next); return next;
}
export function undoGraph(archive: Archive): Archive {
  const next = structuredClone(archive), previous = next.history.pop();
  if (!previous) throw new LabError("NO_HISTORY", "Nessuna modifica da annullare.");
  next.graph = previous.graph; validateArchive(next); return next;
}
export function removeSource(archive: Archive, documentId: string): Archive {
  const next = structuredClone(archive); next.documents = next.documents.filter(d => d.id !== documentId);
  for (const node of next.graph.nodes) if (node.evidence.some(e => e.documentId === documentId)) node.reviewReason = "source-removed";
  for (const item of [...next.graph.nodes, ...next.graph.edges]) item.evidence = item.evidence.filter(e => e.documentId !== documentId);
  // Privacy boundary: history cannot restore removed sources or old derived text.
  next.history = []; validateArchive(next); return next;
}
export function remapArchive(archive: Archive, title: string): Archive {
  const next = structuredClone(archive), ids = new Map<string, string>();
  const mapped = (old: string) => { if (!ids.has(old)) ids.set(old, newId()); return ids.get(old)!; };
  next.space = { ...next.space, id: newId(), subjectId: newId(), title };
  for (const graph of [next.graph, ...next.history.map(v => v.graph)]) {
    graph.nodes.forEach(n => { n.id = mapped(n.id); });
    graph.edges.forEach(e => { e.id = mapped(e.id); e.from = mapped(e.from); e.to = mapped(e.to); });
    graph.personal.forEach(p => { p.nodeId = mapped(p.nodeId); });
  }
  next.history.forEach(v => { v.id = newId(); }); validateArchive(next); return next;
}

// Dedicated portable backup: account, revisions, models and vectors are never serialized.
export async function exportArchive(archive: Archive, originals: Original[]): Promise<string> {
  validateArchive(archive); await validateOriginals(archive, originals);
  const files = [];
  for (const original of originals) {
    const bytes = new Uint8Array(await original.blob.arrayBuffer()); let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    files.push({ documentId: original.documentId, base64: btoa(binary) });
  }
  const payload = JSON.stringify({ archive, files });
  const output = JSON.stringify({ format: "study-backup-v1", hash: await sha256(new TextEncoder().encode(payload)), payload });
  if (new TextEncoder().encode(output).length > GRAPH_LIMITS.backupBytes) fail("Backup oltre 96 MiB.");
  return output;
}
export async function importArchive(text: string): Promise<{ archive: Archive; originals: Original[] }> {
  if (new TextEncoder().encode(text).length > GRAPH_LIMITS.backupBytes) fail("Backup oltre 96 MiB.");
  try {
    const envelope: unknown = JSON.parse(text); object(envelope, ["format", "hash", "payload"]);
    if (envelope.format !== "study-backup-v1") fail("Formato backup non supportato; il backup diario V3 è distinto.");
    str(envelope.hash, 64); str(envelope.payload, GRAPH_LIMITS.backupBytes);
    if (await sha256(new TextEncoder().encode(envelope.payload)) !== envelope.hash) fail("Backup danneggiato: checksum non valido.");
    const payload: unknown = JSON.parse(envelope.payload); object(payload, ["archive", "files"]);
    validateArchive(payload.archive); list(payload.files, 24); const originals: Original[] = [];
    for (const file of payload.files) {
      object(file, ["documentId", "base64"]); id(file.documentId); str(file.base64, Math.ceil(LIMITS.fileBytes / 3) * 4);
      if (file.base64.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)) fail();
      originals.push({ documentId: file.documentId, blob: new Blob([Uint8Array.from(atob(file.base64), c => c.charCodeAt(0))]) });
    }
    await validateOriginals(payload.archive, originals); return { archive: payload.archive, originals };
  } catch (error) { if (error instanceof LabError) throw error; throw new LabError("BACKUP_INVALID", "Backup non leggibile o formato non valido."); }
}
