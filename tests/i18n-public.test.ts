import assert from "node:assert/strict";
import { test } from "node:test";
import { publicLandingMetadata, publicLandingStructuredData, serializeStructuredData } from "../lib/i18n/public-page";
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

    const structured = await publicLandingStructuredData(locale);
    const graph = structured["@graph"] as Array<Record<string, unknown>>;
    const app = graph[0];
    const faq = graph[1];
    assert.equal(app.description, messages["landing.lead"]);
    assert.equal(app.inLanguage, locale === "en" ? "en-GB" : `${locale}-CH`);
    assert.equal(faq.inLanguage, app.inLanguage);
    const questions = faq.mainEntity as Array<Record<string, unknown>>;
    assert.equal(questions[0]?.name, messages["landing.faq1Q"]);
    assert.equal((questions[0]?.acceptedAnswer as Record<string, unknown>).text, messages["landing.faq1A"]);
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
