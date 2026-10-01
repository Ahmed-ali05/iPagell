/** One writer per open editor. A flush includes edits made while saving. */
export class DraftAutosaver {
  private edited = 0;
  private committed = 0;
  private persisted: boolean;
  private running: Promise<void> | null = null;

  constructor(private save: () => Promise<void>, initiallySaved = false) {
    this.persisted = initiallySaved;
  }

  setSave(save: () => Promise<void>) { this.save = save; }

  get dirty() { return this.edited !== this.committed; }
  isDirty() { return this.dirty; }
  changed() { this.edited++; }

  flush(force = false): Promise<void> {
    if (force && !this.persisted && !this.dirty) this.changed();
    if (this.running) return this.running;
    if (!this.dirty) return Promise.resolve();
    // Start in a microtask so concurrent callers share the same promise.
    const task = Promise.resolve().then(async () => {
      while (this.dirty) {
        const version = this.edited;
        await this.save();
        this.committed = version;
        this.persisted = true;
      }
    });
    this.running = task.finally(() => { this.running = null; });
    return this.running;
  }
}

/** UI refresh is best effort after the durable commit; preserve its result. */
export async function persistAndNotify<T>(write: () => Promise<T>, notify: () => Promise<void>, failed: (error: unknown) => void): Promise<T> {
  const result = await write();
  try { await notify(); } catch (error) { failed(error); }
  return result;
}
