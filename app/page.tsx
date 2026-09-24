import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/landing-content";
import { publicLandingMetadata, publicWebsiteStructuredData, serializeStructuredData } from "@/lib/i18n/public-page";
import { defaultLocale } from "@/lib/i18n/locale";
import { identity } from "@/lib/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const hostname = (await headers()).get("host")?.split(":")[0];
  const canonicalHost = hostname === "ipagell.website";
  const metadata = await publicLandingMetadata(defaultLocale);
  return {
    ...metadata,
    robots: canonicalHost ? metadata.robots : { index: false, follow: false },
  };
}

export default async function Home() {
  const requestHeaders = await headers();
  const hostname = requestHeaders.get("host") ?? "ipagell.website";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1")
        ? "http"
        : "https";
  const user = await identity(
    new Request(`${protocol}://${hostname}/`, {
      headers: { cookie: requestHeaders.get("cookie") ?? "" },
    }),
  );
  if (user) redirect("/app");

  const structuredData = publicWebsiteStructuredData();
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }} />
    <LandingContent />
  </>;
}
