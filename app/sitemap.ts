import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/locale";

const localePaths = { it: "/", de: "/de", fr: "/fr", en: "/en" } as const;
const languages = Object.fromEntries(
  locales.map((locale) => [locale, `https://ipagell.website${localePaths[locale]}`]),
);
languages["x-default"] = "https://ipagell.website/";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `https://ipagell.website${localePaths[locale]}`,
    alternates: { languages },
  }));
}
