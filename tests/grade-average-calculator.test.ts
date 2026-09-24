import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatorAverage, parseCalculatorEntry, parsePositiveWeight, type CalculatorGrade } from "../lib/grade-average-calculator";
import { CURRENT_GRADING_SYSTEM as system } from "../lib/grading";
import { publicAverageMetadata } from "../lib/i18n/public-page";
import { publicAveragePaths } from "../lib/i18n/public-routes";
import { locales } from "../lib/i18n/locale";
import { loadMessages } from "../lib/i18n";

const grade = (id: string, value: number, weight = 1): CalculatorGrade => ({ id, value, weight });

test("empty, single, simple and weighted lists use the shared mean", () => {
  assert.equal(calculatorAverage([], system), null);
  assert.equal(calculatorAverage([grade("a", 5)], system), 5);
  assert.equal(calculatorAverage([grade("a", 4), grade("b", 6)], system), 5);
  assert.equal(calculatorAverage([grade("a", 4, 1), grade("b", 6, 3)], system), 5.5);
});

test("default weight, removal and grade boundaries", () => {
  assert.deepEqual(parseCalculatorEntry("1", "", system), { value: 1, weight: 1 });
  assert.deepEqual(parseCalculatorEntry("6", "1", system), { value: 6, weight: 1 });
  const grades = [grade("a", 1), grade("b", 6)];
  assert.equal(calculatorAverage(grades.filter((item) => item.id !== "a"), system), 6);
  for (const input of ["0", "6.1", "3-5", "NaN"])
    assert.deepEqual(parseCalculatorEntry(input, "1", system), { error: "grade" });
});

test("comma, point and adjacent-half input; invalid and zero weights", () => {
  assert.deepEqual(parseCalculatorEntry("4,5", "2,5", system), { value: 4.5, weight: 2.5 });
  assert.deepEqual(parseCalculatorEntry("4.5", "2.5", system), { value: 4.5, weight: 2.5 });
  assert.deepEqual(parseCalculatorEntry("4-5", "1", system), { value: 4.5, weight: 1 });
  for (const input of ["0", "-1", "abc", "1,2.3", "Infinity"])
    assert.equal(parsePositiveWeight(input), null);
  assert.deepEqual(parseCalculatorEntry("4", "0", system), { error: "weight" });
  assert.equal(calculatorAverage([grade("a", 4, 0)], system), null);
  assert.equal(calculatorAverage([grade("a", 4, 0), grade("b", 6, 0)], system), null);
});

test("extreme finite weights preserve the mean without overflow or underflow", () => {
  assert.equal(calculatorAverage([grade("a", 6, 1e308)], system), 6);
  assert.equal(calculatorAverage([grade("a", 4, 1e308), grade("b", 6, 1e308)], system), 5);
  assert.equal(calculatorAverage([grade("a", 5, Number.MIN_VALUE)], system), 5);
});

test("all localized tool metadata share canonical, hreflang and translated copy", async () => {
  const languages = Object.fromEntries(locales.map((locale) => [locale, `https://ipagell.website${publicAveragePaths[locale]}`]));
  for (const locale of locales) {
    const messages = await loadMessages(locale);
    const metadata = await publicAverageMetadata(locale);
    assert.equal(metadata.title, messages["average.title"]);
    assert.equal(metadata.description, messages["average.description"]);
    assert.equal(metadata.alternates?.canonical, publicAveragePaths[locale]);
    assert.deepEqual(metadata.alternates?.languages, { ...languages, "x-default": languages.it });
    assert.equal(metadata.openGraph?.url, languages[locale]);
    assert.equal(metadata.twitter?.description, messages["average.description"]);
  }
  assert.deepEqual((await publicAverageMetadata("de", false)).robots, { index: false, follow: false });
});
