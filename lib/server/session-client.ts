import type { SessionBrowser, SessionSystem } from "@/lib/session-devices";

// Pure and Worker-free, so it is unit tested with real header samples.
// Client hints (sent by Chromium over HTTPS) win over the User-Agent.

const HINT_SYSTEMS: Record<string, SessionSystem> = {
  android: "android",
  ios: "ios",
  macos: "macos",
  windows: "windows",
  "chrome os": "chromeos",
  "chromium os": "chromeos",
  linux: "linux",
};

function systemFromHint(value: string | null): SessionSystem | null {
  if (!value) return null;
  const name = value.trim().replace(/^"|"$/g, "").toLowerCase();
  if (!name || name === "unknown") return null;
  return HINT_SYSTEMS[name] ?? "other";
}

function systemFromAgent(agent: string): SessionSystem {
  // Order matters: iOS agents say "like Mac OS X", Android agents say "Linux".
  if (/\b(iPhone|iPad|iPod)\b/.test(agent)) return "ios";
  if (/\bAndroid\b/.test(agent)) return "android";
  if (/\bCrOS\b/.test(agent)) return "chromeos";
  if (/\bWindows\b/.test(agent)) return "windows";
  if (/\bMacintosh\b|\bMac OS X\b/.test(agent)) return "macos";
  if (/\bLinux\b/.test(agent)) return "linux";
  return "other";
}

function browserFromHint(value: string | null): SessionBrowser | null {
  if (!value) return null;
  const brands = Array.from(value.matchAll(/"([^"]{1,64})"\s*;\s*v=/g), (match) => match[1].toLowerCase());
  // Edge, Opera and Samsung also list "Chromium"; check them first.
  if (brands.includes("microsoft edge")) return "edge";
  if (brands.some((brand) => brand === "opera" || brand === "opera gx")) return "opera";
  if (brands.includes("samsung internet")) return "samsung";
  if (brands.includes("google chrome")) return "chrome";
  // Only "Chromium" or an unlisted brand: let the User-Agent decide.
  return null;
}

function browserFromAgent(agent: string): SessionBrowser {
  // Order matters: most Chromium browsers also contain "Chrome" and "Safari".
  if (/\bEdg(?:e|A|iOS)?\//.test(agent)) return "edge";
  if (/\bOPR\/|\bOPiOS\/|\bOpera\b/.test(agent)) return "opera";
  if (/\bSamsungBrowser\//.test(agent)) return "samsung";
  if (/\bFxiOS\/|\bFirefox\//.test(agent)) return "firefox";
  if (/\bCriOS\/|\bChrome\//.test(agent)) return "chrome";
  if (/\bSafari\//.test(agent) && /\bVersion\//.test(agent)) return "safari";
  // iOS home-screen apps (PWA, in-app views) run WebKit without "Safari/".
  if (/\bAppleWebKit\//.test(agent) && /\b(iPhone|iPad|iPod)\b/.test(agent)) return "safari";
  return "other";
}

/** Returns "browser.system" from closed lists, or null when no header says anything. */
export function clientCode(headers: Headers): string | null {
  const agent = (headers.get("user-agent") ?? "").slice(0, 512);
  const hintSystem = systemFromHint(headers.get("sec-ch-ua-platform"));
  const hintBrowser = browserFromHint(headers.get("sec-ch-ua"));
  if (!agent && !hintSystem && !hintBrowser) return null;
  const system = hintSystem ?? (agent ? systemFromAgent(agent) : "other");
  const browser = hintBrowser ?? (agent ? browserFromAgent(agent) : "other");
  return `${browser}.${system}`;
}
