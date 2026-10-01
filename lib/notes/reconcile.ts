import type { NoteDraft, PersonalNote } from "@/types/notes";
import type { PersonalRecord } from "./storage";
import { NoteDeviceConflict } from "./errors";

export function writtenMatches(draft: NoteDraft, note: PersonalNote) {
  return note.lastMutationId === draft.mutationId && (draft.deleted
    ? !!note.deletedAt
    : !note.deletedAt && draft.contentFormat === note.contentFormat && draft.content === note.content
      && draft.title.trim() === note.title && draft.subjectId === note.subjectId
      && draft.subjectName.trim() === note.subjectName && draft.pinned === note.pinned);
}

// A server acknowledgement may change revision/format/version without changing
// the user's draft. Another writer's mutation must still be rejected.
export function sameDraft(a: NoteDraft | null, b: NoteDraft | null) {
  if (!a || !b) return a === b;
  return a.mutationId === b.mutationId && a.content === b.content && a.contentFormat === b.contentFormat
    && a.title === b.title && a.subjectId === b.subjectId && a.subjectName === b.subjectName
    && a.pinned === b.pinned && !!a.deleted === !!b.deleted && JSON.stringify(a.conflict ?? null) === JSON.stringify(b.conflict ?? null);
}

export function savePersonalRecord(current: PersonalRecord | null, draft: NoteDraft, expected: NoteDraft | null): PersonalRecord {
  const acknowledged = !!expected && !current?.draft && !!current?.remote && writtenMatches(expected, current.remote);
  if (!sameDraft(current?.draft ?? null, expected) && !acknowledged) throw new NoteDeviceConflict();
  if (current?.draft?.conflict || !expected && (current?.remote?.revision ?? 0) !== draft.baseRevision) throw new NoteDeviceConflict();
  const localVersion = (current?.localVersion ?? 0) + 1;
  const next = { ...draft, baseRevision: current?.remote?.revision ?? 0,
    expectedContentFormat: current?.remote?.contentFormat ?? "plain", localVersion, localEditedAt: Date.now() };
  return { ...current, userId: draft.userId, id: draft.id, remote: current?.remote ?? null, draft: next, localVersion };
}

export function reconcilePersonal(current: PersonalRecord | null, note: PersonalNote, userId: string): PersonalRecord {
  if (current?.remote && note.changeSeq < current.remote.changeSeq) return current;
  let draft = current?.draft ?? null;
  let inFlight = current?.inFlight ?? null;
  const ownWrite = !!inFlight && writtenMatches(inFlight, note);
  if (draft && writtenMatches(draft, note)) draft = null;
  else if (draft && ownWrite && !draft.conflict) {
    draft = { ...draft, baseRevision: note.revision, expectedContentFormat: note.contentFormat };
  } else if (draft && (note.revision !== draft.baseRevision || note.contentFormat !== (draft.expectedContentFormat ?? "plain")) && !draft.conflict) {
    draft = { ...draft, conflict: note };
  }
  if (ownWrite || inFlight && (note.revision > inFlight.baseRevision || note.deletedAt)) inFlight = null;
  return { userId, id: note.id, remote: note, draft, inFlight, localVersion: (current?.localVersion ?? 0) + 1 };
}
