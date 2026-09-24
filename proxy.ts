import { NextRequest, NextResponse } from "next/server";
import { locales } from "@/lib/i18n/locale";

const CANONICAL_HOST = "ipagell.website";

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const isAlternateHost =
    hostname === "www.ipagell.website" ||
    hostname === "ipagell.produc-ch.chatgpt.site";

  if (isAlternateHost) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.hostname = CANONICAL_HOST;
    canonicalUrl.port = "";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-ipagell-explicit-locale");
  requestHeaders.delete("x-ipagell-public-locale");
  const pathLocale = request.nextUrl.pathname.split("/")[1];
  const locale = locales.find((candidate) => candidate === pathLocale);
  if (locale) {
    requestHeaders.set("x-ipagell-explicit-locale", locale);
    requestHeaders.set("x-ipagell-public-locale", locale);
  } else if (request.nextUrl.pathname === "/") {
    requestHeaders.set("x-ipagell-public-locale", "it");
  } else if (request.nextUrl.pathname === "/app") {
    const appLocale = locales.find((candidate) => candidate === request.nextUrl.searchParams.get("uiLocale"));
    if (appLocale) requestHeaders.set("x-ipagell-explicit-locale", appLocale);
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: "/:path*",
};
