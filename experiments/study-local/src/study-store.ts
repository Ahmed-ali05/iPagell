import { LabError } from "./source";
import { emptyArchive, newId, validateArchive, validateOriginals, type Archive, type Original } from "./graph";

export const STUDY_DB = "ipagell-study-lab-archive-v1";
export type StudyRecord = { accountId: string; revision: string; purge: string; archive: Archive | null; originals: Original[] };
export type Snapshot = { archive: Archive; originals: Original[] };
const storageError = () => new LabError("STUDY_STORAGE", "Salvataggio locale non disponibile. La bozza resta in questa scheda: esportala o riprova prima di uscire.");
function accountKey(accountId: string) { if (!/^[a-zA-Z0-9_-]{1,80}$/.test(accountId)) throw new LabError("ACCOUNT", "Profilo locale non valido."); }
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(STUDY_DB, 1);
      request.onupgradeneeded = () => { request.result.createObjectStore("accounts", { keyPath: "accountId" }); };
      request.onsuccess = () => { const db = request.result; db.onversionchange = () => db.close(); resolve(db); };
      request.onerror = () => reject(storageError());
      request.onblocked = () => reject(storageError());
    } catch { reject(storageError()); }
  });
}
export async function readStudy(accountId: string, signal?: AbortSignal): Promise<StudyRecord | undefined> {
  accountKey(accountId); signal?.throwIfAborted(); const db = await openDB();
  try {
    signal?.throwIfAborted();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("accounts", "readonly"), request = tx.objectStore("accounts").get(accountId);
      const abort = () => tx.abort(); signal?.addEventListener("abort", abort, { once: true });
      tx.oncomplete = () => { signal?.removeEventListener("abort", abort); resolve(request.result as StudyRecord | undefined); };
      tx.onabort = tx.onerror = () => { signal?.removeEventListener("abort", abort); reject(signal?.aborted ? signal.reason : storageError()); };
    });
  } finally { db.close(); }
}
// Validation/hashing occurs before opening the transaction. The compare and write share
// one readwrite transaction; a tombstone prevents an old tab from recreating erased data.
export async function commitStudy(accountId: string, expected: string | null, snapshot: Snapshot | null, options: { purge?: boolean; signal?: AbortSignal } = {}): Promise<StudyRecord> {
  accountKey(accountId); const { signal } = options; signal?.throwIfAborted();
  const next = snapshot ? structuredClone(snapshot) : null;
  if (next) { validateArchive(next.archive); await validateOriginals(next.archive, next.originals, signal); }
  signal?.throwIfAborted(); const db = await openDB();
  try {
    signal?.throwIfAborted();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("accounts", "readwrite"), store = tx.objectStore("accounts");
      let result: StudyRecord, failure: unknown;
      const abort = () => { failure = signal?.reason; tx.abort(); }; signal?.addEventListener("abort", abort, { once: true });
      const request = store.get(accountId);
      request.onsuccess = () => {
        try {
          const current = request.result as StudyRecord | undefined;
          if ((current?.revision ?? null) !== expected) throw new LabError("STUDY_CONFLICT", "Un’altra scheda ha modificato questo profilo. La bozza è conservata qui: esportala oppure riapri la versione salvata.");
          const removed = current?.archive?.documents.some(d => !next?.archive.documents.some(n => n.id === d.id));
          // Source removal and replacement of a whole workspace are privacy barriers.
          if (removed && next && !options.purge) throw new LabError("PURGE_REQUIRED", "La rimozione di fonti richiede la cancellazione della cronologia.");
          if (removed && next?.archive.history.length && next.archive.space.id === current?.archive?.space.id) throw new LabError("PURGE_REQUIRED", "Svuota la cronologia prima di rimuovere una fonte.");
          for (const document of next?.archive.documents ?? []) {
            const old = current?.archive?.documents.find(d => d.id === document.id);
            if (old && next?.archive.space.id === current?.archive?.space.id && JSON.stringify(old) !== JSON.stringify(document)) throw new LabError("SOURCE_IMMUTABLE", "Una fonte già salvata non può essere modificata.");
          }
          result = { accountId, revision: newId(), purge: options.purge || !next ? newId() : current?.purge ?? newId(), archive: next?.archive ?? null, originals: next?.originals ?? [] };
          store.put(result);
        } catch (error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => { signal?.removeEventListener("abort", abort); resolve(result); };
      tx.onabort = tx.onerror = () => { signal?.removeEventListener("abort", abort); reject(failure ?? storageError()); };
    });
  } finally { db.close(); }
}

