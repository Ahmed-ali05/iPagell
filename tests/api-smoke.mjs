import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = process.env.TEST_BASE_URL ?? "http://localhost:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error(
    "Use a local test server; this suite creates and deletes its own synthetic accounts.",
  );
const prefix = "qa_" + randomUUID().slice(0, 8),
  password = "Synthetic API test passphrase 2026!";
const accounts = [];
let passed = 0;
const testIp = "192.0.2." + (1 + Math.floor(Math.random() * 253));
async function call(path, body, cookie, extra = {}) {
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      "CF-Connecting-IP": testIp,
      ...(cookie ? { Cookie: cookie } : {}),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? await response.json()
    : { error: await response.text() };
  return {
    status: response.status,
    data,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
    headers: response.headers,
  };
}
async function api(path, method, body, cookie) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      "CF-Connecting-IP": testIp,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data };
}
function check(value, expected, label) {
  assert.deepEqual(value, expected, label);
  passed++;
  console.log("PASS", label);
}
async function signUp(suffix) {
  const username = prefix + suffix;
  const r = await call("/api/auth/register", { username, password });
  check(r.status, 201, "register " + suffix);
  const account = {
    username,
    password,
    cookie: r.cookie,
    id: r.data.user.id,
    recovery: r.data.recoveryCode,
  };
  accounts.push(account);
  return account;
}
async function put(account, diary, revision, expectedUserId = account.id) {
  const response = await fetch(base + "/api/diary", {
    method: "PUT",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      Cookie: account.cookie,
    },
    body: JSON.stringify({ diary, revision, expectedUserId }),
  });
  return { status: response.status, data: await response.json() };
}
try {
  check((await call("/api/account")).status, 401, "anonymous denied");
  check(
    (
      await call("/api/account", undefined, undefined, {
        "oai-authenticated-user-id": "forged",
        "oai-authenticated-user-email": "forged@example.test",
      })
    ).status,
    401,
    "ChatGPT/forged headers do not authenticate",
  );
  check(
    (await call("/api/auth/register", { username: prefix, password: "short" }))
      .status,
    400,
    "short passwords rejected",
  );
  check(
    (
      await call("/api/auth/login", { username: prefix, password }, undefined, {
        Origin: "https://attacker.example",
      })
    ).status,
    403,
    "cross-origin login blocked",
  );
  const a = await signUp("a"),
    b = await signUp("b");
  const login = await call("/api/auth/login", {
    username: a.username,
    password,
  });
  check(login.status, 200, "password login");
  check(
    login.headers.get("set-cookie").includes("HttpOnly"),
    true,
    "HttpOnly session cookie",
  );
  check(
    login.headers.get("set-cookie").includes("SameSite=Lax"),
    true,
    "SameSite session cookie",
  );
  check(
    login.headers.get("cache-control").includes("no-store"),
    true,
    "no-store authentication response",
  );
  check(login.cookie !== a.cookie, true, "new session token on login");
  check(
    (
      await call("/api/auth/login", {
        username: a.username,
        password: "invalid password",
      })
    ).status,
    401,
    "wrong password denied",
  );
  const registration = {
    name: "Synthetic tester",
    school: "QA only",
    semester: "S1",
    schoolYear: "2026/27",
    startDate: "2026-08-24",
    endDate: "2027-01-31",
    preset: "sig",
  };
  const profile = await call("/api/account", registration, a.cookie);
  check(profile.status, 201, "create own diary");
  check(
    (await call("/api/account", undefined, b.cookie)).data.diary,
    null,
    "another account cannot read diary A",
  );
  const { revision, ...diary } = profile.data.diary;
  check(
    (await put(b, diary, revision, a.id)).status,
    401,
    "foreign expected identity blocked",
  );
  check((await put(a, diary, revision)).status, 200, "own update accepted");
  check(
    (await put(a, diary, revision)).status,
    409,
    "stale revision cannot overwrite newer data",
  );
  const corrupt = structuredClone(diary);
  corrupt.data.subjects[0].coefficient = -5;
  check(
    (await put(a, corrupt, revision + 1)).status,
    400,
    "invalid weight cannot reach storage",
  );
  const tooBig = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ username: a.username, password: "x".repeat(6000) }),
  });
  check(tooBig.status, 413, "auth request size limit");
  await tooBig.arrayBuffer();
  check(
    (await call("/api/account", undefined, a.cookie)).status,
    200,
    "session remains valid after oversized request",
  );
  const createdClass = await api(
    "/api/classes",
    "POST",
    {
      name: "Classe QA",
      description: "Dati sintetici",
      displayName: "A",
    },
    a.cookie,
  );
  check(createdClass.status, 201, "class owner creates a class");
  const classId = createdClass.data.class.id;
  check(
    (await api(`/api/classes/${classId}`, "GET", undefined, b.cookie)).status,
    404,
    "non-member cannot read class",
  );
  const ownerInvite = await api(
    `/api/classes/${classId}/invites`,
    "POST",
    { expiresInDays: 7, maxUses: 2 },
    a.cookie,
  );
  check(ownerInvite.status, 201, "owner creates invite");
  const joined = await api(
    "/api/classes/join",
    "POST",
    { code: ownerInvite.data.invite.code, displayName: "B" },
    b.cookie,
  );
  check(joined.status, 201, "second account joins with code");
  check(joined.data.class.members.length, 2, "joined class lists two members");
  check(
    (
      await api(
        `/api/classes/${classId}/invites`,
        "POST",
        { expiresInDays: 7, maxUses: 1 },
        b.cookie,
      )
    ).status,
    403,
    "ordinary member cannot create invite",
  );
  check(
    (
      await api(
        `/api/classes/${classId}/members/${b.id}`,
        "PATCH",
        { operation: "role", role: "moderator" },
        a.cookie,
      )
    ).status,
    200,
    "owner promotes moderator",
  );
  const moderatorInvite = await api(
    `/api/classes/${classId}/invites`,
    "POST",
    { expiresInDays: 7, maxUses: 1 },
    b.cookie,
  );
  check(moderatorInvite.status, 201, "moderator creates invite");
  check(
    (
      await api(
        `/api/classes/${classId}/invites/${moderatorInvite.data.invite.id}`,
        "DELETE",
        {},
        b.cookie,
      )
    ).status,
    200,
    "moderator revokes invite",
  );
  check(
    (
      await api(
        `/api/classes/${classId}/members/${b.id}`,
        "PATCH",
        { operation: "transfer" },
        a.cookie,
      )
    ).status,
    200,
    "owner transfers class",
  );
  check(
    (
      await api(
        `/api/classes/${classId}/members/${a.id}`,
        "DELETE",
        {},
        a.cookie,
      )
    ).status,
    200,
    "former owner leaves class",
  );
  check(
    (await api(`/api/classes/${classId}`, "GET", undefined, a.cookie)).status,
    404,
    "former member loses access",
  );
  check(
    (
      await api(
        "/api/classes/join",
        "POST",
        { code: moderatorInvite.data.invite.code, displayName: "A" },
        a.cookie,
      )
    ).status,
    409,
    "revoked invite cannot be reused",
  );
  check(
    (await api(`/api/classes/${classId}`, "DELETE", {}, b.cookie)).status,
    200,
    "new owner deletes class",
  );
  check(
    (await api("/api/classes", "GET", undefined, b.cookie)).data.classes.length,
    0,
    "deleted class leaves no membership",
  );
  const recovery = await call("/api/auth/recover", {
    username: a.username,
    recoveryCode: a.recovery,
    password: password + "new",
  });
  if (recovery.status !== 200) console.log("Recovery failure:", recovery.data);
  check(recovery.status, 200, "recovery code resets password");
  a.password = password + "new";
  check(
    (await call("/api/account", undefined, a.cookie)).status,
    401,
    "reset invalidates old sessions",
  );
  check(
    (
      await call("/api/auth/recover", {
        username: a.username,
        recoveryCode: a.recovery,
        password: a.password,
      })
    ).status,
    401,
    "recovery code cannot be reused",
  );
  const after = await call("/api/auth/login", {
    username: a.username,
    password: a.password,
  });
  check(after.status, 200, "new password works");
  a.cookie = after.cookie;
  check(
    (await call("/api/auth/logout", {}, a.cookie)).status,
    200,
    "logout succeeds",
  );
  check(
    (await call("/api/account", undefined, a.cookie)).status,
    401,
    "logout revokes server session",
  );
  a.cookie = (
    await call("/api/auth/login", {
      username: a.username,
      password: a.password,
    })
  ).cookie;
  let last;
  for (let i = 0; i < 13; i++)
    last = await call("/api/auth/login", {
      username: prefix + "absent",
      password: "invalid password",
    });
  check(last.status, 429, "distributed attempt limit");
} finally {
  for (const a of accounts) {
    const r = await call(
      "/api/auth/security",
      {
        operation: "delete",
        expectedUserId: a.id,
        currentPassword: a.password,
        confirmation: a.username,
      },
      a.cookie,
    );
    assert.equal(r.status, 200, "cleanup of synthetic test account");
    check(
      (await call("/api/account", undefined, a.cookie)).status,
      401,
      "deleted account session denied",
    );
  }
}
console.log(passed, "API checks passed; synthetic accounts removed.");
