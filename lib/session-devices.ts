// Closed vocabularies for the "Connected devices" list, shared by server and client.
// Only these codes are ever stored: never an IP, version, model or raw User-Agent.
export const SESSION_BROWSERS = ["safari", "chrome", "firefox", "edge", "samsung", "opera", "other"] as const;
export const SESSION_SYSTEMS = ["ios", "android", "macos", "windows", "chromeos", "linux", "other"] as const;
export type SessionBrowser = (typeof SESSION_BROWSERS)[number];
export type SessionSystem = (typeof SESSION_SYSTEMS)[number];
export type SessionMethod = "password" | "google";

export type SessionSummary = {
  /** 32 hex characters derived from the token hash; never the hash itself. */
  id: string;
  current: boolean;
  method: SessionMethod | null;
  /** "browser.system" from the closed lists, or null when unknown. */
  client: string | null;
  createdAt: number | null;
  lastSeenAt: number | null;
  expiresAt: number;
};

const isBrowser = (value: string): value is SessionBrowser =>
  (SESSION_BROWSERS as readonly string[]).includes(value);
const isSystem = (value: string): value is SessionSystem =>
  (SESSION_SYSTEMS as readonly string[]).includes(value);

/** Parses a stored code; anything outside the lists reads as unknown. */
export function parseClientCode(code: string | null | undefined): { browser: SessionBrowser; system: SessionSystem } | null {
  if (!code) return null;
  const [browser, system, extra] = code.split(".");
  if (extra !== undefined || !browser || !system || !isBrowser(browser) || !isSystem(system)) return null;
  if (browser === "other" && system === "other") return null;
  return { browser, system };
}

export const isMobileSystem = (system: SessionSystem) => system === "ios" || system === "android";
