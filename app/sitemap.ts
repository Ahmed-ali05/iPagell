import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/locale";
import { publicAveragePaths, publicDiaryPaths, publicLanguageAlternates, publicLandingPaths, publicNotesPaths } from "@/lib/i18n/public-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return [publicLandingPaths, publicDiaryPaths, publicNotesPaths, publicAveragePaths].flatMap(paths => {
    const languages = publicLanguageAlternates(paths);
    return locales.map(locale => ({ url: `https://ipagell.website${paths[locale]}`, alternates: { languages } }));
  });
}
