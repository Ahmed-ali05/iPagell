#!/usr/bin/env node
// Regenerates public/product-media/{locale}/*.webp from the real app (docs/UX-REFERENCE.md).
// Requires a local dev server (npm run dev) and Google Chrome. Each run registers a fresh
// throwaway account per locale on the LOCAL server only, with demonstrative data; no
// credentials are stored or printed. Usage: node scripts/capture-product-media.mjs [--explore]
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.IPAGELL_BASE ?? "http://localhost:5173";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EXPLORE = process.argv.includes("--explore");
const ONLY = process.argv.find(arg => arg.startsWith("--locale="))?.slice(9);
const host = new URL(BASE).hostname;
if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) throw new Error("Only a local development server is allowed.");

const copy = {
  it: { semester: "Semestre 1", math: "Matematica", english: "Inglese", written: "Scritto", oral: "Orale", task: "Ripassare le equazioni", noteTitle: "Equazioni di secondo grado", example: "Esempio", result: "x = 2 oppure x = 3", name: "Studente di esempio" },
  de: { semester: "1. Semester", math: "Mathematik", english: "Englisch", written: "Schriftlich", oral: "Mündlich", task: "Gleichungen wiederholen", noteTitle: "Quadratische Gleichungen", example: "Beispiel", result: "x = 2 oder x = 3", name: "Beispiel" },
  fr: { semester: "Semestre 1", math: "Mathématiques", english: "Anglais", written: "Écrit", oral: "Oral", task: "Réviser les équations", noteTitle: "Équations du second degré", example: "Exemple", result: "x = 2 ou x = 3", name: "Exemple" },
  en: { semester: "Semester 1", math: "Mathematics", english: "English", written: "Written", oral: "Oral", task: "Review equations", noteTitle: "Quadratic equations", example: "Example", result: "x = 2 or x = 3", name: "Example student" },
};

function isoDay(date) { return date.toISOString().slice(0, 10); }
function tomorrowAt(hour) {
  const date = new Date(); date.setDate(date.getDate() + 1); date.setHours(hour, 0, 0, 0);
  const offset = -date.getTimezoneOffset(), sign = offset >= 0 ? "+" : "-", abs = Math.abs(offset);
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:00:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

async function seedAccount(locale) {
  const text = copy[locale];
  let cookie = "";
  async function api(path, method, body, extra = {}) {
    const response = await fetch(`${BASE}${path}`, { method, headers: { "Content-Type": "application/json", Origin: BASE, Cookie: cookie, ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
    const setCookie = response.headers.getSetCookie?.() ?? [];
    if (setCookie.length) cookie = setCookie.map(value => value.split(";")[0]).join("; ");
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${data.code ?? ""}`);
    return data;
  }
  const username = `demo-${locale}-${randomBytes(4).toString("hex")}`;
  const { user } = await api("/api/auth/register", "POST", { username, password: randomBytes(18).toString("base64url"), ageConfirmed: true });
  const { diary } = await api("/api/account", "POST", { name: text.name, school: "", semester: text.semester, schoolYear: "2026/27", startDate: "2026-08-24", endDate: "2027-01-31", preset: "empty" }, { "X-IPagell-Account": user.id });
  const semesterId = diary.data.semesters[0].id;
  const subject = (name, color) => ({ id: randomUUID(), name, color, coefficient: 1, gradeTypes: [{ id: randomUUID(), name: text.written, weight: 1 }, { id: randomUUID(), name: text.oral, weight: 1 }] });
  const math = subject(text.math, "#258ee7"), english = subject(text.english, "#c87a24");
  const grade = (s, value, daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return { id: randomUUID(), subjectId: s.id, semesterId, typeId: s.gradeTypes[0].id, value, weight: 1, date: isoDay(d) }; };
  const data = { ...diary.data, updatedAt: new Date().toISOString(), subjects: [math, english],
    grades: [grade(math, 4.5, 30), grade(math, 5.5, 9), grade(english, 5.5, 14)],
    agenda: [{ id: randomUUID(), subjectId: math.id, semesterId, kind: "task", title: text.task, dueAt: tomorrowAt(17), completed: false }] };
  await api("/api/diary", "PUT", { expectedUserId: user.id, revision: diary.revision, diary: { data, preferences: { ...diary.preferences, theme: "light" } } });
  const content = `**Δ = b² − 4ac**\n## ${text.example}\nx² − 5x + 6 = 0\n**${text.result}**`;
  await api("/api/notes", "POST", { id: randomUUID(), expectedUserId: user.id, mutationId: randomUUID(), baseRevision: 0, pinned: false, subjectId: math.id, subjectName: math.name, title: text.noteTitle, content, contentFormat: "md-lite-v1" }, { "X-IPagell-Account": user.id, "X-IPagell-Notes-Contract": "2" });
  return cookie;
}

async function launchChrome() {
  const profile = await mkdtemp(join(tmpdir(), "ipagell-capture-"));
  const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--force-color-profile=srgb", "about:blank"], { stdio: "ignore" });
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    port = await readFile(join(profile, "DevToolsActivePort"), "utf8").then(value => value.split("\n")[0]).catch(() => undefined);
  }
  if (!port) throw new Error("Chrome did not start");
  const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0; const pending = new Map();
  socket.onmessage = event => { const message = JSON.parse(event.data); const entry = pending.get(message.id); if (!entry) return; pending.delete(message.id); if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result); };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, sessionId })); });
  return { send, async close() {
    socket.close();
    const exited = new Promise(resolve => chrome.once("exit", resolve));
    chrome.kill(); await exited;
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
  } };
}

