import type { NoteFormat } from "@/lib/notes/format";
export type NoteText = {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  content: string;
  contentFormat: NoteFormat;
  createdAt: number;
  updatedAt: number;
  revision: number;
  lastMutationId: string;
  deletedAt: number | null;
};

export type PersonalNote = NoteText & {
  pinned: boolean;
  changeSeq: number;
};
export type NoteCopySeed = Pick<PersonalNote,"id"|"title"|"content"|"contentFormat">;

export type ClassSubject = {
  id: string;
  classId: string;
  name: string;
  revision: number;
  archivedAt: number | null;
};

export type ClassNote = NoteText & {
  classId: string | null;
  className: string;
  authorId: string;
  authorName: string;
  pinned: boolean;
};

export type NoteDraft = {
  userId: string;
  id: string;
  space: "personal" | "class";
  classId?: string;
  subjectId: string;
  subjectName: string;
  title: string;
  content: string;
  contentFormat: NoteFormat;
  expectedContentFormat?: NoteFormat;
  pinned: boolean;
  baseRevision: number;
  mutationId: string;
  localVersion: number;
  localEditedAt: number;
  deleted?: boolean;
  conflict?: PersonalNote | ClassNote | null;
  sourceLabel?: string;
};

export type PortableDraft = Omit<NoteDraft,"userId">;
export type ClassNoteSnapshot = Pick<ClassNote,"className"|"subjectName"|"title"|"content"|"contentFormat"|"updatedAt">;
export type NotesBackupV2 = {
  app:"iPagell";
  backupVersion:2;
  exportedAt:string;
  data:import("./domain").SchoolData;
  preferences:import("./domain").Preferences;
  notes:Omit<PersonalNote,"contentFormat">[];
  pendingNotes:(Omit<PortableDraft,"contentFormat"|"expectedContentFormat"> & {conflict?:unknown})[];
  classDrafts:(Omit<PortableDraft,"contentFormat"|"expectedContentFormat"> & {conflict?:unknown})[];
  authoredClassNotes:Omit<ClassNoteSnapshot,"contentFormat">[];
  completeness:"complete"|"device-only";
};
export type NotesBackupV3 = Omit<NotesBackupV2,"backupVersion"|"notes"|"pendingNotes"|"classDrafts"|"authoredClassNotes"> & {
  backupVersion:3; notes:PersonalNote[]; pendingNotes:PortableDraft[]; classDrafts:PortableDraft[]; authoredClassNotes:ClassNoteSnapshot[];
};
