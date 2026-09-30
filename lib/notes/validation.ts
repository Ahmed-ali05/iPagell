import { z } from "zod";
import type { NoteDraft } from "@/types/notes";

export const noteId = z.string().uuid();
export const subjectId = z.string().min(1).max(150).regex(/^[\w-]+$/);
const codePoints = (value: string) => [...value].length;
export const noteTitle = z.string().trim().min(1).refine((value) => codePoints(value) <= 120);
export const noteContent = z.string().refine((value) => codePoints(value) <= 20_000);
export const noteBody = z.object({
  subjectId,
  subjectName: z.string().trim().min(1).max(120),
  title: noteTitle,
  content: noteContent,
}).strict();
export const noteCreate = noteBody.extend({
  id: noteId,
  expectedUserId: z.string().min(1).max(100),
  mutationId: noteId,
  baseRevision: z.literal(0),
  pinned: z.boolean().default(false),
}).strict();
export const noteUpdate = noteBody.extend({
  expectedUserId: z.string().min(1).max(100),
  mutationId: noteId,
  baseRevision: z.number().int().positive(),
  pinned: z.boolean(),
}).strict();
export const noteDelete = noteUpdate.pick({ expectedUserId: true, mutationId: true, baseRevision: true });
export const classSubjectCreate = z.object({ name: z.string().trim().min(1).max(120) }).strict();
export const classSubjectUpdate = classSubjectCreate.partial().extend({
  archived: z.boolean().optional(),
  baseRevision: z.number().int().positive(),
}).strict().refine((value) => value.name !== undefined || value.archived !== undefined);
export const classNoteCreate = noteCreate.omit({ pinned: true, subjectName: true });
export const classNoteUpdate = noteUpdate.omit({ pinned: true, subjectName: true });
export const classNoteDelete = noteDelete;

export function noteByteSize(value: { id: string; subjectId: string; subjectName: string; title: string; content: string; pinned?: boolean }) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
export function validateNoteBytes(value: Parameters<typeof noteByteSize>[0]) {
  return noteByteSize(value) <= 65_536;
}
export function localDraftBytes(personal:NoteDraft[],classDrafts:NoteDraft[],next:NoteDraft){
  const drafts=[...personal.filter(draft=>!(next.space==="personal"&&draft.id===next.id)),...classDrafts.filter(draft=>!(next.space==="class"&&draft.id===next.id)),next];
  return new TextEncoder().encode(JSON.stringify(drafts)).byteLength;
}
export function subjectKey(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("und");
}
export function searchKey(value: string) { return subjectKey(value); }