export class StudySession {
  accountId: string | null = null;
  record?: StudyRecord;
  draft?: Snapshot;
  dirty = false;
  conflict = false;
  private controller = new AbortController();
  private serial = 0;
  private pendingPurge = false;
  get signal() { return this.controller.signal; }
  close() { this.controller.abort(); this.controller = new AbortController(); this.serial++; this.accountId = null; this.record = undefined; this.draft = undefined; this.dirty = false; this.conflict = false; this.pendingPurge = false; }
  async open(accountId: string) {
    this.close(); const serial = this.serial, signal = this.signal; this.accountId = accountId;
    try {
      const record = await readStudy(accountId, signal); signal.throwIfAborted();
      if (record?.archive) { validateArchive(record.archive); await validateOriginals(record.archive, record.originals, signal); }
      signal.throwIfAborted(); if (serial !== this.serial) return;
      this.record = record; this.draft = record?.archive ? { archive: record.archive, originals: record.originals } : { archive: emptyArchive(), originals: [] };
    } catch (error) {
      if (serial === this.serial) this.draft = { archive: emptyArchive(), originals: [] };
      throw error;
    }
  }
  async save(snapshot: Snapshot, purge = false) {
    if (!this.accountId || !this.draft) throw new LabError("ACCOUNT", "Apri prima un profilo di prova.");
    if (this.conflict) throw new LabError("STUDY_CONFLICT", "Esporta la bozza oppure riapri la versione salvata prima di continuare.");
    validateArchive(snapshot.archive);
    this.draft = structuredClone(snapshot); this.dirty = true; this.pendingPurge ||= purge;
    const serial = this.serial, signal = this.signal;
    try {
      const record = await commitStudy(this.accountId, this.record?.revision ?? null, this.draft, { purge: this.pendingPurge, signal });
      signal.throwIfAborted(); if (serial !== this.serial) return;
      this.record = record; this.draft = { archive: record.archive!, originals: record.originals }; this.dirty = false; this.pendingPurge = false;
    } catch (error) { if (serial === this.serial && error instanceof LabError && error.code === "STUDY_CONFLICT") {
        this.conflict = true;
        try { await this.checkFreshness(); } catch (freshnessError) {
          if (freshnessError instanceof LabError && freshnessError.code === "STUDY_PURGED") throw freshnessError;
        }
      }
      throw error; }
  }
  async erase() {
    if (!this.accountId) return;
    const serial = this.serial, signal = this.signal;
    const record = await commitStudy(this.accountId, this.record?.revision ?? null, null, { purge: true, signal });
    signal.throwIfAborted(); if (serial !== this.serial) return;
    this.record = record; this.draft = { archive: emptyArchive(), originals: [] }; this.dirty = false; this.conflict = false;
  }
  async checkFreshness() {
    if (!this.accountId) return;
    const serial = this.serial, signal = this.signal, current = await readStudy(this.accountId, signal);
    signal.throwIfAborted(); if (serial !== this.serial) return;
    if ((current?.revision ?? null) === (this.record?.revision ?? null)) return;
    if (current?.purge !== this.record?.purge) {
      // Never keep deleted originals/evidence in a suspended tab or downloadable draft.
      this.record = current; this.draft = undefined; this.conflict = true; this.dirty = false;
      throw new LabError("STUDY_PURGED", "Fonti o archivio cancellati in un’altra scheda. Copie in memoria eliminate: riapri il profilo.");
    }
    this.conflict = true;
    throw new LabError("STUDY_CONFLICT", "Il profilo è cambiato in un’altra scheda. Esporta la bozza o riapri la versione salvata.");
  }
}
