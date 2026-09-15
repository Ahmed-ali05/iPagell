import type { Preferences, SchoolData } from "@/types/domain";

const iso = (value: string) => new Date(value).toISOString();

export const seedData: SchoolData = {
  version: 1,
  updatedAt: new Date().toISOString(),
  semesters: [
    { id: "sem-3", name: "Semestre 3", schoolYear: "2026/27", startDate: "2026-08-24", endDate: "2027-01-29" },
    { id: "sem-2", name: "Semestre 2", schoolYear: "2025/26", startDate: "2026-01-26", endDate: "2026-06-19", archived: true },
  ],
  subjects: [
    { id: "mat", name: "Matematica", color: "#6c5ce7", teacher: "L. Bernasconi", coefficient: 1.2, gradeTypes: [{ id: "mat-s", name: "Scritto", weight: 1.2, component: "Teoria" }, { id: "mat-o", name: "Orale", weight: 1, component: "Teoria" }] },
    { id: "inf", name: "Informatica", color: "#258ee7", teacher: "M. Rossi", coefficient: 1.4, gradeTypes: [{ id: "inf-p", name: "Pratico", weight: 1.4, component: "Pratica" }, { id: "inf-t", name: "Teorico", weight: 1, component: "Teoria" }] },
    { id: "eco", name: "Economia", color: "#ef9950", teacher: "A. Bianchi", coefficient: 1, gradeTypes: [{ id: "eco-s", name: "Scritto", weight: 1.1 }, { id: "eco-o", name: "Orale", weight: 1 }] },
    { id: "eng", name: "Inglese", color: "#32a576", teacher: "J. Keller", coefficient: .8, gradeTypes: [{ id: "eng-s", name: "Scritto", weight: 1 }, { id: "eng-o", name: "Orale", weight: 1 }] },
    { id: "sis", name: "Sistemi e reti", color: "#dd5f76", teacher: "D. Fontana", coefficient: 1.1, gradeTypes: [{ id: "sis-l", name: "Laboratorio", weight: 1.2 }, { id: "sis-t", name: "Teorico", weight: 1 }] },
  ],
  grades: [
    { id: "g1", subjectId: "mat", semesterId: "sem-3", typeId: "mat-s", value: 5.5, weight: 1, date: "2026-09-02", note: "Equazioni" },
    { id: "g2", subjectId: "mat", semesterId: "sem-3", typeId: "mat-o", value: 5, weight: 1, date: "2026-09-10", note: "Interrogazione" },
    { id: "g3", subjectId: "inf", semesterId: "sem-3", typeId: "inf-p", value: 6, weight: 1, date: "2026-09-04", note: "React basics" },
    { id: "g4", subjectId: "inf", semesterId: "sem-3", typeId: "inf-t", value: 5, weight: 1, date: "2026-09-11", note: "Basi di dati" },
    { id: "g5", subjectId: "eco", semesterId: "sem-3", typeId: "eco-s", value: 4.5, weight: 1, date: "2026-09-08", note: "Contabilità" },
    { id: "g6", subjectId: "eng", semesterId: "sem-3", typeId: "eng-o", value: 5, weight: 1, date: "2026-09-09", note: "Presentation" },
    { id: "g7", subjectId: "sis", semesterId: "sem-3", typeId: "sis-t", value: 3.5, weight: 1, date: "2026-09-12", note: "Protocolli" },
    { id: "old1", subjectId: "mat", semesterId: "sem-2", typeId: "mat-s", value: 4.8, weight: 1, date: "2026-05-02" },
    { id: "old2", subjectId: "inf", semesterId: "sem-2", typeId: "inf-p", value: 5.3, weight: 1, date: "2026-05-06" },
    { id: "old3", subjectId: "eco", semesterId: "sem-2", typeId: "eco-s", value: 4.6, weight: 1, date: "2026-05-09" },
    { id: "old4", subjectId: "eng", semesterId: "sem-2", typeId: "eng-s", value: 4.7, weight: 1, date: "2026-05-13" },
  ],
  agenda: [
    { id: "a1", subjectId: "mat", semesterId: "sem-3", kind: "test", title: "Funzioni esponenziali e logaritmi", description: "Capitoli 3–4, formulario consentito", dueAt: iso("2026-09-18T08:15:00+02:00"), reminder: true, completed: false, typeId: "mat-s", weight: 1.2 },
    { id: "a2", subjectId: "mat", semesterId: "sem-3", kind: "task", title: "Esercizi capitolo 4", dueAt: iso("2026-09-16T18:00:00+02:00"), completed: false },
    { id: "a3", subjectId: "sis", semesterId: "sem-3", kind: "task", title: "Ripassare reti", dueAt: iso("2026-09-17T16:00:00+02:00"), completed: false },
    { id: "a4", subjectId: "inf", semesterId: "sem-3", kind: "task", title: "Consegna interfaccia", dueAt: iso("2026-09-19T17:00:00+02:00"), completed: false },
    { id: "a5", subjectId: "eco", semesterId: "sem-3", kind: "test", title: "Bilancio e partita doppia", dueAt: iso("2026-09-25T10:10:00+02:00"), reminder: true, completed: false, typeId: "eco-s", weight: 1 },
    { id: "a6", subjectId: "eng", semesterId: "sem-3", kind: "task", title: "Read chapter 6", dueAt: iso("2026-09-14T12:00:00+02:00"), completed: true },
  ],
  absences: [
    { id: "ab1", semesterId: "sem-3", date: "2026-09-03", subjectId: "eng", kind: "justified", durationHours: 2, justified: true, note: "Visita medica" },
    { id: "ab2", semesterId: "sem-3", date: "2026-09-09", subjectId: "mat", kind: "late", durationHours: .5, justified: true },
    { id: "ab3", semesterId: "sem-3", date: "2026-09-15", subjectId: "sis", kind: "unjustified", durationHours: 1, justified: false },
  ],
};

export const defaultPreferences: Preferences = {
  studentName: "Ahmed",
  theme: "system",
  absenceThresholdHours: 24,
  currentSemesterId: "sem-3",
  gradeGoal: 5.2,
};
