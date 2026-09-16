import { env } from "cloudflare:workers";
import { DiaryRepository } from "./repository";
import { ClassRepository } from "./class-repository";
export function repository() {
  return new DiaryRepository(database());
}
export function classRepository() {
  return new ClassRepository(database());
}
export function database(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("DB unavailable");
  return db;
}
