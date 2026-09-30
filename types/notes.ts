export type NoteText = {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  content: string;
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
export type ClassNoteSnapshot = Pick<ClassNote,"className"|"subjectName"|"title"|"content"|"updatedAt">;
export type NotesBackupV2 = {
  app:"iPagell";
  backupVersion:2;
  exportedAt:string;
  data:import("./domain").SchoolData;
  preferences:import("./domain").Preferences;
  notes:PersonalNote[];
  pendingNotes:PortableDraft[];
  classDrafts:PortableDraft[];
  authoredClassNotes:ClassNoteSnapshot[];
  completeness:"complete"|"device-only";
};
