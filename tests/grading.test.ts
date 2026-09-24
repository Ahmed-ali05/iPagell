import { test } from "node:test";
import assert from "node:assert/strict";
import { createDiary } from "../lib/new-diary";
import {
  CURRENT_GRADING_SYSTEM,
  compareGradeValues,
  formatNumericGrade,
  isPassingGrade,
  isValidGradeValue,
  parseNumericGrade,
  roundRequiredGrade,
} from "../lib/grading";
import { generalAverage, gradeTrend, neededGrade, subjectAverage } from "../lib/calculations";
import { diarySchema, gradeSchema } from "../lib/validation";

test("current preset describes numeric 1–6 with higher values better and pass at 4", () => {
  assert.equal(CURRENT_GRADING_SYSTEM.kind, "numeric");
  assert.deepEqual(CURRENT_GRADING_SYSTEM.values, {
    kind: "range",
    minimum: 1,
    maximum: 6,
  });
  assert.equal(CURRENT_GRADING_SYSTEM.order, "higher-is-better");
  assert.equal(CURRENT_GRADING_SYSTEM.passingValue, 4);
  assert.equal(CURRENT_GRADING_SYSTEM.formatting.displayFractionDigits, 1);
  assert.equal(CURRENT_GRADING_SYSTEM.formatting.maximumFractionDigits, null);
  assert.equal(CURRENT_GRADING_SYSTEM.formatting.simulatorResultStep, 0.5);
});

test("grade bounds, finite-number validation and schema preserve existing data rules", () => {
  const validGrade = {
    id: "grade-1",
    subjectId: "subject-1",
    semesterId: "semester-1",
    typeId: "type-1",
    value: 1,
    weight: 1,
    date: "2026-09-01",
  };
  assert.equal(isValidGradeValue(1), true);
  assert.equal(isValidGradeValue(6), true);
  assert.equal(isValidGradeValue(0.99), false);
  assert.equal(isValidGradeValue(6.01), false);
  assert.equal(isValidGradeValue(Number.NaN), false);
  assert.equal(isValidGradeValue(Number.POSITIVE_INFINITY), false);
  assert.equal(gradeSchema.safeParse(validGrade).success, true);
  assert.equal(gradeSchema.safeParse({ ...validGrade, value: 6 }).success, true);
  assert.equal(gradeSchema.safeParse({ ...validGrade, value: 0.99 }).success, false);
  assert.equal(gradeSchema.safeParse({ ...validGrade, value: 6.01 }).success, false);
});

test("current input accepts decimals and existing comma and adjacent-half notation", () => {
  assert.equal(parseNumericGrade("4-5"), 4.5);
  assert.equal(parseNumericGrade("4–5"), 4.5);
  assert.equal(parseNumericGrade("5,5"), 5.5);
  assert.equal(parseNumericGrade("4.125"), 4.125);
  for (const input of ["", "NaN", "Infinity", "0", "6.5", "3-5", "6-7"])
    assert.throws(() => parseNumericGrade(input));
});

test("pass threshold and comparison use the current higher-is-better order", () => {
  assert.equal(isPassingGrade(3.99), false);
  assert.equal(isPassingGrade(4), true);
  assert.equal(isPassingGrade(4.01), true);
  assert.ok(compareGradeValues(5, 4) > 0);
  assert.equal(compareGradeValues(4, 4), 0);
  assert.ok(compareGradeValues(3, 4) < 0);
});

test("simple and weighted means and required-grade calculation remain unrounded", () => {
  const diary = createDiary({
    name: "Test",
    school: "",
    semester: "S1",
    schoolYear: "2026/27",
    startDate: "2026-08-01",
    endDate: "2027-01-31",
    preset: "basic",
  });
  const subject = diary.data.subjects[0];
  subject.gradeTypes[0].weight = 2;
  subject.gradeTypes[1].weight = 1;
  const grades = [
    { id: "a", subjectId: subject.id, semesterId: diary.data.semesters[0].id, typeId: subject.gradeTypes[0].id, value: 4, weight: 1, date: "2026-09-01" },
    { id: "b", subjectId: subject.id, semesterId: diary.data.semesters[0].id, typeId: subject.gradeTypes[1].id, value: 6, weight: 1, date: "2026-09-02" },
  ];
  const simpleGrades = grades.map((grade) => ({
    ...grade,
    typeId: subject.gradeTypes[0].id,
  }));
  const secondSubject = diary.data.subjects[1];
  secondSubject.coefficient = 2;
  const secondSubjectGrade = {
    id: "c",
    subjectId: secondSubject.id,
    semesterId: diary.data.semesters[0].id,
    typeId: secondSubject.gradeTypes[0].id,
    value: 6,
    weight: 1,
    date: "2026-09-03",
  };
  assert.equal(subjectAverage(subject, grades), 14 / 3);
  assert.equal(subjectAverage(subject, simpleGrades), 5);
  assert.equal(
    generalAverage(diary.data.subjects, [...grades, secondSubjectGrade]),
    (14 / 3 + 6 * 2) / 3,
  );
  assert.equal(neededGrade(subject, grades, 5, 2), 5.5);
  assert.equal(subjectAverage(subject, []), null);
  assert.equal(diarySchema.safeParse({
    data: { ...diary.data, grades: [...grades, secondSubjectGrade] },
    preferences: diary.preferences,
  }).success, true);
});

test("number display uses the current precision and simulator rounds up to half points", () => {
  assert.equal(formatNumericGrade(4.123), "4.1");
  assert.equal(formatNumericGrade(4.25), "4.3");
  assert.equal(formatNumericGrade(null), "—");
  assert.equal(roundRequiredGrade(4.5), 4.5);
  assert.equal(roundRequiredGrade(4.50000001), 5);
  assert.equal(roundRequiredGrade(4.51), 5);
});

test("grade statistics trend keeps the current weighted arithmetic progression", () => {
  const diary = createDiary({
    name: "Test",
    school: "",
    semester: "S1",
    schoolYear: "2026/27",
    startDate: "2026-08-01",
    endDate: "2027-01-31",
    preset: "basic",
  });
  const subject = diary.data.subjects[0];
  const grades = [
    { id: "a", subjectId: subject.id, semesterId: diary.data.semesters[0].id, typeId: subject.gradeTypes[0].id, value: 4, weight: 1, date: "2026-09-01" },
    { id: "b", subjectId: subject.id, semesterId: diary.data.semesters[0].id, typeId: subject.gradeTypes[0].id, value: 6, weight: 1, date: "2026-09-02" },
  ];
  assert.deepEqual(gradeTrend(diary.data.subjects, grades), [
    { date: "2026-09-01", media: 4 },
    { date: "2026-09-02", media: 5 },
  ]);
});
