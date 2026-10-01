import type { Grade, Semester } from "@/types/domain";

// Consultation only: never stored in Preferences or used as a write destination.
export type GradeScope =
  | { kind: "period"; semesterId: string }
  | { kind: "year"; schoolYear: string }
  | { kind: "all" };

export function initialGradeScope(semesters: Semester[], currentSemesterId: string): GradeScope {
  const current = semesters.find((period) => period.id === currentSemesterId) ?? semesters[0];
  return current ? { kind: "year", schoolYear: current.schoolYear } : { kind: "all" };
}

export function resolveGradeScope(scope: GradeScope, semesters: Semester[], currentSemesterId: string): GradeScope {
  if (scope.kind === "all" || semesters.some((period) =>
    scope.kind === "period" ? period.id === scope.semesterId : period.schoolYear === scope.schoolYear,
  )) return scope;
  // Import/removal can replace IDs while this workspace is mounted.
  return initialGradeScope(semesters, currentSemesterId);
}

export function scopePeriods(semesters: Semester[], scope: GradeScope): Semester[] {
  return semesters.filter((period) => scope.kind === "all" || (scope.kind === "period"
    ? period.id === scope.semesterId : period.schoolYear === scope.schoolYear));
}

export function scopeGrades(grades: Grade[], semesters: Semester[], scope: GradeScope): Grade[] {
  if (scope.kind === "all") return grades;
  const ids = new Set(scopePeriods(semesters, scope).map((period) => period.id));
  // Dates may be outside the period: membership is defined by semesterId.
  return grades.filter((grade) => ids.has(grade.semesterId));
}
