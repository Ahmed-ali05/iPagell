/** Result of a Google confirmation, as the callback reports it in `?accesso=`. */
export type ReauthOutcome = "ok" | "cancelled" | "mismatch" | "error";

const outcomes: Record<string, ReauthOutcome> = {
  "reauth-ok": "ok",
  "reauth-cancelled": "cancelled",
  "reauth-mismatch": "mismatch",
  "reauth-error": "error",
};

export function parseReauthOutcome(value: string | null): ReauthOutcome | null {
  return value ? outcomes[value] ?? null : null;
}
