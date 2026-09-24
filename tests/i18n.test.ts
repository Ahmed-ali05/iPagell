import test from "node:test";
import assert from "node:assert/strict";
import it from "../lib/i18n/messages/it.json";
import de from "../lib/i18n/messages/de.json";
import fr from "../lib/i18n/messages/fr.json";
import en from "../lib/i18n/messages/en.json";
import { formatDate, formatNumber, selectPlural, loadMessages, translate } from "../lib/i18n";
import { initialLocale, localeStorageKey, locales, normalizeLocale, saveLocale } from "../lib/i18n/locale";
import { createDiary } from "../lib/new-diary";
import { apiErrorKey } from "../lib/i18n/errors";

const catalogs = { it, de, fr, en };
const placeholders = (message: string) => [...message.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

test("all supported languages have the same complete keys and placeholders", async () => {
  assert.deepEqual([...locales], ["it", "de", "fr", "en"]);
  const keys = Object.keys(it).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(catalogs[locale]).sort(), keys, locale);
    assert.deepEqual(await loadMessages(locale), catalogs[locale]);
    for (const key of keys) {
      const value = catalogs[locale][key as keyof typeof it];
      assert.ok(value.trim(), `${locale}:${key}`);
      assert.deepEqual(placeholders(value), placeholders(it[key as keyof typeof it]), `${locale}:${key}`);
    }
  }
});

test("locale values normalize and explicit preference wins", () => {
  assert.equal(normalizeLocale("de-CH"), "de");
  assert.equal(normalizeLocale("fr_CH"), "fr");
  assert.equal(normalizeLocale("it-CH"), "it");
  assert.equal(normalizeLocale("en-GB"), "en");
  assert.equal(normalizeLocale("PT-BR"), null);
  assert.equal(initialLocale("de-CH", ["fr-CH"]), "de");
  assert.equal(initialLocale(null, ["pt-BR", "fr-CH"]), "fr");
  assert.equal(initialLocale(null, ["pt-BR"]), "it");
});

test("missing translation falls back to Italian and variables remain semantic", () => {
  assert.equal(translate({}, "sync.offline"), it["sync.offline"]);
  assert.equal(translate(de, "workspace.greeting", { name: "Mia" }), "Guten Tag, Mia");
  assert.equal(apiErrorKey("AUTH_INVALID_CREDENTIALS"), "auth.invalidCredentials");
  assert.equal(apiErrorKey("DIARY_CONFLICT"), "sync.conflictDetail");
  assert.equal(apiErrorKey("SECURITY_INVALID_PASSWORD"), "security.invalidPassword");
  assert.equal(apiErrorKey("UNKNOWN_CODE"), "error.generic");
});

test("a stored error key renders in the selected language without revalidation", () => {
  const visibleError = "error.grade";
  const germanError = translate(de, visibleError);
  const frenchError = translate(fr, visibleError);
  assert.notEqual(germanError, frenchError);
  assert.equal(translate(de, visibleError), germanError);
  assert.equal(translate(fr, visibleError), frenchError);
  assert.equal(it["security.confirmUsername"], "Scrivi {username} per confermare");
});

test("plural labels use the locale category in application copy", () => {
  for (const locale of locales) {
    const messages = catalogs[locale];
    const one = translate(messages, selectPlural(locale, 1, "agenda.itemOne", "agenda.itemMany"));
    const many = translate(messages, selectPlural(locale, 2, "agenda.itemOne", "agenda.itemMany"));
    assert.equal(one, locale === "de" ? "Aktivität" : locale === "fr" ? "activité" : locale === "en" ? "activity" : "attività");
    assert.equal(many, locale === "de" ? "Aktivitäten" : locale === "fr" ? "activités" : locale === "en" ? "activities" : "attività");
  }
});

test("main date and decimal formatting follow locale", () => {
  assert.match(formatDate("de", "2026-09-24", { month: "long", year: "numeric", timeZone: "UTC" }), /September 2026/);
  assert.equal(formatNumber("de", 4.5, { minimumFractionDigits: 1 }), "4.5");
  assert.equal(formatNumber("fr", 4.5, { minimumFractionDigits: 1 }), "4,5");
  assert.equal(formatNumber("en", 4.5, { minimumFractionDigits: 1 }), "4.5");
  assert.equal(selectPlural("de", 1, "one", "many"), "one");
  assert.equal(selectPlural("de", 2, "one", "many"), "many");
});

test("changing interface language stores only a local preference, not diary data", async () => {
  const diary = createDiary({ name: "Mia", school: "", semester: "S1", schoolYear: "2026/27", startDate: "2026-08-01", endDate: "2027-01-31", preset: "basic" });
  const snapshot = JSON.stringify(diary);
  const writes: [string, string][] = [];
  const storage = { setItem(key: string, value: string) { writes.push([key, value]); } };
  for (const locale of locales) {
    saveLocale(storage, locale);
    translate(await loadMessages(locale), "sync.saved");
  }
  assert.deepEqual(writes, locales.map(locale => [localeStorageKey, locale]));
  assert.equal(JSON.stringify(diary), snapshot);
});
