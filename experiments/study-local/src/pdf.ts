import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist/legacy/build/pdf.mjs";
import { LabError, LIMITS, createSource, sha256, type SourceDocument, type SourcePage } from "./source";

export function setPdfWorker(url: string): void { GlobalWorkerOptions.workerSrc = url; }
export async function sourceFromPdf(bytes: Uint8Array, title: string, signal?: AbortSignal, progress?: (page: number, total: number) => void): Promise<SourceDocument> {
  signal?.throwIfAborted();
  const hash = await sha256(bytes);
  signal?.throwIfAborted();
  const loading = getDocument({ data: bytes, enableXfa: false, useSystemFonts: false, disableFontFace: true, useWorkerFetch: false, useWasm: false, verbosity: 0, stopAtErrors: true });
  const abort = () => { void loading.destroy().catch(() => {}); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const pdf = await loading.promise;
    if (pdf.numPages > LIMITS.pages) throw new LabError("PAGE_LIMIT", "Il PDF supera il limite di 50 pagine.");
    const pages: SourcePage[] = [], excludedPages: number[] = [];
    let characters = 0, items = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      signal?.throwIfAborted();
      const page = await pdf.getPage(number);
      const reader = page.streamTextContent({ disableNormalization: true }).getReader();
      const parts: string[] = [];
      try {
        while (true) {
          signal?.throwIfAborted();
          const { value, done } = await reader.read();
          if (done) break;
          for (const item of value.items) {
            if (!("str" in item)) continue;
            if (++items > 50_000) throw new LabError("TEXT_LIMIT", "Il PDF contiene troppi elementi testuali. Suddividi il file.");
            const separator = item.hasEOL ? "\n" : " ";
            characters += [...item.str].length + separator.length;
            if (characters > LIMITS.characters) throw new LabError("TEXT_LIMIT", "Il testo PDF supera 100.000 caratteri. Suddividi il file.");
            parts.push(item.str, separator);
          }
        }
      } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); page.cleanup(); }
      const text = parts.join("");
      pages.push({ number, text });
      if (!text.trim()) excludedPages.push(number);
      progress?.(number, pdf.numPages);
    }
    return createSource({ title, hash, kind: "pdf", extractor: `pdfjs-${version}-stream-v1`, pages, excludedPages,
      warnings: ["Testo estratto dal PDF: verifica ordine di lettura, simboli, formule e tabelle nell'originale.", ...(excludedPages.length ? [`Pagine senza testo leggibile: ${excludedPages.join(", ")}. OCR non disponibile; puoi incollare il testo mancante.`] : [])] });
  } catch (error) {
    signal?.throwIfAborted();
    if (error instanceof LabError) throw error;
    if (error instanceof Error && error.name === "PasswordException") throw new LabError("PDF_PASSWORD", "Il PDF richiede una password. Usa una copia leggibile autorizzata oppure incolla il testo.");
    throw new LabError("PDF_INVALID", "Non riesco a leggere questo PDF. Il formato potrebbe non essere supportato: puoi incollare il testo.");
  } finally { signal?.removeEventListener("abort", abort); await loading.destroy().catch(() => {}); }
}
