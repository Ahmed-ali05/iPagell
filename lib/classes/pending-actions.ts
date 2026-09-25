export class PendingActions {
  private keys = new Set<string>();

  constructor(private changed: (keys: ReadonlySet<string>) => void = () => undefined) {}

  has(key: string) { return this.keys.has(key); }

  begin(key: string, conflicts?: (active: string) => boolean) {
    if (this.keys.has(key) || (conflicts && [...this.keys].some(conflicts))) return false;
    this.keys.add(key);
    this.changed(new Set(this.keys));
    return true;
  }

  end(key: string) {
    if (!this.keys.delete(key)) return;
    this.changed(new Set(this.keys));
  }

  async run<T>(key: string, work: () => Promise<T>, conflicts?: (active: string) => boolean): Promise<{ started: true; value: T } | { started: false }> {
    if (!this.begin(key, conflicts)) return { started: false };
    try { return { started: true, value: await work() }; }
    finally { this.end(key); }
  }

  setListener(changed: (keys: ReadonlySet<string>) => void) { this.changed = changed; }
}
