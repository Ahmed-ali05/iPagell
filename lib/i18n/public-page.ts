import type { Metadata } from "next";
import { locales, type Locale } from "./locale";
import { getServerMessages } from "./server";
import { publicAveragePaths, publicLandingPaths } from "./public-routes";

export { publicLandingPaths, publicAveragePaths } from "./public-routes";
const ogLocales: Record<Locale, string> = { it: "it_CH", de: "de_CH", fr: "fr_CH", en: "en_GB" };

export async function publicLandingMetadata(locale: Locale, indexable = true): Promise<Metadata> {
  const messages = await getServerMessages(locale);
  const title = messages["landing.title"];
  const socialTitle = `${title} | iPagell`;
  const description = messages["landing.lead"];
  const socialImage = `/og${locale === "it" ? "" : `-${locale}`}.png`;
  return {
    title,
    description,
    manifest: locale === "it" ? "/manifest.webmanifest" : `/manifest-${locale}.webmanifest`,
    alternates: {
      canonical: publicLandingPaths[locale],
      languages: {
        ...Object.fromEntries(locales.map((supported) => [supported, `https://ipagell.website${publicLandingPaths[supported]}`])),
        "x-default": "https://ipagell.website/",
      },
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
        alt: `${messages["landing.title"]} ${messages["landing.lead"]}`,
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
      languages: {
        ...Object.fromEntries(locales.map((supported) => [supported, `https://ipagell.website${publicAveragePaths[supported]}`])),
        "x-default": `https://ipagell.website${publicAveragePaths.it}`,
      },
    },
    openGraph: {
      type: "website", locale: ogLocales[locale], siteName: "iPagell",
      title: socialTitle, description, url,
      images: [{ url: socialImage, width: 1200, height: 630, type: "image/png", alt: socialTitle }],
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
