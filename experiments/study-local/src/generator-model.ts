import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { LabError } from "./source";

// Pinned LFS pointer, not the Xet storage hash. No tokenizer from another model.
export const GENERATOR = Object.freeze({
  id: "gemma-4-E2B-it-gpu", revision: "b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1",
  url: "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1/gemma-4-E2B-it-gpu.litertlm",
  bytes: 2008432640, sha256: "a53a59001894c58e6bdb5b9b227709f91a2e3e556baa7d85acf9c55402ba5cf5",
  runtime: "@litert-lm/core@0.18.0", license: "Apache-2.0",
});
export const GENERATOR_FILE = `study-generator-${GENERATOR.sha256}.litertlm`;
export const generatorReserve = GENERATOR.bytes * 2 + 64 * 1024 * 1024;
export function admitGeneratorStorage(estimate: StorageEstimate) {
  if (!Number.isFinite(estimate.quota) || !Number.isFinite(estimate.usage) || estimate.quota! - estimate.usage! < generatorReserve)
    throw new LabError("GENERATOR_QUOTA", `Spazio disponibile non verificabile o inferiore a ${generatorReserve} byte. La mappa manuale resta disponibile.`);
}
// Streaming verification is shared by cached and downloaded files. The sink never
// accumulates a second 2 GB JS buffer. A partially written OPFS file is not usable.
export async function verifyGeneratorStream(stream: ReadableStream<Uint8Array>, signal: AbortSignal,
  progress: (bytes: number) => void, sink?: (bytes: Uint8Array) => Promise<void>, expected: { bytes: number; sha256: string } = GENERATOR) {
  const reader = stream.getReader(), hash = sha256.create(); let bytes = 0, sinceYield = 0;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const part = await reader.read(); signal.throwIfAborted(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > expected.bytes) throw new LabError("GENERATOR_SIZE", "Dimensione del generatore inattesa.");
      for (let offset = 0; offset < part.value.length; offset += 1024 * 1024) {
        signal.throwIfAborted(); const bounded = part.value.subarray(offset, offset + 1024 * 1024);
        hash.update(bounded); await sink?.(bounded); sinceYield += bounded.length;
        // File streams can resolve reads entirely through microtasks. Explicitly
        // yield to input/timers so cache verification remains cancellable too.
        if (sinceYield >= 4 * 1024 * 1024) { sinceYield = 0; await new Promise(resolve => setTimeout(resolve, 0)); }
      }
      signal.throwIfAborted(); progress(bytes);
    }
    if (bytes !== expected.bytes || bytesToHex(hash.digest()) !== expected.sha256)
      throw new LabError("GENERATOR_INTEGRITY", "Generatore incompleto o hash errato. Nessuna inferenza consentita.");
    signal.throwIfAborted();
  } finally { signal.removeEventListener("abort", abort); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
export async function generatorFile(signal: AbortSignal, progress: (bytes: number) => void, allowDownload = false): Promise<File> {
  signal.throwIfAborted();
  if (!navigator.storage?.getDirectory) throw new LabError("GENERATOR_STORAGE", "Archivio OPFS non disponibile: prova del generatore interrotta.");
  const root = await navigator.storage.getDirectory(); signal.throwIfAborted();
  let cached: File | undefined;
  try { cached = await (await root.getFileHandle(GENERATOR_FILE)).getFile(); } catch (error) { if (!(error instanceof DOMException && error.name === "NotFoundError")) throw error; }
  if (cached) {
    try { await verifyGeneratorStream(cached.stream(), signal, progress); return cached; }
    catch { signal.throwIfAborted(); await root.removeEntry(GENERATOR_FILE); }
  }
  if (!allowDownload) throw new LabError("GENERATOR_REQUIRED", "Usa prima il comando dedicato per scaricare/verificare il generatore. Il confronto non avvia download impliciti.");
  admitGeneratorStorage(await navigator.storage.estimate()); signal.throwIfAborted();
  const response = await fetch(GENERATOR.url, { signal, credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" });
  if (!response.ok || !response.body) { await response.body?.cancel().catch(() => {}); throw new LabError("GENERATOR_DOWNLOAD", "Download del generatore non disponibile. Nessun servizio remoto sostitutivo."); }
  const length = response.headers.get("content-length");
  if (length && Number(length) !== GENERATOR.bytes) { await response.body.cancel(); throw new LabError("GENERATOR_SIZE", "Dimensione del generatore inattesa."); }
  let writer: FileSystemWritableFileStream | undefined;
  try {
    const handle = await root.getFileHandle(GENERATOR_FILE, { create: true });
    writer = await handle.createWritable();
    await verifyGeneratorStream(response.body, signal, progress, bytes => writer!.write(Uint8Array.from(bytes)));
    await writer.close(); writer = undefined; signal.throwIfAborted();
    return await handle.getFile();
  } catch (error) { await writer?.abort().catch(() => {}); await root.removeEntry(GENERATOR_FILE).catch(() => {}); throw error; }
  finally { await response.body.cancel().catch(() => {}); }
}
export async function forgetGenerator() {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(GENERATOR_FILE).catch(error => { if (!(error instanceof DOMException && error.name === "NotFoundError")) throw error; });
}