async function openPage(browser, cookie, viewport, locale) {
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  const send = (method, params) => browser.send(method, params, sessionId);
  await send("Page.enable"); await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: 2 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: "reduce" }] });
  for (const part of cookie.split("; ")) { const [name, ...rest] = part.split("="); await send("Network.setCookie", { name, value: rest.join("="), url: BASE }); }
  const evaluate = async expression => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
  const go = async path => { await send("Page.navigate", { url: `${BASE}${path}${path.includes("?") ? "&" : "?"}uiLocale=${locale}` }); await new Promise(resolve => setTimeout(resolve, 4000)); };
  const shot = async (rect, file) => {
    const { data } = await send("Page.captureScreenshot", { format: file.endsWith(".png") ? "png" : "webp", quality: 88, captureBeyondViewport: true, clip: { ...rect, scale: 1 } });
    await writeFile(file, Buffer.from(data, "base64"));
  };
  return { send, evaluate, go, shot, close: () => browser.send("Target.closeTarget", { targetId }) };
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
/** Clicks the last visible control whose text is exactly `text`, else the last one containing it (navigation comes after content). */
const clickText = text => `(() => { const visible = [...document.querySelectorAll("button, a, [role=tab]")].filter(el => el.getClientRects().length); const exact = visible.filter(el => el.textContent.trim() === ${JSON.stringify(text)}); const el = (exact.length ? exact : visible.filter(el => el.textContent.includes(${JSON.stringify(text)}))).at(-1); el?.click(); return !!el; })()`;
const messages = Object.fromEntries(await Promise.all(Object.keys(copy).map(async locale => [locale, JSON.parse(await readFile(`lib/i18n/messages/${locale}.json`, "utf8"))])));
const rectOf = selector => `(() => { const el = ${selector}; if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), width: Math.round(r.width), height: Math.round(r.height) }; })()`;

