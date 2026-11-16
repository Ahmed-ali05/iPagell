import { z } from "zod";
import { parseNote, serializeNote, type Inline } from "./notes/format";

const draftSchema = z.object({
  version: z.literal(1), revision: z.number().int().nonnegative(),
  title: z.string().max(120), subjectName: z.string().max(120),
  contentFormat: z.literal("md-lite-v1"),
  content: z.string().refine(value => [...value].length <= 20_000),
  updatedAt: z.number().finite().nonnegative(),
}).strict().refine(value => {
  try { return serializeNote(parseNote(value.contentFormat, value.content)) === value.content; }
  catch { return false; }
});

export type PublicNote = z.infer<typeof draftSchema>;
export const PUBLIC_NOTES_DB = "ipagell-public-notes-v1";
export class PublicNoteConflict extends Error { constructor() { super("PUBLIC_NOTE_CONFLICT"); } }
export function emptyPublicNote(): PublicNote {
  return { version: 1, revision: 0, title: "", subjectName: "", contentFormat: "md-lite-v1", content: "", updatedAt: 0 };
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(PUBLIC_NOTES_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("draft");
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("PUBLIC_NOTE_BLOCKED"));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function readPublicNote(factory: IDBFactory = indexedDB): Promise<PublicNote> {
  const db = await openDatabase(factory);
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("draft", "readonly");
      const request = transaction.objectStore("draft").get("current");
      transaction.oncomplete = () => {
        try { resolve(request.result === undefined ? emptyPublicNote() : draftSchema.parse(request.result)); }
        catch (error) { reject(error); }
      };
      transaction.onabort = () => reject(transaction.error ?? new Error("PUBLIC_NOTE_READ_FAILED"));
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

/** Atomic comparison and write: another tab cannot silently replace this draft. */
export async function savePublicNote(note: PublicNote, expectedRevision: number, factory: IDBFactory = indexedDB): Promise<PublicNote> {
  const next = draftSchema.parse({ ...note, revision: expectedRevision + 1 });
  const db = await openDatabase(factory);
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("draft", "readwrite");
      const store = transaction.objectStore("draft");
      const request = store.get("current");
      let failure: unknown;
      request.onsuccess = () => {
        try {
          const current = request.result === undefined ? emptyPublicNote() : draftSchema.parse(request.result);
          if (current.revision !== expectedRevision) throw new PublicNoteConflict();
          store.put(next, "current");
        } catch (error) { failure = error; transaction.abort(); }
      };
      transaction.oncomplete = () => resolve(next);
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error("PUBLIC_NOTE_SAVE_FAILED"));
      transaction.onerror = () => { failure ??= transaction.error; };
    });
  } finally { db.close(); }
}

export function publicNoteFilename(title: string, extension: "pdf" | "md") {
  return `${title.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 80) || "iPagell"}.${extension}`;
}

const markdownText = (text: string) => text.replace(/&/g, "&amp;").replace(/[\\`*_[\]{}<>#~+.!-]/g, "\\$&");
export function publicNoteMarkdown(note: PublicNote, fallbackTitle: string): string {
  const inline = (parts: Inline[]): string => parts.map(part => part.type === "break" ? "  \n"
    : part.type === "strong" ? `**${markdownText(part.text)}**` : markdownText(part.text)).join("");
  const body = parseNote(note.contentFormat, note.content).blocks.map(block => {
    if (block.type === "bullet_list" || block.type === "ordered_list") return block.items.map((item, index) => `${block.type === "bullet_list" ? "-" : `${index + 1}.`} ${inline(item).replace(/\n/g, block.type === "bullet_list" ? "\n  " : `\n${" ".repeat(String(index + 1).length + 2)}`)}`).join("\n");
    return `${block.type === "section_heading" ? "## " : ""}${inline(block.content)}`;
  }).join("\n\n");
  return [`# ${markdownText(note.title.trim() || fallbackTitle)}`, note.subjectName.trim() ? markdownText(note.subjectName.trim()) : "", body].filter(Boolean).join("\n\n") + "\n";
}
