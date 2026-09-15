export type ThemePreference = "system" | "light" | "dark";
export type AgendaKind = "task" | "test";
export type AbsenceKind = "justified" | "unjustified" | "late" | "early-exit";

export interface GradeType {
  id: string;
  name: string;
  weight: number;
  component?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  teacher?: string;
  coefficient: number;
  gradeTypes: GradeType[];
  archived?: boolean;
}

export interface Grade {
  id: string;
  subjectId: string;
  semesterId: string;
  typeId: string;
  value: number;
  weight: number;
  date: string;
  note?: string;
}

export interface AgendaItem {
  id: string;
  subjectId: string;
  semesterId: string;
  kind: AgendaKind;
  title: string;
  description?: string;
  dueAt: string;
  reminder?: boolean;
  completed: boolean;
  typeId?: string;
  weight?: number;
}

export interface Absence {
  id: string;
  semesterId: string;
  date: string;
  subjectId?: string;
  kind: AbsenceKind;
  durationHours: number;
  justified: boolean;
  note?: string;
}

export interface Semester {
  id: string;
  name: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  archived?: boolean;
}

export interface Preferences {
  studentName: string;
  theme: ThemePreference;
  absenceThresholdHours: number;
  currentSemesterId: string;
  gradeGoal: number;
}

export interface SchoolData {
  version: 1;
  updatedAt: string;
  semesters: Semester[];
  subjects: Subject[];
  grades: Grade[];
  agenda: AgendaItem[];
  absences: Absence[];
}

export interface BackupPayload {
  app: "iPagell";
  exportedAt: string;
  data: SchoolData;
  preferences: Preferences;
}
