import { defaultPreferences, seedData } from "@/lib/seed";
import type { BackupPayload, Preferences, SchoolData } from "@/types/domain";

const DB_NAME = "ipagell-db";
const STORE = "state";
const PREFS_KEY = "ipagell-preferences-v1";

const cloneSeed = (): SchoolData => JSON.parse(JSON.stringify(seedData));

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadSchoolData(): Promise<SchoolData> {
  if (typeof indexedDB === "undefined") return cloneSeed();
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get("school-data");
    request.onsuccess = () => resolve(request.result ?? cloneSeed());
    request.onerror = () => reject(request.error);
  });
}

export async function saveSchoolData(data: SchoolData): Promise<void> {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(payload, "school-data");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function loadPreferences(): Preferences {
  if (typeof localStorage === "undefined") return { ...defaultPreferences };
  try { return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") }; }
  catch { return { ...defaultPreferences }; }
}

export function savePreferences(preferences: Preferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
}

export function createBackup(data: SchoolData, preferences: Preferences): BackupPayload {
  return { app: "iPagell", exportedAt: new Date().toISOString(), data, preferences };
}

export function isValidBackup(value: unknown): value is BackupPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<BackupPayload>;
  return item.app === "iPagell" && item.data?.version === 1 && Array.isArray(item.data.subjects) && Array.isArray(item.data.grades) && !!item.preferences;
}
