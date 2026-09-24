"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n/locale";

const appParameters = new Set(["view", "action", "source"]);

export function LegacyEntryRedirect({ locale }: { locale?: Locale }) {
  useEffect(() => {
    const current = new URL(window.location.href);
    const hasAppQuery = [...current.searchParams.keys()].some((key) =>
      appParameters.has(key),
    );
    if (!hasAppQuery && !current.hash.includes("join=")) return;
    const search = new URLSearchParams(current.search);
    if (locale) search.set("uiLocale", locale);
    window.location.replace(`/app${search.size ? `?${search}` : ""}${current.hash}`);
  }, [locale]);

  return null;
}
