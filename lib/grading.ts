import type { NumericGradingSystem } from "@/types/grading";

/** Current product behavior. The ID describes the scale, not its geography. */
export const CURRENT_GRADING_SYSTEM = {
  id: "numeric-1-6",
  kind: "numeric",
  values: { kind: "range", minimum: 1, maximum: 6 },
  order: "higher-is-better",
  passingValue: 4,
  formatting: {
    maximumFractionDigits: null,
    displayFractionDigits: 1,
    simulatorResultStep: 0.5,
  },
  average: "weighted-arithmetic",
} as const satisfies NumericGradingSystem;

/** Integer labels shown along the current numeric chart axes. */
export const CURRENT_GRADING_TICKS = Array.from(
  { length: CURRENT_GRADING_SYSTEM.values.maximum - CURRENT_GRADING_SYSTEM.values.minimum + 1 },
  (_, index) => CURRENT_GRADING_SYSTEM.values.minimum + index,
);

export function gradeProgressPercent(value: number | null) {
  if (value === null) return 0;
  const { minimum, maximum } = CURRENT_GRADING_SYSTEM.values;
  return ((value - minimum) / (maximum - minimum)) * 100;
}

export function isValidGradeValue(
  value: unknown,
  system: NumericGradingSystem = CURRENT_GRADING_SYSTEM,
): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (system.values.kind === "set") return system.values.values.includes(value);
  if (value < system.values.minimum || value > system.values.maximum) return false;
  if (system.values.step === undefined) return true;
  const steps = (value - system.values.minimum) / system.values.step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

/** Positive means `left` is better than `right`; zero means they are equal. */
export function compareGradeValues(
  left: number,
  right: number,
  system: NumericGradingSystem = CURRENT_GRADING_SYSTEM,
) {
  return system.order === "higher-is-better" ? left - right : right - left;
}

export function isPassingGrade(
  value: number,
  system: NumericGradingSystem = CURRENT_GRADING_SYSTEM,
) {
  if (system.passingValue === undefined) return null;
  return system.order === "higher-is-better"
    ? value >= system.passingValue
    : value <= system.passingValue;
}

export function parseNumericGrade(
  input: string,
  system: NumericGradingSystem = CURRENT_GRADING_SYSTEM,
): number {
  const text = input.trim().replace(",", ".");
  const range = /^(\d)\s*[-–]\s*(\d)$/.exec(text);
  const value =
    range && Number(range[2]) === Number(range[1]) + 1
      ? (Number(range[1]) + Number(range[2])) / 2
      : Number(text);
  if (!text || !isValidGradeValue(value, system)) {
    const validValues =
      system.values.kind === "range"
        ? `tra ${system.values.minimum} e ${system.values.maximum}`
        : system.values.values.join(", ");
    throw new Error(
      system.values.kind === "range"
        ? `Inserisci un valore ${validValues}.`
        : `Inserisci uno dei valori validi: ${validValues}.`,
    );
  }
  return value;
}

export function roundRequiredGrade(
  value: number,
  system: NumericGradingSystem = CURRENT_GRADING_SYSTEM,
) {
  const step = system.formatting.simulatorResultStep;
  if (step === undefined) return value;
  return Math.ceil((value - 1e-10) / step) * step;
}

export function formatNumericGrade(
  value: number | null,
  digits?: number,
  system: NumericGradingSystem = CURRENT_GRADING_SYSTEM,
) {
  return value === null
    ? "—"
    : value.toFixed(digits ?? system.formatting.displayFractionDigits);
}
