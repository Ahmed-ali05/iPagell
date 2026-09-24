export type InstallExperience =
  | "prompt"
  | "ios-safari"
  | "android-chrome"
  | "android-samsung"
  | "android-edge"
  | "android-firefox"
  | "none";

export const INSTALL_DISMISS_KEY = "ipagell-install-dismissed-v1";
export const INSTALL_COMPLETE_KEY = "ipagell-install-complete-v1";
export const INSTALL_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
export const INSTALL_VALUE_DELAY_MS = 20_000;

export function isStandalone(match: (query: string) => boolean, appleStandalone = false) {
  return appleStandalone || ["standalone", "minimal-ui", "fullscreen", "window-controls-overlay"]
    .some((mode) => match(`(display-mode: ${mode})`));
}

// User agent is only used for browser-specific manual instructions. The native
// event and display mode remain the source of truth for installability/state.
export function installExperience(
  userAgent: string,
  hasPrompt: boolean,
  alreadyInstalled: boolean,
  ipadDesktopMode = false,
): InstallExperience {
  if (alreadyInstalled) return "none";
  if (hasPrompt) return "prompt";
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || ipadDesktopMode;
  if (ios) {
    return /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|Instagram|FBAN|FBAV/i.test(userAgent)
      ? "ios-safari"
      : "none";
  }
  if (!/Android/i.test(userAgent)) return "none";
  if (/SamsungBrowser/i.test(userAgent)) return "android-samsung";
  if (/Firefox|Fenix/i.test(userAgent)) return "android-firefox";
  if (/EdgA/i.test(userAgent)) return "android-edge";
  if (/Chrome|Chromium/i.test(userAgent) && !/EdgA|OPR|Opera|UCBrowser|Vivaldi/i.test(userAgent))
    return "android-chrome";
  return "none";
}

export function isDismissed(dismissedAt: string | null, now: number) {
  if (!dismissedAt) return false;
  const time = Number(dismissedAt);
  return Number.isFinite(time) && time > 0 && now - time < INSTALL_COOLDOWN_MS;
}

export function shouldShowHomeOffer(
  experience: InstallExperience,
  hasRealContent: boolean,
  elapsedMs: number,
  dismissedAt: string | null,
  now: number,
) {
  return experience !== "none" && hasRealContent && elapsedMs >= INSTALL_VALUE_DELAY_MS && !isDismissed(dismissedAt, now);
}
