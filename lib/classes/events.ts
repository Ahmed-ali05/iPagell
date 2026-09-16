import { z } from "zod";
import type { AgendaItem } from "@/types/domain";

export const eventFields = z.object({
  subject: z.string().trim().min(1).max(80),
  kind: z.enum(["task", "test"]),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  dueAt: z.string().datetime(),
  status: z.enum(["active", "cancelled"]).default("active"),
}).strict();
export const eventUpdate = eventFields.extend({ revision: z.number().int().positive() });
export const revisionSchema = z.object({ revision: z.number().int().positive() }).strict();
export const subscriptionInput = z.object({
  semesterId: z.string().min(1).max(100),
  subjectId: z.string().max(100).default(""),
  reminder: z.boolean().default(false),
}).strict();
export const subscriptionUpdate = z.object({
  revision: z.number().int().positive(),
  completed: z.boolean().optional(),
  reminder: z.boolean().optional(),
  semesterId: z.string().min(1).max(100).optional(),
  subjectId: z.string().max(100).optional(),
  detach: z.literal(true).optional(),
  personalEvent: eventFields.optional(),
}).strict();
export type EventFields = z.infer<typeof eventFields>;
export interface ClassEvent extends EventFields {
  id: string;
  classId: string;
  className: string;
  authorId: string | null;
  authorName: string;
  revision: number;
  updatedAt: number;
}
export interface ClassSubscription {
  id: string;
  event: ClassEvent;
  semesterId: string;
  subjectId: string;
  completed: boolean;
  reminder: boolean;
  revision: number;
  detachedAt: number | null;
}
export interface AgendaDisplayItem extends AgendaItem {
  shared?: ClassSubscription;
}
export function subscriptionAgenda(items: ClassSubscription[]): AgendaDisplayItem[] {
  return items.map((s) => ({
    id: `class:${s.id}`, semesterId: s.semesterId, subjectId: s.subjectId,
    kind: s.event.kind, title: s.event.title, description: s.event.description,
    dueAt: s.event.dueAt, completed: s.completed, reminder: s.reminder && s.event.status !== "cancelled",
    shared: s,
  }));
}
