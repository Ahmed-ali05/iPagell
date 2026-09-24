import type { Locale } from "./locale";
import type { Messages } from "./index";

const loaders: Record<Locale, () => Promise<Messages>> = {
  it: async () => (await import("./messages/it.json")).default,
  de: async () => (await import("./messages/de.json")).default,
  fr: async () => (await import("./messages/fr.json")).default,
  en: async () => (await import("./messages/en.json")).default,
};

export function getServerMessages(locale: Locale): Promise<Messages> {
  return loaders[locale]();
}
