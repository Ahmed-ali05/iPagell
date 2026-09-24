import { backupSchema, diarySchema } from "./validation";
import type {
  AccountIdentity,
  BackupPayload,
  DiarySnapshot,
  Preferences,
  SchoolData,
} from "@/types/domain";

export interface LocalDiary extends DiarySnapshot {
  user: AccountIdentity;
  dirty: boolean;
}
const ACTIVE_KEY = "ipagell-active-account-v2";
export class LocalConflictError extends Error {
  constructor() {
    super("Il diario sul dispositivo è cambiato in un’altra scheda. Aggiornalo e riprova: questa modifica non è stata salvata.");
  }
}
export function sameLocal(a: LocalDiary | null, b: LocalDiary | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}
export function activateAccount(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ipagell-db", 2);
    request.onupgradeneeded = () => {
      for (const name of ["state", "accounts"])
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Archivio locale non disponibile"));
    request.onblocked = () =>
      reject(new Error("Chiudi le altre schede di iPagell e riprova."));
  });
}
async function read<T>(store: string, key: string): Promise<T | null> {
  const db = await openDb();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const r = db.transaction(store).objectStore(store).get(key);
      r.onsuccess = () => resolve(r.result ?? null);
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
// Compare and write in ONE transaction: the remote revision alone cannot detect
// two offline edits based on the same server snapshot.
export async function saveLocal(value: LocalDiary, expected: LocalDiary | null) {
  diarySchema.parse({ data: value.data, preferences: value.preferences });
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("accounts", "readwrite");
      const store = tx.objectStore("accounts");
      let conflict = false;
      const request = store.get(value.user.id);
      request.onsuccess = () => {
        if (!sameLocal(request.result ?? null, expected)) {
          conflict = true;
          tx.abort();
        } else store.put(value, value.user.id);
      };
      // An IndexedDB request can succeed before the transaction commits.
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(conflict ? new LocalConflictError() : tx.error);
    });
  } finally {
    db.close();
  }
}
export async function readLocal(id: string) {
  const value = await read<LocalDiary>("accounts", id);
  if (
    !value ||
    value.user?.id !== id ||
    typeof value.user.username !== "string" ||
    typeof value.dirty !== "boolean" ||
    !Number.isSafeInteger(value.revision) || value.revision < 1 ||
    !diarySchema.safeParse({ data: value.data, preferences: value.preferences })
      .success
  )
    return null;
  return value;
}
export function activeAccountId() {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}
export async function forgetLocal(id?: string, expected?: LocalDiary | null) {
  if (!id || activeAccountId() === id) activateAccount(null);
  if (!id) return;
  localStorage.removeItem(`ipagell-class-agenda-v1:${id}`);
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("accounts", "readwrite");
      const store = tx.objectStore("accounts");
      let conflict = false;
      const request = store.get(id);
      request.onsuccess = () => {
        if (!sameLocal(request.result ?? null, expected ?? null)) {
          conflict = true;
          tx.abort();
        } else store.delete(id);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(conflict ? new LocalConflictError() : tx.error);
    });
  } finally {
    db.close();
  }
}
export function createBackup(
  data: SchoolData,
  preferences: Preferences,
): BackupPayload {
  return {
    app: "iPagell",
    exportedAt: new Date().toISOString(),
    data,
    preferences,
  };
}
export function parseBackup(value: unknown): BackupPayload {
  return backupSchema.parse(value);
}
export async function legacyBackup(): Promise<BackupPayload | null> {
  const data = await read<SchoolData>("state", "school-data");
  if (!data) return null;
  const preferences = JSON.parse(
    localStorage.getItem("ipagell-preferences-v1") ?? "null",
  );
  const result = backupSchema.safeParse(createBackup(data, preferences));
  return result.success ? result.data : null;
}
export function downloadBackup(
  backup: BackupPayload,
  filename = "ipagell-backup",
) {
  const href = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = href;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
