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
  notation: { adjacentHalf: true },
} as const satisfies NumericGradingSystem;

/**
 * Scales offered by the public calculator. The diary still uses only
 * `CURRENT_GRADING_SYSTEM`; these presets are not stored anywhere.
 * IDs describe the scale; the country shown in the interface is only a hint.
 */
export const CALCULATOR_GRADING_SYSTEMS = [
  CURRENT_GRADING_SYSTEM,
  {
    id: "numeric-1-10",
    kind: "numeric",
    values: { kind: "range", minimum: 1, maximum: 10 },
    order: "higher-is-better",
    passingValue: 6,
    formatting: { maximumFractionDigits: null, displayFractionDigits: 2 },
    average: "weighted-arithmetic",
    notation: { adjacentHalf: true, slashHalf: true, halfSign: true, plusMinus: 0.25 },
  },
  {
    id: "numeric-0-20",
    kind: "numeric",
    values: { kind: "range", minimum: 0, maximum: 20 },
    order: "higher-is-better",
    passingValue: 10,
    formatting: { maximumFractionDigits: null, displayFractionDigits: 2 },
    average: "weighted-arithmetic",
  },
  {
    id: "numeric-1-6-lower-better",
    kind: "numeric",
    values: { kind: "range", minimum: 1, maximum: 6 },
    order: "lower-is-better",
    passingValue: 4,
    formatting: { maximumFractionDigits: null, displayFractionDigits: 1 },
    average: "weighted-arithmetic",
  },
  {
    id: "percent-0-100",
    kind: "numeric",
    values: { kind: "range", minimum: 0, maximum: 100 },
    order: "higher-is-better",
    formatting: { maximumFractionDigits: null, displayFractionDigits: 1 },
    average: "weighted-arithmetic",
    notation: { percentSign: true },
  },
] as const satisfies readonly NumericGradingSystem[];

export type CalculatorGradingSystem = (typeof CALCULATOR_GRADING_SYSTEMS)[number];
export type CalculatorGradingSystemId = CalculatorGradingSystem["id"];

export function calculatorGradingSystem(id: unknown): CalculatorGradingSystem | undefined {
  return CALCULATOR_GRADING_SYSTEMS.find((system) => system.id === id);
}

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

/** True when the text is a plain decimal number, without any notation. */
export function isPlainGradeText(input: string) {
  return /^\d+(?:[.,]\d+)?$/.test(input.trim());
}

/** Reads the written forms enabled by the scale; NaN rejects a recognised but disallowed form. */
function notationValue(text: string, notation: NumericGradingSystem["notation"] = {}): number | null {
  const pair = /^(\d{1,2})\s*([-–/])\s*(\d{1,2})$/.exec(text);
  if (pair) {
    const allowed = pair[2] === "/" ? notation.slashHalf : notation.adjacentHalf;
    const [low, high] = [Number(pair[1]), Number(pair[3])];
    return allowed && high === low + 1 ? (low + high) / 2 : Number.NaN;
  }
  const shifted = /^(\d{1,2})\s*([+\-–−])$/.exec(text);
  if (shifted) {
    if (notation.plusMinus === undefined) return Number.NaN;
    return Number(shifted[1]) + (shifted[2] === "+" ? notation.plusMinus : -notation.plusMinus);
  }
  const half = /^(\d{1,2})\s*½$/.exec(text);
  if (half) return notation.halfSign ? Number(half[1]) + 0.5 : Number.NaN;
  const percent = /^(\d+(?:\.\d+)?)\s*%$/.exec(text);
  if (percent) return notation.percentSign ? Number(percent[1]) : Number.NaN;
  return null;
}

export function parseNumericGrade(
  input: string,
  system: NumericGradingSystem = CURRENT_GRADING_SYSTEM,
): number {
  const text = input.trim().replace(",", ".");
  const value = notationValue(text, system.notation) ?? Number(text);
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
