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
export async function saveLocal(value: LocalDiary) {
  diarySchema.parse({ data: value.data, preferences: value.preferences });
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("accounts", "readwrite");
      tx.objectStore("accounts").put(value, value.user.id);
      // An IndexedDB request can succeed before the transaction commits.
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    localStorage.setItem(ACTIVE_KEY, value.user.id);
  } finally {
    db.close();
  }
}
export async function readLocal(id: string) {
  const value = await read<LocalDiary>("accounts", id);
  if (
    !value ||
    value.user.id !== id ||
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
export async function forgetLocal(id?: string) {
  localStorage.removeItem(ACTIVE_KEY);
  if (!id) return;
  localStorage.removeItem(`ipagell-class-agenda-v1:${id}`);
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("accounts", "readwrite");
      tx.objectStore("accounts").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
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
