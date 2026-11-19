import it from "./messages/it.json";
import { intlLocales, type Locale } from "./locale";
export { defaultLocale, initialLocale, intlLocales, localeStorageKey, locales, normalizeLocale, saveLocale } from "./locale";
export type { Locale } from "./locale";

export type MessageKey = keyof typeof it;
export type Messages = Record<MessageKey, string>;
export const defaultMessages: Messages = it;
const loaders: Record<Exclude<Locale, "it">, () => Promise<{ default: Messages }>> = {
  de: () => import("./messages/de.json"),
  fr: () => import("./messages/fr.json"),
  en: () => import("./messages/en.json"),
};
const cache = new Map<Locale, Messages>([["it", defaultMessages]]);

export async function loadMessages(locale: Locale): Promise<Messages> {
  if (cache.has(locale)) return cache.get(locale)!;
  const messages = (await loaders[locale as Exclude<Locale, "it">]()).default;
  cache.set(locale, messages);
  return messages;
}

export function translate(messages: Partial<Messages>, key: MessageKey, values?: Record<string, string | number>): string {
  const source = messages[key] || defaultMessages[key];
  return source.replace(/\{(\w+)\}/g, (_match, name: string) => String(values?.[name] ?? `{${name}}`));
}

export function formatDate(locale: Locale, value: string | Date, options: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(intlLocales[locale], options).format(date);
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocales[locale], options).format(value);
}

export function selectPlural<T>(locale: Locale, count: number, one: T, other: T): T {
  return new Intl.PluralRules(intlLocales[locale]).select(count) === "one" ? one : other;
}

/** Time-of-day greeting: morning 05–11, afternoon 12–17, evening 18–04 (device local time). */
export function greetingKey(date: Date): MessageKey {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "workspace.greetingMorning";
  if (hour >= 12 && hour < 18) return "workspace.greetingAfternoon";
  return "workspace.greetingEvening";
}
