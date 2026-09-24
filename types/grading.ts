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
