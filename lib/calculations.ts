import type { Grade, Subject } from "@/types/domain";

export function gradeWeight(grade: Grade, subject?: Subject) {
  const typeWeight = subject?.gradeTypes.find((type) => type.id === grade.typeId)?.weight ?? 1;
  return Math.max(.1, grade.weight) * Math.max(.1, typeWeight);
}

export function subjectAverage(subject: Subject, grades: Grade[]) {
  const relevant = grades.filter((grade) => grade.subjectId === subject.id);
  if (!relevant.length) return null;
  const totalWeight = relevant.reduce((sum, grade) => sum + gradeWeight(grade, subject), 0);
  return relevant.reduce((sum, grade) => sum + grade.value * gradeWeight(grade, subject), 0) / totalWeight;
}

export function generalAverage(subjects: Subject[], grades: Grade[]) {
  const values = subjects.map((subject) => ({ value: subjectAverage(subject, grades), coefficient: subject.coefficient })).filter((entry): entry is { value: number; coefficient: number } => entry.value !== null);
  if (!values.length) return null;
  const total = values.reduce((sum, item) => sum + item.coefficient, 0);
  return values.reduce((sum, item) => sum + item.value * item.coefficient, 0) / total;
}

export function neededGrade(subject: Subject, grades: Grade[], target: number, nextWeight = 1) {
  const relevant = grades.filter((grade) => grade.subjectId === subject.id);
  const accumulatedWeight = relevant.reduce((sum, grade) => sum + gradeWeight(grade, subject), 0);
  const accumulatedPoints = relevant.reduce((sum, grade) => sum + grade.value * gradeWeight(grade, subject), 0);
  const effectiveNextWeight = Math.max(.1, nextWeight);
  return (target * (accumulatedWeight + effectiveNextWeight) - accumulatedPoints) / effectiveNextWeight;
}

export const formatGrade = (value: number | null, digits = 1) => value === null ? "—" : value.toFixed(digits);
