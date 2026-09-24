"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Globe2 } from "lucide-react";
import { defaultLocale, defaultMessages, initialLocale, loadMessages, localeStorageKey, saveLocale, translate, type Locale, type MessageKey, type Messages } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale: serverLocale = defaultLocale,
  initialMessages: serverMessages = defaultMessages,
  explicitLocale = false,
  fixedLocale = false,
}: {
  children: ReactNode;
  initialLocale?: Locale;
  initialMessages?: Messages;
  explicitLocale?: boolean;
  fixedLocale?: boolean;
}) {
  const [locale, setCurrentLocale] = useState<Locale>(serverLocale);
  const [messages, setMessages] = useState<Messages>(serverMessages);
  const requestId = useRef(0);
  function setLocale(next: Locale) {
    const currentRequest = ++requestId.current;
    try { saveLocale(localStorage, next); } catch { /* Private browsing can reject storage. */ }
    document.documentElement.lang = next;
    void loadMessages(next).then((catalog) => {
      if (currentRequest !== requestId.current) return;
      setMessages(catalog);
      setCurrentLocale(next);
    }).catch(() => {
      if (currentRequest !== requestId.current) return;
      document.documentElement.lang = defaultLocale;
      setMessages(defaultMessages);
      setCurrentLocale(defaultLocale);
    });
  }
  useEffect(() => {
    if (explicitLocale || fixedLocale) {
      if (explicitLocale) {
        try { saveLocale(localStorage, serverLocale); } catch { /* Keep the URL choice for this session. */ }
      }
      document.documentElement.lang = serverLocale;
      const url = new URL(window.location.href);
      if (url.pathname === "/app" && url.searchParams.has("uiLocale")) {
        url.searchParams.delete("uiLocale");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
      return;
    }
    let saved: string | null = null;
    try { saved = localStorage.getItem(localeStorageKey); } catch { /* Use browser preference. */ }
    const next = initialLocale(saved, navigator.languages?.length ? navigator.languages : [navigator.language]);
    // Initial locale detection is UI only; it does not touch diary state.
    if (next !== locale) queueMicrotask(() => setLocale(next));
  }, [explicitLocale, fixedLocale, locale, serverLocale]);
  return <I18nContext.Provider value={{ locale, t: (key, values) => translate(messages, key, values), setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("I18nProvider missing");
  return context;
}

export function LanguageSelect({ className, publicRoute = false }: { className?: string; publicRoute?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  function chooseLocale(next: Locale) {
    if (!publicRoute) {
      setLocale(next);
      return;
    }
    const current = new URL(window.location.href);
    const currentCode = current.pathname.split("/")[1];
    const hasLocalePath = currentCode === "it" || currentCode === "de" || currentCode === "fr" || currentCode === "en";
    current.pathname = hasLocalePath
      ? (next === "it" ? "/it" : `/${next}`)
      : (next === "it" ? "/" : `/${next}`);
    window.location.assign(current.href);
  }
  return <label className={className} aria-label={t("locale.label")}>
    <Globe2 size={16} aria-hidden="true" />
    <span className="sr-only">{t("locale.label")}</span>
    <select aria-label={t("locale.label")} value={locale} onChange={(event) => chooseLocale(event.target.value as Locale)}>
      <option value="it">Italiano</option><option value="de">Deutsch</option><option value="fr">Français</option><option value="en">English</option>
    </select>
  </label>;
}
