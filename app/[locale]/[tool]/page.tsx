import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GradeAverageCalculator } from "@/components/grade-average-calculator";
import { publicAverageMetadata } from "@/lib/i18n/public-page";
import { publicAveragePaths } from "@/lib/i18n/public-routes";
import type { Locale } from "@/lib/i18n/locale";

type Props = { params: Promise<{ locale: string; tool: string }> };
const localized = (["de", "fr", "en"] as const);

export function generateStaticParams() {
  return localized.map((locale) => ({ locale, tool: publicAveragePaths[locale].split("/")[2] }));
}

async function routeLocale(params: Props["params"]): Promise<Locale> {
  const { locale, tool } = await params;
  if (!localized.some((candidate) => candidate === locale && publicAveragePaths[candidate].split("/")[2] === tool)) notFound();
  return locale as Locale;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await routeLocale(params);
  const hostname = (await headers()).get("host")?.split(":")[0];
  return publicAverageMetadata(locale, hostname === "ipagell.website");
}

export default async function LocalizedAverage({ params }: Props) {
  await routeLocale(params);
  return <GradeAverageCalculator />;
}
