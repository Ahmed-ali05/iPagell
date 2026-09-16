import { z } from "zod";

export const classIdSchema = z.string().uuid();

const displayName = z
  .string()
  .trim()
  .min(1, "Inserisci un nome visibile.")
  .max(80, "Il nome visibile può avere al massimo 80 caratteri.");

export const createClassSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Il nome della classe è troppo corto.")
      .max(80, "Il nome della classe può avere al massimo 80 caratteri."),
    description: z.string().trim().max(500).default(""),
    displayName,
  })
  .strict();

export const updateClassSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500),
  })
  .strict();

export const createInviteSchema = z
  .object({
    expiresInDays: z.number().int().min(1).max(30).default(7),
    maxUses: z.number().int().min(1).max(50).default(50),
  })
  .strict();

export const joinClassSchema = z
  .object({ code: z.string().min(1).max(32), displayName })
  .strict();

export const updateMemberSchema = z.discriminatedUnion("operation", [
  z
    .object({ operation: z.literal("display-name"), displayName })
    .strict(),
  z
    .object({
      operation: z.literal("role"),
      role: z.enum(["moderator", "member"]),
    })
    .strict(),
  z.object({ operation: z.literal("transfer") }).strict(),
]);

const inviteAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function normalizeInviteCode(value: string) {
  const normalized = value.toUpperCase().replace(/[\s-]/g, "");
  return normalized.length === 12 &&
    [...normalized].every((character) => inviteAlphabet.includes(character))
    ? normalized
    : null;
}

export function createInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const raw = [...bytes]
    .map((value) => inviteAlphabet[value & 31])
    .join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
}
