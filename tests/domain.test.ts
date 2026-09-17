import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../lib/server/password";
import {
  diarySchema,
  parseGrade,
  backupSchema,
  daySchema,
  registerSchema,
} from "../lib/validation";
import { createDiary } from "../lib/new-diary";
import { backupWithClassAgenda } from "../lib/classes/backup";
import { subscriptionAgenda, eventFields, type ClassSubscription } from "../lib/classes/events";
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
import {
  createInviteCode,
  normalizeInviteCode,
} from "../lib/classes/validation";
const fixture = () =>
  createDiary({
    name: "Test",
    school: "",
    semester: "S1",
    schoolYear: "2026/27",
    startDate: "2026-08-01",
    endDate: "2027-01-31",
    preset: "basic",
  });
test("class agenda backups become valid private copies without altering the diary", () => {
  const diary=fixture();
  const subscription:ClassSubscription={id:crypto.randomUUID(),semesterId:diary.preferences.currentSemesterId,subjectId:"",completed:false,reminder:true,revision:1,detachedAt:null,event:{id:crypto.randomUUID(),classId:crypto.randomUUID(),className:"3A",authorId:crypto.randomUUID(),authorName:"Compagno",subject:"Fisica",kind:"test",title:"Onde",description:"Capitolo 2",dueAt:"2026-10-10T08:00:00.000Z",status:"cancelled",revision:2,updatedAt:Date.now()}};
  const backup=backupWithClassAgenda(diary.data,diary.preferences,[subscription]);
  assert.ok(backupSchema.safeParse(backup).success);
  assert.equal(diary.data.agenda.length,0);
  assert.equal(backup.data.agenda.length,1);
  assert.equal(backup.data.agenda[0].title,"[Annullato] Onde");
  assert.equal(backup.data.agenda[0].reminder,false);
  assert.equal(backup.data.subjects.at(-1)?.name,"Fisica");
  assert.equal(JSON.stringify(backup).includes(subscription.event.authorId!),false);
  assert.equal(backupWithClassAgenda(backup.data,backup.preferences,[subscription]).data.agenda.length,1);
  assert.equal(subscriptionAgenda([subscription])[0].reminder,false);
});
test("shared event schema rejects private fields and invalid timestamps",()=>{
  const event={subject:"Matematica",kind:"test",title:"Verifica",dueAt:"2026-10-10T08:00:00.000Z"};
  assert.ok(eventFields.safeParse(event).success);
  assert.equal(eventFields.safeParse({...event,completed:true}).success,false);
  assert.equal(eventFields.safeParse({...event,dueAt:"not-a-date"}).success,false);
});
test("new accounts start without any personal demo results", () => {
  const d = fixture();
  assert.equal(d.data.grades.length, 0);
  assert.equal(d.data.agenda.length, 0);
  assert.equal(d.data.absences.length, 0);
  assert.equal(d.preferences.studentName, "Test");
  assert.ok(diarySchema.safeParse(d).success);
});
test("onboarding supports generic subjects, an empty diary and cached clients", () => {
  const input = {
    name: "Studente",
    school: "",
    semester: "S1",
    schoolYear: "2026/27",
    startDate: "2026-08-01",
    endDate: "2027-01-31",
  };
  for (const preset of ["basic", "sig", "empty"]) {
    const parsed = registerSchema.parse({ ...input, preset });
    assert.equal(parsed.preset, preset === "empty" ? "empty" : "basic");
    const diary = createDiary(parsed);
    assert.deepEqual(
      diary.data.subjects.map((subject) => subject.name),
      preset === "empty" ? [] : ["Matematica", "Italiano", "Inglese", "Storia", "Scienze"],
    );
    assert.ok(diarySchema.safeParse(diary).success);
    assert.equal(diary.data.grades.length + diary.data.agenda.length + diary.data.absences.length, 0);
  }
  assert.equal(registerSchema.safeParse({ ...input, preset: "unknown" }).success, false);
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

test("class invite codes are unambiguous and normalize separators", () => {
  const code = createInviteCode();
  assert.match(code, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}(?:-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}){2}$/);
  assert.equal(normalizeInviteCode(code.toLowerCase()), code.replaceAll("-", ""));
  assert.equal(normalizeInviteCode("IIII-OOOO-1111"), null);
});
