import type { Locale } from "./i18n/locale";

/**
 * Word typed to confirm deleting an account without a password (Google).
 * Those accounts have only a random technical handle, which nobody knows by
 * heart; the Google confirmation is the security check, this word only
 * prevents an accidental deletion. The server accepts the word of any
 * interface language, because it does not know which one the person reads.
 */
export const DELETE_WORDS: Record<Locale, string> = {
  it: "ELIMINA",
  de: "LÖSCHEN",
  fr: "SUPPRIMER",
  en: "DELETE",
};

/** Case and surrounding spaces do not matter (mobile keyboards capitalise). */
export function isDeleteWord(value: string) {
  const typed = value.trim().toUpperCase();
  return Object.values(DELETE_WORDS).includes(typed);
}
