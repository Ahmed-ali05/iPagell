import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../lib/server/password";
import {
  diarySchema,
  parseGrade,
  backupSchema,
  daySchema,
} from "../lib/validation";
import { createDiary } from "../lib/new-diary";
import {
  generalAverage,
  subjectAverage,
  neededGrade,
} from "../lib/calculations";
import { checkMutation, readJson } from "../lib/server/http";
import {
  canClassAction,
  classFeatureEnabled,
  parseClassRole,
  type ClassAction,
  type ClassRole,
} from "../lib/classes/permissions";
const fixture = () =>
  createDiary({
    name: "Test",
    school: "",
    semester: "S1",
    schoolYear: "2026/27",
    startDate: "2026-08-01",
    endDate: "2027-01-31",
    preset: "sig",
  });
test("new accounts start without any personal demo results", () => {
  const d = fixture();
  assert.equal(d.data.grades.length, 0);
  assert.equal(d.data.agenda.length, 0);
  assert.equal(d.data.absences.length, 0);
  assert.equal(d.preferences.studentName, "Test");
  assert.ok(diarySchema.safeParse(d).success);
});
test("Swiss grades accept half notation and comma, reject malformed values", () => {
  for (const [input, value] of [
    ["4-5", 4.5],
    ["5,5", 5.5],
    ["6", 6],
    ["1", 1],
  ] as const)
    assert.equal(parseGrade(input), value);
  for (const input of ["", "NaN", "Infinity", "0", "6.5", "3-5", "6-7"])
    assert.throws(() => parseGrade(input));
});
test("validation rejects broken references, duplicates, invalid dates and unsafe color", () => {
  const d = fixture();
  assert.equal(daySchema.safeParse("2026-02-30").success, false);
  for (const mutate of [
    (x: typeof d) => {
      x.preferences.currentSemesterId = "missing";
    },
    (x: typeof d) => {
      x.data.semesters.push(x.data.semesters[0]);
    },
    (x: typeof d) => {
      x.data.subjects[0].color = "url(javascript:alert(1))";
    },
    (x: typeof d) => {
      x.data.subjects[0].coefficient = Infinity;
    },
  ]) {
    const copy = structuredClone(d);
    mutate(copy);
    assert.equal(diarySchema.safeParse(copy).success, false);
  }
  assert.equal(
    backupSchema.safeParse({
      app: "iPagell",
      exportedAt: new Date().toISOString(),
      ...d,
      userId: "intruder",
    }).success,
    false,
  );
});
test("weighted averages and simulator use both type and assessment weights", () => {
  const d = fixture();
  const s = d.data.subjects[0];
  s.gradeTypes[0].weight = 2;
  s.gradeTypes[1].weight = 1;
  const grades = [
    {
      id: "a",
      subjectId: s.id,
      semesterId: d.data.semesters[0].id,
      typeId: s.gradeTypes[0].id,
      value: 4,
      weight: 1,
      date: "2026-09-01",
    },
    {
      id: "b",
      subjectId: s.id,
      semesterId: d.data.semesters[0].id,
      typeId: s.gradeTypes[1].id,
      value: 6,
      weight: 1,
      date: "2026-09-02",
    },
  ];
  assert.equal(subjectAverage(s, grades), 14 / 3);
  assert.equal(generalAverage(d.data.subjects, grades), 14 / 3);
  assert.equal(neededGrade(s, grades, 5, 2), 5.5);
  assert.equal(subjectAverage(s, []), null);
});
test("passwords have unique salts and constant-time verification", async () => {
  const password = "A long independent test passphrase";
  const a = await hashPassword(password),
    b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("wrong password", a), false);
  assert.equal(await verifyPassword(password, "sha256$invalid"), false);
});
test("CSRF and streamed body size checks", async () => {
  const req = (origin: string) =>
    new Request("https://ipagell.test/api/diary", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: "{}",
    });
  assert.doesNotThrow(() => checkMutation(req("https://ipagell.test")));
  assert.throws(() => checkMutation(req("https://attacker.test")));
  await assert.rejects(() =>
    readJson(
      new Request("https://ipagell.test/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ data: "x".repeat(5000) }),
      }),
      4096,
    ),
  );
});

test("class role permissions match the product matrix", () => {
  const allowed: Record<ClassRole, ClassAction[]> = {
    owner: [
      "class:view",
      "content:create",
      "content:update-own",
      "content:moderate",
      "invite:manage",
      "member:remove",
      "role:manage",
      "class:manage",
      "class:delete",
      "class:transfer",
    ],
    moderator: [
      "class:view",
      "content:create",
      "content:update-own",
      "content:moderate",
      "invite:manage",
      "member:remove",
    ],
    member: ["class:view", "content:create", "content:update-own"],
  };
  const actions = allowed.owner;
  for (const role of ["owner", "moderator", "member"] as const)
    for (const action of actions)
      assert.equal(
        canClassAction(role, action),
        allowed[role].includes(action),
        `${role} / ${action}`,
      );
});

test("class access rejects unknown roles and stays disabled by default", () => {
  assert.equal(parseClassRole("teacher"), null);
  assert.equal(parseClassRole("moderator"), "moderator");
  assert.equal(classFeatureEnabled(undefined), false);
  assert.equal(classFeatureEnabled("true"), false);
  assert.equal(classFeatureEnabled(" enabled "), true);
});
