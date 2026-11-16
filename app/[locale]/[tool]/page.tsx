import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GradeAverageCalculator } from "@/components/grade-average-calculator";
import { PublicNotes } from "@/components/public-notes";
import { LandingContent } from "@/components/landing-content";
import { publicAverageMetadata, publicSpaceMetadata } from "@/lib/i18n/public-page";
import { publicAveragePaths, publicDiaryPaths, publicNotesPaths } from "@/lib/i18n/public-routes";
import type { Locale } from "@/lib/i18n/locale";

type Props = { params: Promise<{ locale: string; tool: string }> };
const localized = ["de", "fr", "en"] as const;
const sections = { average: publicAveragePaths, notes: publicNotesPaths, diary: publicDiaryPaths };
export function generateStaticParams() {
  return localized.flatMap(locale => Object.values(sections).map(paths => ({ locale, tool: paths[locale].split("/")[2] })));
}
async function resolve(params: Props["params"]) {
  const { locale, tool } = await params;
  if (!localized.some(candidate => candidate === locale)) notFound();
  const supported = locale as Locale;
  const section = (Object.keys(sections) as (keyof typeof sections)[]).find(key => sections[key][supported].split("/")[2] === tool);
  if (!section) notFound();
  return { locale: supported, section };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, section } = await resolve(params);
  const indexable = (await headers()).get("host")?.split(":")[0] === "ipagell.website";
  return section === "average" ? publicAverageMetadata(locale, indexable) : publicSpaceMetadata(locale, section, indexable);
}
export default async function LocalizedTool({ params }: Props) {
  const { locale, section } = await resolve(params);
  return section === "average" ? <GradeAverageCalculator /> : section === "notes" ? <PublicNotes /> : <LandingContent section="diary" localePath={locale} />;
}
