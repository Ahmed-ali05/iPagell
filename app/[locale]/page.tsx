import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LandingContent } from "@/components/landing-content";
import { locales, type Locale } from "@/lib/i18n/locale";
import { publicLandingMetadata, publicLandingStructuredData, serializeStructuredData } from "@/lib/i18n/public-page";
import { identity } from "@/lib/server/auth";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type PageProps = { params: Promise<{ locale: string }> };

function getLocale(value: string): Locale {
  const locale = locales.find((supported) => supported === value);
  if (!locale) notFound();
  return locale;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: value } = await params;
  const hostname = (await headers()).get("host")?.split(":")[0];
  return publicLandingMetadata(getLocale(value), hostname === "ipagell.website");
}

export default async function LocalizedLanding({ params }: PageProps) {
  const { locale: value } = await params;
  const locale = getLocale(value);
  const requestHeaders = await headers();
  const hostname = requestHeaders.get("host") ?? "ipagell.website";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1") ? "http" : "https";
  const user = await identity(new Request(`${protocol}://${hostname}/`, {
    headers: { cookie: requestHeaders.get("cookie") ?? "" },
  }));
  const structuredData = await publicLandingStructuredData(locale);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }} />
    <LandingContent localePath={locale} authenticated={!!user} />
  </>;
}
