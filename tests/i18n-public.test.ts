import assert from "node:assert/strict";
import { test } from "node:test";
import { publicLandingMetadata, publicWebsiteStructuredData, serializeStructuredData } from "../lib/i18n/public-page";
import { defaultLocale, locales } from "../lib/i18n/locale";
import { defaultMessages, loadMessages } from "../lib/i18n";

test("public landing metadata shares all four message catalogs and language URLs", async () => {
  for (const locale of locales) {
    const messages = locale === defaultLocale ? defaultMessages : await loadMessages(locale);
    const metadata = await publicLandingMetadata(locale);
    assert.equal(metadata.description, messages["landing.lead"]);
    assert.deepEqual(metadata.alternates?.languages, {
      it: "https://ipagell.website/",
      de: "https://ipagell.website/de",
      fr: "https://ipagell.website/fr",
      en: "https://ipagell.website/en",
      "x-default": "https://ipagell.website/",
    });
    assert.equal(metadata.alternates?.canonical, locale === "it" ? "/" : `/${locale}`);
    assert.equal(metadata.manifest, locale === "it" ? "/manifest.webmanifest" : `/manifest-${locale}.webmanifest`);

    assert.equal(metadata.openGraph?.url, `https://ipagell.website${locale === "it" ? "/" : `/${locale}`}`);
    const socialImage = locale === "it" ? "/og.png" : `/og-${locale}.png`;
    assert.equal((metadata.openGraph?.images as Array<Record<string, unknown>>)[0]?.url, socialImage);
    assert.deepEqual(metadata.twitter?.images, [socialImage]);
  }
});

test("noncanonical preview hosts are noindex and JSON-LD escapes HTML delimiters", async () => {
  const preview = await publicLandingMetadata("de", false);
  assert.deepEqual(preview.robots, { index: false, follow: false });
  const safe = serializeStructuredData({ text: "</script><script>" });
  assert.ok(!safe.includes("<"));
  assert.equal(JSON.parse(safe).text, "</script><script>");
});

test("the root landing stays Italian and localized pages omit duplicate /it canonical", async () => {
  const root = await publicLandingMetadata("it");
  assert.equal(root.title, defaultMessages["landing.title"]);
  assert.equal(root.openGraph?.title, `${defaultMessages["landing.title"]} | iPagell`);
  assert.equal(root.alternates?.canonical, "/");
  assert.equal((await publicLandingMetadata("de")).alternates?.canonical, "/de");
});

test("homepage structured data only identifies the canonical website", () => {
  const website = publicWebsiteStructuredData();
  assert.deepEqual(website, {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "iPagell",
    url: "https://ipagell.website/",
  });
  assert.equal("offers" in website, false);
  assert.equal("aggregateRating" in website, false);
});
