import type { Grade, Subject } from "@/types/domain";
import { formatNumericGrade } from "@/lib/grading";

/** Arithmetic mean of explicit, positive weights. Empty or zero-weight data has no mean. */
export function weightedArithmeticMean(items: readonly { value: number; weight: number }[]): number | null {
  if (!items.length) return null;
  if (items.some(({ value, weight }) => !Number.isFinite(value) || !Number.isFinite(weight) || weight < 0)) return null;
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;
  const points = items.reduce((sum, item) => sum + item.value * item.weight, 0);
  // Keep the existing calculation for ordinary diary data. Rescaling weights
  // preserves the same mean when an extreme input would overflow or underflow.
  if (Number.isFinite(totalWeight) && Number.isFinite(points) && totalWeight >= Number.MIN_VALUE / Number.EPSILON) {
    return points / totalWeight;
  }
  const largestWeight = items.reduce((largest, item) => Math.max(largest, item.weight), 0);
  const scaledWeight = items.reduce((sum, item) => sum + item.weight / largestWeight, 0);
  const scaledPoints = items.reduce((sum, item) => sum + item.value * (item.weight / largestWeight), 0);
  const result = scaledPoints / scaledWeight;
  return Number.isFinite(result) ? result : null;
}

export function gradeWeight(grade: Grade, subject?: Subject) {
  const typeWeight =
    subject?.gradeTypes.find((type) => type.id === grade.typeId)?.weight ?? 1;
  return Math.max(0.1, grade.weight) * Math.max(0.1, typeWeight);
}

export function subjectAverage(subject: Subject, grades: Grade[]) {
  const relevant = grades.filter((grade) => grade.subjectId === subject.id);
  if (!relevant.length) return null;
  return weightedArithmeticMean(relevant.map((grade) => ({
    value: grade.value, weight: gradeWeight(grade, subject),
  })));
}

export function generalAverage(subjects: Subject[], grades: Grade[]) {
  const values = subjects
    .map((subject) => ({
      value: subjectAverage(subject, grades),
      coefficient: subject.coefficient,
    }))
    .filter(
      (entry): entry is { value: number; coefficient: number } =>
        entry.value !== null,
    );
  if (!values.length) return null;
  return weightedArithmeticMean(values.map((item) => ({ value: item.value, weight: item.coefficient })));
}

export function neededGrade(
  subject: Subject,
  grades: Grade[],
  target: number,
  nextWeight = 1,
) {
  const relevant = grades.filter((grade) => grade.subjectId === subject.id);
  const accumulatedWeight = relevant.reduce(
    (sum, grade) => sum + gradeWeight(grade, subject),
    0,
  );
  const accumulatedPoints = relevant.reduce(
    (sum, grade) => sum + grade.value * gradeWeight(grade, subject),
    0,
  );
  const effectiveNextWeight = Math.max(0.1, nextWeight);
  return (
    (target * (accumulatedWeight + effectiveNextWeight) - accumulatedPoints) /
    effectiveNextWeight
  );
}

export const formatGrade = formatNumericGrade;

// Incremental weighted averages avoid rescanning all previous grades for every
// chart point (quadratic work on a large imported diary).
export function gradeTrend(subjects: Subject[], grades: Grade[]) {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const totals = new Map<string, { points: number; weight: number }>();
  const days = new Map<string, number>();
  let weighted = 0,
    coefficients = 0;
  for (const grade of [...grades].sort((a, b) =>
    a.date.localeCompare(b.date),
  )) {
    const subject = subjectMap.get(grade.subjectId);
    if (!subject) continue;
    const prior = totals.get(subject.id) ?? { points: 0, weight: 0 };
    if (prior.weight)
      weighted -= (prior.points / prior.weight) * subject.coefficient;
    else coefficients += subject.coefficient;
    const weight = gradeWeight(grade, subject);
    prior.points += grade.value * weight;
    prior.weight += weight;
    weighted += (prior.points / prior.weight) * subject.coefficient;
    totals.set(subject.id, prior);
    days.set(grade.date, weighted / coefficients);
  }
  return [...days].map(([date, media]) => ({
    date,
    media: Number(media.toFixed(2)),
  }));
}