const browser = await launchChrome();
const media = JSON.parse(await readFile("lib/product-media.json", "utf8"));
try {
  for (const locale of ONLY ? [ONLY] : Object.keys(copy)) {
    const cookie = await seedAccount(locale);
    const out = EXPLORE ? join(tmpdir(), "ipagell-explore") : `public/product-media/${locale}`;
    await mkdir(out, { recursive: true });
    for (const [label, viewport] of [["mobile", { width: 390, height: 844, mobile: true }], ["desktop", { width: 1280, height: 900, mobile: false }]]) {
      const page = await openPage(browser, cookie, viewport, locale);
      await page.go("/app");
      if (EXPLORE) {
        const full = async name => {
          const height = await page.evaluate("document.documentElement.scrollHeight");
          await page.shot({ x: 0, y: 0, width: viewport.width, height }, join(out, `${locale}-${label}-${name}.png`));
          console.log(join(out, `${locale}-${label}-${name}.png`));
        };
        await full("home");
        await page.evaluate(clickText(messages[locale]["nav.grades"])); await wait(2000);
        await page.evaluate(`document.querySelector("details.subject-averages")?.setAttribute("open", "")`); await wait(500);
        console.log(await page.evaluate(`document.querySelector("details.subject-averages")?.outerHTML.replace(/<svg.*?<\\/svg>/g, "").slice(0, 1500)`));
        await full("grades");
        await page.go("/app");
        await page.evaluate(clickText(copy[locale].noteTitle)); await wait(2500);
        await page.evaluate(clickText(messages[locale]["notes.done"] ?? "Fine")); await wait(1500);
        console.log(await page.evaluate(`(document.querySelector(".notes-content")?.closest("article, section") ?? document.querySelector(".notes-content"))?.outerHTML.replace(/<svg.*?<\\/svg>/g, "").slice(0, 1500)`));
        await full("note");
        await page.close(); continue;
      }
      // Square corners and no chrome: the public pages frame the images themselves.
      const prepare = `(() => { for (const el of document.querySelectorAll("body *")) if (getComputedStyle(el).position === "fixed") el.style.visibility = "hidden";
        const style = document.createElement("style"); style.textContent = ".hero-card, .notes-reader { border-radius: 0 !important; box-shadow: none !important; } .hero-card button, .notes-reader .reader-tools { display: none !important; }${label === "desktop" ? " .hero-card { max-width: 600px; }" : ""}"; document.head.append(style); })()`;
      const capture = async (rectExpression, view, variant) => {
        await page.evaluate(prepare); await wait(400);
        const rect = await page.evaluate(rectExpression);
        if (!rect) throw new Error(`${locale}/${label}: element for ${view} not found`);
        const file = `${out}/${variant === "desktop" ? view : `${view}-mobile`}.webp`;
        await page.shot(rect, file);
        const entry = media[locale][view];
        if (variant === "desktop") Object.assign(entry, { desktop: `/product-media/${locale}/${view}.webp`, width: rect.width * 2, height: rect.height * 2 });
        else Object.assign(entry, { mobile: `/product-media/${locale}/${view}-mobile.webp`, mobileWidth: rect.width * 2, mobileHeight: rect.height * 2 });
        console.log(`${file} ${rect.width * 2}×${rect.height * 2}`);
      };
      // The deadline card down to its date line, without the actions below it.
      const heroRect = `(() => { const card = document.querySelector(".hero-card"); const date = card?.querySelector(":scope > p"); if (!card || !date) return null; card.scrollIntoView({ block: "center" }); const c = card.getBoundingClientRect(), d = date.getBoundingClientRect(); return { x: Math.round(c.x + scrollX), y: Math.round(c.y + scrollY), width: Math.round(c.width), height: Math.round(d.bottom - c.top + 24) }; })()`;
      await capture(heroRect, "overview", label);
      if (label === "mobile") {
        await page.evaluate(clickText(messages[locale]["nav.grades"])); await wait(2000);
        await page.evaluate(`document.querySelector("details.subject-averages")?.setAttribute("open", "")`); await wait(500);
        await capture(rectOf(`document.querySelector(".grade-overview")`), "grades", "mobile");
        await page.go("/app");
        await page.evaluate(clickText(copy[locale].noteTitle)); await wait(2500);
        await page.evaluate(clickText(messages[locale]["notes.done"])); await wait(1500);
        await capture(rectOf(`document.querySelector(".notes-reader")`), "notes", "mobile");
        // Grades and notes stay compact on desktop too, so they remain legible.
        for (const view of ["grades", "notes"]) Object.assign(media[locale][view], { desktop: media[locale][view].mobile, width: media[locale][view].mobileWidth, height: media[locale][view].mobileHeight });
      }
      await page.close();
    }
  }
  if (!EXPLORE) await writeFile("lib/product-media.json", `${JSON.stringify(media, null, 2)}\n`);
} finally { await browser.close(); }
