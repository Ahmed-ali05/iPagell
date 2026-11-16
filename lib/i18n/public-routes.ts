import { locales, type Locale } from "./locale";

export const publicLandingPaths: Record<Locale, string> = {
  it: "/", de: "/de", fr: "/fr", en: "/en",
};

export const publicAveragePaths: Record<Locale, string> = {
  it: "/calcolo-media-voti",
  de: "/de/notendurchschnitt",
  fr: "/fr/calcul-moyenne-notes",
  en: "/en/grade-average-calculator",
};

export const publicNotesPaths: Record<Locale, string> = {
  it: "/appunti-online",
  de: "/de/online-notizen",
  fr: "/fr/notes-en-ligne",
  en: "/en/online-notes",
};

export const publicDiaryPaths: Record<Locale, string> = {
  it: "/scopri-ipagell", de: "/de/entdecken", fr: "/fr/decouvrir", en: "/en/discover",
};

/** Shared by HTML metadata and sitemap; generic language fallbacks retain the same URLs. */
export function publicLanguageAlternates(paths: Record<Locale, string>): Record<string, string> {
  return {
    ...Object.fromEntries(locales.flatMap(locale => {
      const url = `https://ipagell.website${paths[locale]}`;
      return [[locale, url], [`${locale}-CH`, url]];
    })),
    "x-default": `https://ipagell.website${paths.it}`,
  };
}
