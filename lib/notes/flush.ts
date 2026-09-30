export const NOTES_FLUSH_EVENT = "ipagell-notes-flush";

export async function flushOpenNotes(): Promise<void> {
  const tasks: Promise<void>[] = [];
  window.dispatchEvent(new CustomEvent(NOTES_FLUSH_EVENT, { detail: tasks }));
  await Promise.all(tasks);
}
