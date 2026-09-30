import type { NoteDraft } from "@/types/notes";

export function personalWriteBody(draft: NoteDraft, userId: string, create: boolean) {
  return {
    ...(create ? { id: draft.id } : {}),
    expectedUserId: userId,
    mutationId: draft.mutationId,
    baseRevision: draft.baseRevision,
    subjectId: draft.subjectId,
    subjectName: draft.subjectName,
    title: draft.title.trim(),
    content: draft.content,
    pinned: draft.pinned,
  };
}

export function classWriteBody(draft: NoteDraft, userId: string, create: boolean) {
  return {
    ...(create ? { id: draft.id } : {}),
    expectedUserId: userId,
    mutationId: draft.mutationId,
    baseRevision: draft.baseRevision,
    subjectId: draft.subjectId,
    title: draft.title.trim(),
    content: draft.content,
  };
}
