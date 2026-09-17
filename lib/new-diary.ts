import type { Registration } from "./validation";
import type { Preferences, SchoolData } from "@/types/domain";

// Templates contain configuration only: never another student's results.
export function createDiary(input: Registration): {
  data: SchoolData;
  preferences: Preferences;
} {
  const semesterId = crypto.randomUUID();
  const names =
    input.preset === "basic"
      ? ["Matematica", "Italiano", "Inglese", "Storia", "Scienze"]
      : [];
  const colors = ["#6c5ce7", "#258ee7", "#c87a24", "#268361", "#c94460"];
  return {
    data: {
      version: 1,
      updatedAt: new Date().toISOString(),
      semesters: [
        {
          id: semesterId,
          name: input.semester,
          schoolYear: input.schoolYear,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      ],
      subjects: names.map((name, i) => ({
        id: crypto.randomUUID(),
        name,
        color: colors[i],
        coefficient: 1,
        gradeTypes: [
          { id: crypto.randomUUID(), name: "Scritto", weight: 1 },
          { id: crypto.randomUUID(), name: "Orale", weight: 1 },
        ],
      })),
      grades: [],
      agenda: [],
      absences: [],
    },
    preferences: {
      studentName: input.name,
      school: input.school,
      theme: "system",
      absenceThresholdHours: 24,
      currentSemesterId: semesterId,
      gradeGoal: 5,
      reduceMotion: false,
    },
  };
}
