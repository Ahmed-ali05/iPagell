import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { LabError } from "./source";

export const MODEL = Object.freeze({
  id: "embeddinggemma-2-text-270m", revision: "9be6e8b90982095dc05c2bd162e4b954ee4dbac7",
  url: "https://huggingface.co/litert-community/embeddinggemma-2-text-270m-litert-lm/resolve/9be6e8b90982095dc05c2bd162e4b954ee4dbac7/embeddinggemma-2-text-270m.litertlm",
  bytes: 164626432, sha256: "2d079ee2f6f066b1f368e8d7c819f55214eaef1d0513b312321901f30ab286fb",
  runtime: "@litert-lm/core@0.18.0", dimensions: 768,
});
export type PrefixProfile = "model-card" | "litert-guide";
export function prefixed(profile: PrefixProfile, text: string, title?: string): string {
  if (title !== undefined) return profile === "model-card" ? `title: ${title || "none"} | text: ${text}` : `task: search result | text: ${text}`;
  return profile === "model-card" ? `task: search result | query: ${text}` : `task: search query | text: ${text}`;
}

export async function verifiedStream(stream: ReadableStream<Uint8Array>, signal: AbortSignal, progress: (bytes: number) => void, expected: { bytes: number; sha256: string } = MODEL): Promise<Blob> {
  const hash = sha256.create();
  const parts: Uint8Array<ArrayBuffer>[] = [];
  let bytes = 0;
  const reader = stream.getReader();
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const { value, done } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > expected.bytes) throw new LabError("MODEL_SIZE", "Il download supera la dimensione fissata.");
      hash.update(value); parts.push(Uint8Array.from(value)); progress(bytes);
    }
    if (bytes !== expected.bytes || bytesToHex(hash.digest()) !== expected.sha256)
      throw new LabError("MODEL_INTEGRITY", "Il modello è incompleto o il suo hash non corrisponde. Nessuna copia è stata salvata.");
    signal.throwIfAborted();
    return new Blob(parts, { type: "application/octet-stream" });
  } finally {
    signal.removeEventListener("abort", abort);
    await reader.cancel().catch(() => {}); reader.releaseLock();
  }
}
export async function downloadModel(signal: AbortSignal, progress: (bytes: number) => void): Promise<Blob> {
  const response = await fetch(MODEL.url, { credentials: "omit", referrerPolicy: "no-referrer", signal, cache: "no-store" });
  if (!response.ok || !response.body) { await response.body?.cancel().catch(() => {}); throw new LabError("MODEL_DOWNLOAD", "Download non disponibile. La ricerca testuale resta utilizzabile."); }
  const length = response.headers.get("content-length");
  if (length && Number(length) !== MODEL.bytes) { await response.body.cancel().catch(() => {}); throw new LabError("MODEL_SIZE", "Dimensione del modello inattesa."); }
  return verifiedStream(response.body, signal, progress);
}

// Only reconstructible model weights are persisted here. No source, query or vector.
const DB = "ipagell-study-lab-model-v1";
function openCache(signal?: AbortSignal): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: unknown) => { settled = true; clearTimeout(timer); signal?.removeEventListener("abort", abort); if (error) reject(error); };
    const abort = () => finish(signal!.reason);
    const timer = setTimeout(() => finish(new LabError("MODEL_STORAGE", "Archivio locale non disponibile: usa il modello in memoria.")), 5000);
    signal?.addEventListener("abort", abort, { once: true });
    signal?.throwIfAborted();
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open(DB, 1); }
    catch { finish(new LabError("MODEL_STORAGE", "Archivio locale non disponibile: usa il modello in memoria.")); return; }
    request.onupgradeneeded = () => request.result.createObjectStore("weights");
    request.onsuccess = () => { if (settled) { request.result.close(); return; } finish(); resolve(request.result); };
    request.onerror = () => finish(new LabError("MODEL_STORAGE", "Archivio locale non disponibile: usa il modello in memoria."));
    request.onblocked = () => finish(new LabError("MODEL_STORAGE", "Chiudi le altre schede del laboratorio e riprova."));
  });
}
export async function modelCache(action: "read" | "write" | "clear", blob?: Blob, signal?: AbortSignal): Promise<Blob | undefined> {
  signal?.throwIfAborted();
  const db = await openCache(signal);
  try {
    signal?.throwIfAborted();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("weights", action === "read" ? "readonly" : "readwrite");
      const store = tx.objectStore("weights");
      const request = action === "read" ? store.get(MODEL.sha256) : action === "clear" ? store.clear() : store.put(blob, MODEL.sha256);
      const abort = () => { try { tx.abort(); } catch {} };
      signal?.addEventListener("abort", abort, { once: true });
      tx.oncomplete = () => { signal?.removeEventListener("abort", abort); resolve(action === "read" && request.result instanceof Blob ? request.result : undefined); };
      tx.onabort = tx.onerror = () => { signal?.removeEventListener("abort", abort); reject(signal?.aborted ? signal.reason : new LabError("MODEL_STORAGE", "Modello disponibile solo in memoria: salvataggio locale non riuscito.")); };
    });
  } finally { db.close(); }
}
