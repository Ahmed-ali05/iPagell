import { env } from "cloudflare:workers";
import type { AccountIdentity } from "@/types/domain";
import {
  canClassAction,
  classFeatureEnabled,
  parseClassRole,
  type ClassAction,
  type ClassRole,
} from "@/lib/classes/permissions";
import { database } from "./db";
import { HttpError } from "./http";

export function requireClassesEnabled() {
  const value = (env as unknown as { IPAGELL_CLASSES?: string })
    .IPAGELL_CLASSES;
  if (!classFeatureEnabled(value))
    throw new HttpError(404, "Funzione non disponibile");
}

export async function requireClassPermission(
  user: AccountIdentity,
  classId: string,
  action: ClassAction,
): Promise<ClassRole> {
  const row = await database()
    .prepare(
      "SELECT role FROM class_members WHERE class_id = ? AND user_id = ?",
    )
    .bind(classId, user.id)
    .first<{ role: string }>();
  const role = row ? parseClassRole(row.role) : null;
  if (!role) throw new HttpError(404, "Classe non trovata");
  if (!canClassAction(role, action))
    throw new HttpError(403, "Azione non consentita");
  return role;
}
