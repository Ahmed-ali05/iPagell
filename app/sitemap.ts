import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/locale";
import { publicAveragePaths, publicLandingPaths } from "@/lib/i18n/public-routes";

const languages = Object.fromEntries(
  locales.map((locale) => [locale, `https://ipagell.website${publicLandingPaths[locale]}`]),
);
languages["x-default"] = "https://ipagell.website/";

export default function sitemap(): MetadataRoute.Sitemap {
  const landing = locales.map((locale) => ({
    url: `https://ipagell.website${publicLandingPaths[locale]}`,
    alternates: { languages },
  }));
  const averageLanguages = Object.fromEntries(
    locales.map((locale) => [locale, `https://ipagell.website${publicAveragePaths[locale]}`]),
  );
  averageLanguages["x-default"] = `https://ipagell.website${publicAveragePaths.it}`;
  return [...landing, ...locales.map((locale) => ({
    url: `https://ipagell.website${publicAveragePaths[locale]}`,
    alternates: { languages: averageLanguages },
  }))];
}
