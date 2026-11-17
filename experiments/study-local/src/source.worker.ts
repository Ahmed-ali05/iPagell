import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
import { sourceFromPdf, setPdfWorker } from "./pdf";
import { LabError, checkFile, createSource, decodeText, sha256, sourceFromText } from "./source";
import { guardFetch } from "./network";

guardFetch(false);
console.log = console.info = console.warn = console.error = () => {};
setPdfWorker(pdfWorkerUrl);
type Input = { jobId: number; title: string; filename?: string; text?: string; bytes?: Uint8Array };
self.onmessage = async (event: MessageEvent<Input>) => {
  const { jobId, title, filename, text, bytes } = event.data;
  try {
    const source = text !== undefined ? await sourceFromText(text, title) : bytes && checkFile(bytes, filename ?? title) === "pdf"
      ? await sourceFromPdf(bytes!, title, undefined, (page, total) => self.postMessage({ jobId, type: "progress", stage: "Estrazione PDF", done: page, total }))
      : await (async () => {
        if (!bytes) throw new LabError("FILE_TYPE", "Scegli un file oppure incolla il testo.");
        const decoded = decodeText(bytes);
        return createSource({ title, hash: await sha256(bytes), kind: "text", extractor: "utf8-v1", pages: [{ number: 1, text: decoded }], excludedPages: [], warnings: [] });
      })();
    self.postMessage({ jobId, type: "result", result: source });
  } catch (error) { self.postMessage({ jobId, type: "error", code: error instanceof LabError ? error.code : "EXTRACTION_FAILED", message: error instanceof LabError ? error.message : "Estrazione non riuscita. Puoi incollare il testo." }); }
};
