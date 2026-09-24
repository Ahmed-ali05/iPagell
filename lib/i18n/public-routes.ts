import type { Locale } from "./locale";

export const publicLandingPaths: Record<Locale, string> = {
  it: "/", de: "/de", fr: "/fr", en: "/en",
};

export const publicAveragePaths: Record<Locale, string> = {
  it: "/calcolo-media-voti",
  de: "/de/notendurchschnitt",
  fr: "/fr/calcul-moyenne-notes",
  en: "/en/grade-average-calculator",
};
