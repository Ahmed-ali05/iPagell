import type { Metadata } from "next";
import { intlLocales, locales, type Locale } from "./locale";
import { getServerMessages } from "./server";
import { translate } from "./index";

const publicPaths: Record<Locale, string> = { it: "/", de: "/de", fr: "/fr", en: "/en" };
const ogLocales: Record<Locale, string> = { it: "it_CH", de: "de_CH", fr: "fr_CH", en: "en_GB" };

export async function publicLandingMetadata(locale: Locale, indexable = true): Promise<Metadata> {
  const messages = await getServerMessages(locale);
  const title = messages["landing.title"];
  const socialTitle = `${title} | iPagell`;
  const description = messages["landing.lead"];
  return {
    title,
    description,
    manifest: locale === "it" ? "/manifest.webmanifest" : `/manifest-${locale}.webmanifest`,
    alternates: {
      canonical: publicPaths[locale],
      languages: {
        ...Object.fromEntries(locales.map((supported) => [supported, `https://ipagell.website${publicPaths[supported]}`])),
        "x-default": "https://ipagell.website/",
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocales[locale],
      siteName: "iPagell",
      title: socialTitle,
      description,
      url: `https://ipagell.website${publicPaths[locale]}`,
      images: [{
        url: "/og.png", width: 1733, height: 907, type: "image/png",
        alt: `${messages["landing.title"]} ${messages["landing.lead"]}`,
      }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: ["/og.png"] },
    robots: indexable ? {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    } : { index: false, follow: false },
  };
}

export async function publicLandingStructuredData(locale: Locale) {
  const messages = await getServerMessages(locale);
  const t = (key: keyof typeof messages) => translate(messages, key);
  const questions = [1, 2, 3, 4].map((index) => ({
    question: t(`landing.faq${index}Q` as keyof typeof messages),
    answer: t(`landing.faq${index}A` as keyof typeof messages),
  }));
  const features = [1, 2, 3, 4].map((index) => t(`landing.feature${index}Title` as keyof typeof messages));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "iPagell",
        url: `https://ipagell.website${publicPaths[locale]}`,
        applicationCategory: "EducationalApplication",
        applicationSubCategory: t("landing.eyebrow"),
        operatingSystem: "Web",
        inLanguage: intlLocales[locale],
        description: t("landing.lead"),
        featureList: features,
      },
      {
        "@type": "FAQPage",
        inLanguage: intlLocales[locale],
        mainEntity: questions.map((item) => ({
          "@type": "Question", name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}

export function serializeStructuredData(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
