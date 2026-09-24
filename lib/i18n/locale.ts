export const locales = ["it", "de", "fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "it";
export const localeStorageKey = "ipagell-interface-locale-v1";

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const language = value.trim().replaceAll("_", "-").split("-")[0].toLowerCase();
  return locales.find((locale) => locale === language) ?? null;
}

export function initialLocale(saved: string | null | undefined, preferred: readonly string[]): Locale {
  return normalizeLocale(saved) ?? preferred.map(normalizeLocale).find((locale): locale is Locale => !!locale) ?? defaultLocale;
}

export function saveLocale(storage: Pick<Storage, "setItem">, locale: Locale): void {
  storage.setItem(localeStorageKey, locale);
}

export const intlLocales: Record<Locale, string> = {
  it: "it-CH", de: "de-CH", fr: "fr-CH", en: "en-GB",
};
