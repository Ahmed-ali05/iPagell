import { z } from "zod";

const id = z
  .string()
  .min(1)
  .max(150)
  .regex(/^[\w-]+$/);
const short = z.string().trim().min(1).max(120);
const note = z.string().max(4000).optional();
const weight = z.number().finite().min(0.1).max(100);
export const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const date = new Date(`${s}T12:00:00Z`);
    return (
      Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === s
    );
  }, "Data non valida");
const instant = z.string().datetime({ offset: true });
export const gradeSchema = z
  .object({
    id,
    subjectId: id,
    semesterId: id,
    typeId: id,
    value: z.number().finite().min(1).max(6),
    weight,
    date: daySchema,
    note,
  })
  .strict();
export const preferencesSchema = z
  .object({
    studentName: short,
    theme: z.enum(["system", "light", "dark"]),
    absenceThresholdHours: z.number().finite().min(1).max(1000),
    currentSemesterId: id,
    gradeGoal: z.number().finite().min(1).max(6),
    reduceMotion: z.boolean().optional(),
    school: z.string().max(150).optional(),
  })
  .strict();
export const schoolDataSchema = z
  .object({
    version: z.literal(1),
    updatedAt: instant,
    semesters: z
      .array(
        z
          .object({
            id,
            name: short,
            schoolYear: short,
            startDate: daySchema,
            endDate: daySchema,
            archived: z.boolean().optional(),
          })
          .strict()
          .refine((s) => s.startDate <= s.endDate, "La fine precede l’inizio"),
      )
      .min(1)
      .max(60),
    subjects: z
      .array(
        z
          .object({
            id,
            name: short,
            color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
            teacher: z.string().max(120).optional(),
            coefficient: weight,
            gradeTypes: z
              .array(
                z
                  .object({
                    id,
                    name: short,
                    weight,
                    component: z.string().max(120).optional(),
                  })
                  .strict(),
              )
              .min(1)
              .max(30),
            archived: z.boolean().optional(),
          })
          .strict(),
      )
      .max(150),
    grades: z.array(gradeSchema).max(10000),
    agenda: z
      .array(
        z
          .object({
            id,
            subjectId: id,
            semesterId: id,
            kind: z.enum(["task", "test"]),
            title: z.string().trim().min(1).max(200),
            description: note,
            dueAt: instant,
            reminder: z.boolean().optional(),
            completed: z.boolean(),
            typeId: z.string().max(150).optional(),
            weight: weight.optional(),
          })
          .strict(),
      )
      .max(10000),
    absences: z
      .array(
        z
          .object({
            id,
            semesterId: id,
            date: daySchema,
            subjectId: id.optional(),
            kind: z.enum(["justified", "unjustified", "late", "early-exit"]),
            durationHours: z.number().finite().min(0.1).max(24),
            justified: z.boolean(),
            note,
          })
          .strict(),
      )
      .max(10000),
  })
  .strict()
  .superRefine((data, ctx) => {
    const fail = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    for (const list of [
      data.semesters,
      data.subjects,
      data.grades,
      data.agenda,
      data.absences,
      ...data.subjects.map((s) => s.gradeTypes),
    ]) {
      if (new Set(list.map((item) => item.id)).size !== list.length)
        fail("Identificatori duplicati");
    }
    const semesters = new Set(data.semesters.map((s) => s.id));
    const subjects = new Map(data.subjects.map((s) => [s.id, s]));
    for (const item of [...data.grades, ...data.agenda, ...data.absences]) {
      if (!semesters.has(item.semesterId)) fail("Semestre inesistente");
      if (item.subjectId && !subjects.has(item.subjectId))
        fail("Materia inesistente");
      if (
        "typeId" in item &&
        item.typeId &&
        !subjects
          .get(item.subjectId!)
          ?.gradeTypes.some((t) => t.id === item.typeId)
      )
        fail("Tipologia di voto inesistente");
    }
  });
export const diarySchema = z
  .object({ data: schoolDataSchema, preferences: preferencesSchema })
  .strict()
  .superRefine((diary, ctx) => {
    if (
      !diary.data.semesters.some(
        (s) => s.id === diary.preferences.currentSemesterId,
      )
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Semestre selezionato inesistente",
      });
  });
export const backupSchema = z
  .object({
    app: z.literal("iPagell"),
    exportedAt: instant,
    data: schoolDataSchema,
    preferences: preferencesSchema,
  })
  .strict()
  .superRefine((backup, ctx) => {
    if (
      !backup.data.semesters.some(
        (s) => s.id === backup.preferences.currentSemesterId,
      )
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Semestre selezionato inesistente",
      });
  });
export const registerSchema = z
  .object({
    name: short,
    school: z.string().trim().max(150),
    semester: short,
    schoolYear: short,
    startDate: daySchema,
    endDate: daySchema,
    // Accept the previous identifier for clients still using a cached app.
    preset: z.enum(["empty", "basic", "sig"]).transform((value) =>
      value === "sig" ? "basic" : value,
    ),
  })
  .strict()
  .refine((s) => s.startDate <= s.endDate, "Controlla le date del semestre");
export type Registration = z.infer<typeof registerSchema>;

export function parseGrade(input: string): number {
  const text = input.trim().replace(",", ".");
  const range = /^(\d)\s*[-–]\s*(\d)$/.exec(text);
  const value =
    range && Number(range[2]) === Number(range[1]) + 1
      ? (Number(range[1]) + Number(range[2])) / 2
      : Number(text);
  if (!text || !Number.isFinite(value) || value < 1 || value > 6)
    throw new Error("Usa un voto da 1 a 6, per esempio 4.5 oppure 4-5.");
  return value;
}
