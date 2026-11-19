import type { Metadata } from "next";
import type { Locale } from "./locale";
import { getServerMessages } from "./server";
import { publicAveragePaths, publicDiaryPaths, publicNotesPaths, publicLandingPaths, publicLanguageAlternates } from "./public-routes";

export { publicLandingPaths, publicAveragePaths } from "./public-routes";
const ogLocales: Record<Locale, string> = { it: "it_CH", de: "de_CH", fr: "fr_CH", en: "en_CH" };

export async function publicLandingMetadata(locale: Locale, indexable = true): Promise<Metadata> {
  const messages = await getServerMessages(locale);
  const title = messages["landing.metaTitle"];
  const socialTitle = `${title} | iPagell`;
  const description = messages["landing.metaDescription"];
  const socialImage = `/og${locale === "it" ? "" : `-${locale}`}.png`;
  return {
    title,
    description,
    manifest: locale === "it" ? "/manifest.webmanifest" : `/manifest-${locale}.webmanifest`,
    alternates: {
      canonical: publicLandingPaths[locale],
      languages: publicLanguageAlternates(publicLandingPaths),
    },
    openGraph: {
      type: "website",
      locale: ogLocales[locale],
      siteName: "iPagell",
      title: socialTitle,
      description,
      url: `https://ipagell.website${publicLandingPaths[locale]}`,
      images: [{
        url: socialImage, width: 1200, height: 630, type: "image/png",
        alt: messages["public.socialImageAlt"],
      }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [socialImage] },
    robots: indexable ? {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    } : { index: false, follow: false },
  };
}

export async function publicAverageMetadata(locale: Locale, indexable = true): Promise<Metadata> {
  const messages = await getServerMessages(locale);
  const title = messages["average.title"];
  const description = messages["average.description"];
  const url = `https://ipagell.website${publicAveragePaths[locale]}`;
  const socialTitle = `${title} | iPagell`;
  const socialImage = `/og${locale === "it" ? "" : `-${locale}`}.png`;
  return {
    title, description,
    manifest: locale === "it" ? "/manifest.webmanifest" : `/manifest-${locale}.webmanifest`,
    alternates: {
      canonical: publicAveragePaths[locale],
      languages: publicLanguageAlternates(publicAveragePaths),
    },
    openGraph: {
      type: "website", locale: ogLocales[locale], siteName: "iPagell",
      title: socialTitle, description, url,
      images: [{ url: socialImage, width: 1200, height: 630, type: "image/png", alt: messages["public.socialImageAlt"] }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [socialImage] },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export function publicWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "iPagell",
    url: "https://ipagell.website/",
  };
}

export function serializeStructuredData(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export async function publicSpaceMetadata(locale: Locale, section: "notes" | "diary", indexable = true): Promise<Metadata> {
  const messages = await getServerMessages(locale);
  const paths = section === "notes" ? publicNotesPaths : publicDiaryPaths;
  const title = messages[section === "notes" ? "public.notesMetaTitle" : "public.diaryMetaTitle"];
  const description = messages[section === "notes" ? "public.notesMetaDescription" : "public.diaryMetaDescription"];
  const metadata = await publicAverageMetadata(locale, indexable);
  const socialTitle = `${title} | iPagell`;
  return {
    ...metadata, title, description,
    alternates: { canonical: paths[locale], languages: publicLanguageAlternates(paths) },
    openGraph: { ...metadata.openGraph, title: socialTitle, description, url: `https://ipagell.website${paths[locale]}`, images: [{ url: `/og${locale === "it" ? "" : `-${locale}`}.png`, width: 1200, height: 630, alt: messages["public.socialImageAlt"] }] },
    twitter: { ...metadata.twitter, title: socialTitle, description },
  };
}
