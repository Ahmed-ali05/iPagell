export const LIMITS = { fileBytes: 10 * 1024 * 1024, pages: 50, characters: 100_000, chunkUnits: 600, queryCharacters: 512 } as const;
export const CHUNKER = "paragraph-utf16-v1";

export class LabError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = "LabError"; }
}
export type SourcePage = { number: number; text: string };
export type SourceChunk = { id: string; documentId: string; page: number; start: number; end: number; text: string };
export type SourceDocument = {
  id: string; title: string; hash: string; kind: "text" | "pdf"; extractor: string;
  pages: SourcePage[]; chunks: SourceChunk[]; excludedPages: number[]; warnings: string[];
};

export function safeTitle(name: string): string {
  return [...name.replace(/[\p{Cc}\p{Cf}/\\]/gu, " ").trim()].slice(0, 120).join("") || "Documento";
}
export function assertTextLimit(text: string): void {
  if (/[\uD800-\uDFFF]/u.test(text)) throw new LabError("TEXT_ENCODING", "Il testo contiene una sequenza Unicode non valida. Incollalo nuovamente da una fonte leggibile.");
  if ([...text].length > LIMITS.characters) throw new LabError("TEXT_LIMIT", "Il testo supera 100.000 caratteri. Suddividi il materiale prima di importarlo.");
}
export function checkFile(bytes: Uint8Array, name: string): "pdf" | "text" {
  if (!bytes.length || bytes.length > LIMITS.fileBytes) throw new LabError("FILE_LIMIT", "Scegli un file non vuoto, di massimo 10 MiB.");
  const header = new TextDecoder("ascii").decode(bytes.subarray(0, 8));
  if (/\.pdf$/i.test(name)) {
    if (!header.startsWith("%PDF-")) throw new LabError("FILE_TYPE", "Il contenuto del file non corrisponde a un PDF supportato.");
    return "pdf";
  }
  if (!/\.txt$/i.test(name) || header.startsWith("%PDF-")) throw new LabError("FILE_TYPE", "Il laboratorio accetta TXT UTF-8 e PDF digitali. Puoi anche incollare il testo.");
  return "text";
}
export function decodeText(bytes: Uint8Array): string {
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new LabError("TEXT_ENCODING", "Questo file non è testo UTF-8 valido. Converti il file oppure incolla il testo."); }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)) throw new LabError("FILE_TYPE", "Il file contiene dati binari o controlli non supportati.");
  assertTextLimit(text);
  return text;
}
export async function sha256(bytes: Uint8Array): Promise<string> {
  // The bounded source file is copied because callers may transfer its buffer.
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

export function chunkPage(documentId: string, page: SourcePage): SourceChunk[] {
  const chunks: SourceChunk[] = [];
  const spans: [number, number][] = [];
  let previous = 0;
  for (const match of page.text.matchAll(/\n[ \t\r]*\n/g)) {
    spans.push([previous, match.index!]); previous = match.index! + match[0].length;
  }
  spans.push([previous, page.text.length]);
  for (const [from, to] of spans) {
    const raw = page.text.slice(from, to);
    const leading = raw.length - raw.trimStart().length;
    let start = from + leading;
    const stop = from + raw.trimEnd().length;
    while (start < stop) {
      let end = Math.min(start + LIMITS.chunkUnits, stop);
      if (end < stop && /[\uD800-\uDBFF]/u.test(page.text[end - 1])) end--;
      const text = page.text.slice(start, end);
      if (text.trim()) chunks.push({ id: `${documentId}:p${page.number}:${start}-${end}`, documentId, page: page.number, start, end, text });
      start = end;
    }
  }
  return chunks;
}
export function createSource(input: Omit<SourceDocument, "id" | "chunks" | "title"> & { title: string }): SourceDocument {
  if (!input.pages.length || input.pages.length > LIMITS.pages) throw new LabError("PAGE_LIMIT", "Il limite è di 50 pagine per documento.");
  assertTextLimit(input.pages.map(p => p.text).join("\n"));
  const id = `d-${input.hash}-${input.extractor}-${CHUNKER}`;
  const chunks = input.pages.flatMap(page => chunkPage(id, page));
  if (!chunks.length) throw new LabError("NO_TEXT", "Non ho trovato testo leggibile. Potrebbe essere una scansione: OCR non disponibile, puoi incollare il testo.");
  return { ...input, title: safeTitle(input.title), id, chunks };
}
export async function sourceFromText(text: string, title: string): Promise<SourceDocument> {
  assertTextLimit(text);
  return createSource({ title, hash: await sha256(new TextEncoder().encode(text)), kind: "text", extractor: "utf8-v1", pages: [{ number: 1, text }], excludedPages: [], warnings: [] });
}
export function resolveChunk(documents: SourceDocument[], chunk: SourceChunk): string {
  const doc = documents.find(d => d.id === chunk.documentId);
  const canonical = doc?.chunks.find(c => c.id === chunk.id);
  const page = doc?.pages.find(p => p.number === chunk.page);
  if (!canonical || canonical.page !== chunk.page || canonical.start !== chunk.start || canonical.end !== chunk.end || canonical.text !== chunk.text || !page || page.text.slice(chunk.start, chunk.end) !== chunk.text)
    throw new LabError("SOURCE_REFERENCE", "Il passaggio non corrisponde alla fonte conservata.");
  return page.text;
}
