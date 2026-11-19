/** Domain description for a grading scheme. Locale and country are separate concerns. */
export type GradingSystem = NumericGradingSystem | OrderedGradingSystem;

export interface NumericGradingSystem {
  id: string;
  kind: "numeric";
  values:
    | { kind: "range"; minimum: number; maximum: number; step?: number }
    | { kind: "set"; values: readonly number[] };
  order: "higher-is-better" | "lower-is-better";
  passingValue?: number;
  formatting: {
    maximumFractionDigits: number | null;
    displayFractionDigits: number;
    simulatorResultStep?: number;
  };
  average: "weighted-arithmetic" | "none";
  /** Written forms the parser accepts besides a plain number. Absent means plain numbers only. */
  notation?: {
    /** "4-5" counts as 4.5 when the two integers are adjacent. */
    adjacentHalf?: boolean;
    /** "6/7" counts as 6.5 when the two integers are adjacent. */
    slashHalf?: boolean;
    /** "6½" counts as 6.5. */
    halfSign?: boolean;
    /** "6+" and "6-" move an integer up or down by this amount. */
    plusMinus?: number;
    /** "85%" counts as 85. */
    percentSign?: boolean;
  };
}

export interface OrderedGradingSystem {
  id: string;
  kind: "ordered";
  values: { kind: "ordered"; values: readonly string[] };
  order: "first-is-best" | "last-is-best";
  passingValue?: string;
  formatting: { kind: "label" };
  average: "none";
}
