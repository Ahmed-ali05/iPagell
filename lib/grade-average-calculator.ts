import { weightedArithmeticMean } from "@/lib/calculations";
import { isValidGradeValue, parseNumericGrade } from "@/lib/grading";
import type { NumericGradingSystem } from "@/types/grading";

export type CalculatorGrade = { id: string; value: number; weight: number };

export function parsePositiveWeight(input: string): number | null {
  const text = input.trim();
  if (!/^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text)) return null;
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function parseCalculatorEntry(
  gradeInput: string,
  weightInput: string,
  system: NumericGradingSystem,
): { value: number; weight: number } | { error: "grade" | "weight" } {
  if (system.average !== "weighted-arithmetic") return { error: "grade" };
  let value: number;
  try { value = parseNumericGrade(gradeInput, system); }
  catch { return { error: "grade" }; }
  const weight = parsePositiveWeight(weightInput.trim() || "1");
  return weight === null ? { error: "weight" } : { value, weight };
}

export function calculatorAverage(grades: readonly CalculatorGrade[], system: NumericGradingSystem): number | null {
  if (system.average !== "weighted-arithmetic") return null;
  if (grades.some((grade) => !isValidGradeValue(grade.value, system) || !Number.isFinite(grade.weight) || grade.weight <= 0)) return null;
  return weightedArithmeticMean(grades);
}
