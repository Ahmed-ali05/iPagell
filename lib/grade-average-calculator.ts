import { weightedArithmeticMean } from "@/lib/calculations";
import {
  CALCULATOR_GRADING_SYSTEMS,
  CURRENT_GRADING_SYSTEM,
  calculatorGradingSystem,
  isValidGradeValue,
  parseNumericGrade,
  type CalculatorGradingSystemId,
} from "@/lib/grading";
import type { NumericGradingSystem } from "@/types/grading";

export type CalculatorGrade = { id: string; value: number; weight: number };
export type CalculatorRow = CalculatorGrade & { entered: string; enteredWeight: string };
export type CalculatorLists = Partial<Record<CalculatorGradingSystemId, CalculatorRow[]>>;

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

/** Restore only validated inputs; never trust cached values or identifiers. */
export function restoreCalculatorGrades(input: unknown, system: NumericGradingSystem): CalculatorRow[] {
  if (!Array.isArray(input) || input.length > 1000) return [];
  return input.flatMap((row, index) => {
    if (!row || typeof row.entered !== "string" || typeof row.enteredWeight !== "string" || row.entered.length > 80 || row.enteredWeight.length > 80) return [];
    const parsed = parseCalculatorEntry(row.entered, row.enteredWeight, system);
    return "error" in parsed ? [] : [{ id: `restored-${index}`, ...parsed, entered: row.entered, enteredWeight: row.enteredWeight }];
  });
}

export type CalculatorState = {
  scale: CalculatorGradingSystemId;
  lists: CalculatorLists;
  gradeInput: string;
  weightInput: string;
};

/**
 * Restores the tab's calculator state. Each scale keeps its own list, so
 * switching scale never converts or mixes grades. The v1 shape (a single list)
 * belonged to the 1–6 scale.
 */
export function restoreCalculatorState(input: unknown): CalculatorState {
  const saved = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const text = (value: unknown, fallback: string) => (typeof value === "string" ? value.slice(0, 80) : fallback);
  const lists: CalculatorLists = {};
  if (saved.lists && typeof saved.lists === "object") {
    for (const system of CALCULATOR_GRADING_SYSTEMS) {
      const rows = restoreCalculatorGrades((saved.lists as Record<string, unknown>)[system.id], system);
      if (rows.length) lists[system.id] = rows;
    }
  } else if (Array.isArray(saved.grades)) {
    const rows = restoreCalculatorGrades(saved.grades, CURRENT_GRADING_SYSTEM);
    if (rows.length) lists[CURRENT_GRADING_SYSTEM.id] = rows;
  }
  return {
    scale: calculatorGradingSystem(saved.scale)?.id ?? CURRENT_GRADING_SYSTEM.id,
    lists,
    gradeInput: text(saved.gradeInput, ""),
    weightInput: text(saved.weightInput, "1"),
  };
}
