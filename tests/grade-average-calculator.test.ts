import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatorAverage, parseCalculatorEntry, parsePositiveWeight, restoreCalculatorState, type CalculatorGrade } from "../lib/grade-average-calculator";
import { CALCULATOR_GRADING_SYSTEMS, CURRENT_GRADING_SYSTEM as system, calculatorGradingSystem, compareGradeValues, isPassingGrade, isPlainGradeText, parseNumericGrade } from "../lib/grading";
import { publicAverageMetadata } from "../lib/i18n/public-page";
import { publicAveragePaths } from "../lib/i18n/public-routes";
import { locales } from "../lib/i18n/locale";
import { loadMessages } from "../lib/i18n";
import type { NumericGradingSystem } from "../types/grading";

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
  const languages = Object.fromEntries(locales.flatMap((locale) => [[locale, `https://ipagell.website${publicAveragePaths[locale]}`], [`${locale}-CH`, `https://ipagell.website${publicAveragePaths[locale]}`]]));
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

const preset = (id: string): NumericGradingSystem => {
  const found = calculatorGradingSystem(id);
  assert.ok(found, id);
  return found;
};

test("calculator offers five scales; the first is the diary's 1–6 scale", () => {
  assert.deepEqual(CALCULATOR_GRADING_SYSTEMS.map((item) => item.id), ["numeric-1-6", "numeric-1-10", "numeric-0-20", "numeric-1-6-lower-better", "percent-0-100"]);
  assert.equal(CALCULATOR_GRADING_SYSTEMS[0], system);
  assert.equal(calculatorGradingSystem("numeric-1-12"), undefined);
});

test("1–10 accepts the agreed notation: + and - are a quarter, ½ and n/n+1 a half", () => {
  const decimi = preset("numeric-1-10");
  for (const [input, value] of [["6+", 6.25], ["6-", 5.75], ["6 -", 5.75], ["6–", 5.75], ["6½", 6.5], ["6 ½", 6.5], ["6/7", 6.5], ["6-7", 6.5], ["6,5", 6.5], ["10-", 9.75], ["1+", 1.25], ["10", 10], ["1", 1]] as const)
    assert.equal(parseNumericGrade(input, decimi), value, input);
  for (const input of ["10+", "1-", "6/8", "6-8", "0", "11", "6++", "6+-", "½"])
    assert.throws(() => parseNumericGrade(input, decimi), input);
  assert.equal(calculatorAverage([grade("a", 6.25), grade("b", 7)], decimi), 6.625);
});

test("the diary's 1–6 scale keeps its notation and rejects the new forms", () => {
  assert.equal(parseNumericGrade("4-5"), 4.5);
  for (const input of ["4+", "4-", "4½", "4/5", "85%"])
    assert.throws(() => parseNumericGrade(input), input);
});

test("0–20 and percentages treat zero as a real grade", () => {
  const twenty = preset("numeric-0-20");
  assert.deepEqual(parseCalculatorEntry("0", "1", twenty), { value: 0, weight: 1 });
  assert.equal(calculatorAverage([grade("a", 0), grade("b", 20)], twenty), 10);
  for (const input of ["20.5", "-1", "12-13", "12+"]) assert.deepEqual(parseCalculatorEntry(input, "1", twenty), { error: "grade" }, input);
  const percent = preset("percent-0-100");
  assert.equal(parseNumericGrade("85%", percent), 85);
  assert.equal(parseNumericGrade("85,5 %", percent), 85.5);
  assert.equal(parseNumericGrade("0", percent), 0);
  assert.throws(() => parseNumericGrade("101", percent));
  assert.equal(percent.passingValue, undefined);
  assert.equal(isPassingGrade(50, percent), null);
});

test("lower-is-better 1–6 averages normally but orders and passes in reverse", () => {
  const inverse = preset("numeric-1-6-lower-better");
  assert.equal(calculatorAverage([grade("a", 2), grade("b", 4)], inverse), 3);
  assert.ok(compareGradeValues(1, 2, inverse) > 0);
  assert.equal(isPassingGrade(4, inverse), true);
  assert.equal(isPassingGrade(4.5, inverse), false);
});

test("plain numbers need no counted-value preview; notation does", () => {
  for (const input of ["6", "6,5", "6.25", " 12 "]) assert.equal(isPlainGradeText(input), true, input);
  for (const input of ["6+", "6½", "6/7", "4-5", "85%"]) assert.equal(isPlainGradeText(input), false, input);
});

test("calculator state keeps one validated list per scale and migrates the v1 list to 1–6", () => {
  const legacy = restoreCalculatorState({ grades: [{ entered: "5,5", enteredWeight: "2" }, { entered: "8", enteredWeight: "1" }], gradeInput: "4", weightInput: "1" });
  assert.equal(legacy.scale, "numeric-1-6");
  assert.deepEqual(legacy.lists, { "numeric-1-6": [{ id: "restored-0", entered: "5,5", enteredWeight: "2", value: 5.5, weight: 2 }] });
  assert.equal(legacy.gradeInput, "4");

  const current = restoreCalculatorState({
    scale: "numeric-1-10",
    lists: { "numeric-1-10": [{ entered: "6+", enteredWeight: "1", value: 999 }], "numeric-1-6": [{ entered: "8", enteredWeight: "1" }], unknown: [{ entered: "1", enteredWeight: "1" }] },
  });
  assert.equal(current.scale, "numeric-1-10");
  assert.deepEqual(current.lists, { "numeric-1-10": [{ id: "restored-0", entered: "6+", enteredWeight: "1", value: 6.25, weight: 1 }] });
  assert.equal(current.weightInput, "1");

  assert.equal(restoreCalculatorState({ scale: "numeric-1-12" }).scale, "numeric-1-6");
  assert.deepEqual(restoreCalculatorState(null), { scale: "numeric-1-6", lists: {}, gradeInput: "", weightInput: "1" });
});
