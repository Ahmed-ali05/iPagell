import assert from "node:assert/strict";
import { test } from "node:test";
import { IDBFactory } from "fake-indexeddb";
import { emptyPublicNote, readPublicNote, savePublicNote, PublicNoteConflict, PUBLIC_NOTES_DB, publicNoteFilename, publicNoteMarkdown } from "../lib/public-notes";
import { parseNote, serializeNote } from "../lib/notes/format";
import { restoreCalculatorGrades } from "../lib/grade-average-calculator";
import { CURRENT_GRADING_SYSTEM } from "../lib/grading";
import { publicSpaceMetadata } from "../lib/i18n/public-page";
import { publicDiaryPaths, publicNotesPaths } from "../lib/i18n/public-routes";
import sitemap from "../app/sitemap";

const draft = (title = "Una prova") => ({ ...emptyPublicNote(), title, content: "## Un’idea\nUn **pensiero** da ricordare.", updatedAt: 1234 });

test("guest draft survives a new reader and cannot overwrite a newer tab", async () => {
  const factory = new IDBFactory();
  assert.deepEqual(await readPublicNote(factory), emptyPublicNote());
  const first = await savePublicNote(draft(), 0, factory);
  assert.equal(first.revision, 1);
  assert.deepEqual(await readPublicNote(factory), first);
  const outcomes = await Promise.allSettled([savePublicNote(draft("A"), 1, factory), savePublicNote(draft("B"), 1, factory)]);
  assert.equal(outcomes.filter(result => result.status === "fulfilled").length, 1);
  const rejected = outcomes.find(result => result.status === "rejected") as PromiseRejectedResult;
  assert.ok(rejected.reason instanceof PublicNoteConflict);
  assert.equal((await readPublicNote(factory)).revision, 2);
  await assert.rejects(savePublicNote(emptyPublicNote(), 1, factory), PublicNoteConflict);
  assert.equal((await readPublicNote(factory)).revision, 2);
  const reset = await savePublicNote(emptyPublicNote(), 2, factory);
  assert.equal(reset.revision, 3);
  assert.equal((await readPublicNote(factory)).content, "");
});

test("invalid and unreadable drafts are rejected rather than replaced", async () => {
  const factory = new IDBFactory();
  await assert.rejects(savePublicNote({ ...draft(), content: "a".repeat(20_001) }, 0, factory));
  await assert.rejects(savePublicNote({ ...draft(), title: "a".repeat(121) }, 0, factory));
  const db = await new Promise<IDBDatabase>((resolve, reject) => { const req = factory.open(PUBLIC_NOTES_DB, 1); req.onupgradeneeded = () => req.result.createObjectStore("draft"); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
  await new Promise<void>((resolve, reject) => { const tx = db.transaction("draft", "readwrite"); tx.objectStore("draft").put({ broken: true }, "current"); tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); });
  db.close();
  await assert.rejects(readPublicNote(factory));
  await assert.rejects(savePublicNote(draft(), 0, factory));
  await assert.rejects(readPublicNote(factory));
});

test("Markdown preserves formatting while escaping literal markup and multiline lists", () => {
  const note = { ...draft("Idea #1"), subjectName: "A&B", content: serializeNote(parseNote("plain", "- literal\n1. literal\n<script>alert(1)</script>")) };
  const result = publicNoteMarkdown(note, "Untitled");
  assert.ok(result.startsWith("# Idea \\#1\n\nA&amp;B\n\n"));
  assert.ok(result.includes("\\- literal"));
  assert.ok(result.includes("1\\. literal"));
  assert.ok(!result.includes("<script>"));
  assert.ok(publicNoteMarkdown(draft(), "Untitled").includes("## Un’idea\n\nUn **pensiero**"));
  assert.ok(publicNoteMarkdown({ ...draft(), content: "- first\\\nsecond" }, "Untitled").includes("- first  \n  second"));
  assert.equal(publicNoteFilename("  ../a:b  ", "md"), ".._a_b.md");
  assert.equal(publicNoteFilename("", "pdf"), "iPagell.pdf");
});

test("calculator restores validated entered values instead of trusting cached results", () => {
  const result = restoreCalculatorGrades([{ entered: "5,5", enteredWeight: "2", value: 999, weight: -1 }, { entered: "8", enteredWeight: "1" }, null], CURRENT_GRADING_SYSTEM);
  assert.deepEqual(result, [{ id: "restored-0", entered: "5,5", enteredWeight: "2", value: 5.5, weight: 2 }]);
  assert.deepEqual(restoreCalculatorGrades({}, CURRENT_GRADING_SYSTEM), []);
});

test("public spaces have localized canonicals, preview noindex and sixteen sitemap URLs", async () => {
  const urls = sitemap().map(entry => entry.url);
  assert.equal(new Set(urls).size, 16);
  for (const section of ["notes", "diary"] as const) for (const locale of ["it", "de", "fr", "en"] as const) {
    const paths = section === "notes" ? publicNotesPaths : publicDiaryPaths;
    const metadata = await publicSpaceMetadata(locale, section, false);
    assert.equal(metadata.alternates?.canonical, paths[locale]);
    assert.deepEqual(metadata.robots, { index: false, follow: false });
    assert.ok(urls.includes(`https://ipagell.website${paths[locale]}`));
    assert.equal(Object.keys(metadata.alternates?.languages ?? {}).length, 9);
  }
});
