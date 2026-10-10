import { test } from "node:test";
import assert from "node:assert/strict";
import { initialGradeScope, resolveGradeScope, scopeGrades, scopePeriods } from "../lib/grade-scope";
import { generalAverage, gradeTrend, neededGrade, subjectAverage } from "../lib/calculations";
import { backupSchema } from "../lib/validation";
import { createDiary } from "../lib/new-diary";
import type { Grade, Semester, Subject } from "../types/domain";

const periods: Semester[] = [
  { id: "p1", name: "First", schoolYear: "2026/27", startDate: "2026-08-01", endDate: "2027-01-31", archived: true },
  { id: "p2", name: "Second", schoolYear: "2026/27", startDate: "2027-02-01", endDate: "2027-07-31" },
  { id: "old", name: "First", schoolYear: "2025/26", startDate: "2025-08-01", endDate: "2026-07-31" },
  { id: "label", name: "Same dates, different label", schoolYear: "2026-2027", startDate: "2026-08-01", endDate: "2027-07-31" },
];
const subjects: Subject[] = [
  { id: "a", name: "Math", color: "#6655e6", coefficient: 2, archived: true, gradeTypes: [{ id: "type", name: "Written", weight: 1 }] },
  { id: "b", name: "Math", color: "#6655e6", coefficient: 1, gradeTypes: [{ id: "type", name: "Written", weight: 1 }] },
  { id: "empty", name: "Empty", color: "#6655e6", coefficient: 100, gradeTypes: [{ id: "type", name: "Written", weight: 1 }] },
];
const grade = (id: string, semesterId: string, value: number, weight = 1, subjectId = "a", date = "2027-01-10"): Grade =>
  ({ id, semesterId, subjectId, typeId: "type", value, weight, date });
const grades = [grade("g1", "p1", 6), grade("g2", "p2", 4, 3), grade("g3", "old", 2), grade("g4", "label", 1)];

test("annual consultation aggregates individual weights across archived periods, not period means", () => {
  const scope = initialGradeScope(periods, "p2");
  assert.deepEqual(scope, { kind: "year", schoolYear: "2026/27" });
  const selected = scopeGrades(grades, periods, scope);
  assert.deepEqual(selected.map((g) => g.id), ["g1", "g2"]);
  assert.equal(subjectAverage(subjects[0], selected), 4.5);
  assert.equal(subjectAverage(subjects[0], scopeGrades(grades, periods, { kind: "period", semesterId: "p2" })), 4);
  assert.equal(scopePeriods(periods, scope)[0].archived, true);
});

test("school year uses exact label and period membership, never dates or names", () => {
  const selected = scopeGrades(grades, periods, { kind: "year", schoolYear: "2026/27" });
  assert.ok(selected.some((g) => g.id === "g2" && g.date < periods[1].startDate));
  assert.deepEqual(scopeGrades(grades, periods, { kind: "year", schoolYear: "2026-2027" }).map((g) => g.id), ["g4"]);
  assert.deepEqual(scopeGrades(grades, periods, { kind: "year", schoolYear: "2025/26" }).map((g) => g.id), ["g3"]);
  assert.deepEqual(scopeGrades(grades, periods, { kind: "all" }), grades);
});

test("same-name subjects stay distinct and overall average uses subject coefficients", () => {
  const selected = scopeGrades([...grades, grade("b1", "p1", 3, 20, "b")], periods, { kind: "year", schoolYear: "2026/27" });
  assert.equal(subjectAverage(subjects[0], selected), 4.5);
  assert.equal(subjectAverage(subjects[1], selected), 3);
  assert.equal(subjectAverage(subjects[2], selected), null);
  assert.equal(generalAverage(subjects, selected), 4);
});

test("current type weights recalculate the annual past without invented snapshots", () => {
  const subject = { ...subjects[0], gradeTypes: [{ id: "type", name: "Written", weight: 3 }, { id: "oral", name: "Oral", weight: 1 }] };
  const selected = [grade("a", "p1", 6, 2), { ...grade("b", "p2", 4, 3), typeId: "oral" }];
  assert.equal(subjectAverage(subject, selected), (6 * 6 + 4 * 3) / 9);
  assert.equal(subjectAverage({ ...subject, gradeTypes: subject.gradeTypes.map((type) => ({ ...type, weight: 1 })) }, selected), 4.8);
});

test("cumulative trend keeps ISO years, chronological order, same-day grouping and final weighted mean", () => {
  const selected = [grade("late", "p2", 4, 3, "a", "2027-01-10"), grade("early", "p1", 6, 1, "a", "2026-01-10"), grade("same", "p2", 3, 1, "b", "2027-01-10")];
  const trend = gradeTrend(subjects, selected);
  assert.deepEqual(trend.map((point) => point.date), ["2026-01-10", "2027-01-10"]);
  assert.equal(trend.at(-1)?.media, Number(generalAverage(subjects, selected)!.toFixed(2)));
});

test("empty current period can show its populated year; empty scope stays null", () => {
  const selected = [grades[0]];
  assert.deepEqual(scopeGrades(selected, periods, { kind: "period", semesterId: "p2" }), []);
  assert.equal(subjectAverage(subjects[0], scopeGrades(selected, periods, initialGradeScope(periods, "p2"))), 6);
  assert.equal(generalAverage(subjects, []), null);
  assert.deepEqual(gradeTrend(subjects, []), []);
});

test("removed/imported periods resolve to a real annual scope; reading leaves backup and preferences unchanged", () => {
  const diary = createDiary({ name: "QA", school: "", semester: "First", schoolYear: "2026/27", startDate: "2026-08-01", endDate: "2027-07-31", preset: "basic" });
  diary.data.semesters = structuredClone(periods);
  diary.data.subjects = structuredClone(subjects);
  diary.data.grades = structuredClone(grades);
  diary.preferences.currentSemesterId = "p2";
  const before = JSON.stringify(diary);
  const scope = resolveGradeScope({ kind: "period", semesterId: "removed" }, diary.data.semesters, diary.preferences.currentSemesterId);
  scopeGrades(diary.data.grades, diary.data.semesters, scope);
  assert.equal(JSON.stringify(diary), before);
  const backup = { app: "iPagell", exportedAt: new Date().toISOString(), ...diary };
  assert.deepEqual(backupSchema.parse(JSON.parse(JSON.stringify(backup))).data, diary.data);
  assert.deepEqual(resolveGradeScope({ kind: "year", schoolYear: "renamed" }, periods, "p2"), { kind: "year", schoolYear: "2026/27" });
});

test("simulation preserves small positive effective weight from grade weight times type weight", () => {
  const subject = { ...subjects[0], gradeTypes: [{ id: "type", name: "Written", weight: 0.1 }] };
  const selected = [grade("first", "p1", 4, 0.1)];
  assert.equal(neededGrade(subject, selected, 5, 0.1 * 0.1), 6);
  assert.equal(subjectAverage(subject, [...selected, grade("next", "p2", 6, 0.1)]), 5);
});
