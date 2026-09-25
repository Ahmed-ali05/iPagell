import type { ClassSubscription } from "./events";

type SubscriptionResponse = { subscriptions: ClassSubscription[] };
type MutationTarget = { kind: "subscription" | "event"; id: string };

// A mutation response is a full snapshot, but only its target is applied while
// requests can overlap. A final GET reconciles changes made elsewhere as well.
export function mergeMutationTarget(current: ClassSubscription[], response: ClassSubscription[], target: MutationTarget) {
  const matches = (item: ClassSubscription) => target.kind === "event" ? item.event.id === target.id : item.id === target.id;
  const updated = response.find(matches);
  return updated ? current.some(matches) ? current.map(item => matches(item) ? updated : item) : [...current, updated]
    : current.filter(item => !matches(item));
}

export class ClassAgendaCoordinator {
  private pending = new Map<string, Promise<boolean>>();
  private blocked = new Set<string>();
  private writes = 0;
  private sequence = 0;
  private idleWaiters: Array<() => void> = [];

  constructor(private io: {
    read: () => Promise<SubscriptionResponse>;
    write: (path: string, method: string, body: unknown) => Promise<SubscriptionResponse>;
    current: () => ClassSubscription[];
    publish: (items: ClassSubscription[]) => void;
    readError: (error: unknown) => void;
    pendingChanged: (keys: ReadonlySet<string>) => void;
  }) {}

  connect(handlers: Pick<typeof this.io, "current" | "publish" | "readError" | "pendingChanged">) {
    this.io = { ...this.io, ...handlers };
  }

  hasPending(key: string) { return this.pending.has(key); }
  isBlocked(key: string) { return this.blocked.has(key); }
  invalidate() { ++this.sequence; }

  async refresh() {
    const ticket = ++this.sequence;
    if (this.writes) return;
    try {
      const result = await this.io.read();
      if (ticket !== this.sequence || this.writes) return;
      this.blocked.clear();
      this.io.publish(result.subscriptions);
    } catch (error) {
      if (ticket !== this.sequence || this.writes) return;
      this.io.readError(error);
    }
    this.idleWaiters.splice(0).forEach(resolve => resolve());
  }

  run(key: string, target: MutationTarget, path: string, method: string, body: unknown): Promise<boolean> {
    const existing = this.pending.get(key);
    if (existing) return Promise.resolve(false);
    if (this.blocked.has(key)) return Promise.reject(new Error("Aggiorna l’agenda prima di riprovare."));
    if (target.kind === "subscription") {
      const revision = (body as { revision?: number }).revision;
      const current = this.io.current().find(item => item.id === target.id);
      if (!current || current.revision !== revision) return Promise.reject(new Error("Attività aggiornata. Riapri la versione corrente."));
    }
    if (target.kind === "event" && this.io.current().some(item => item.event.id === target.id))
      return Promise.reject(new Error("Evento già aggiunto all’agenda."));
    ++this.writes;
    ++this.sequence;
    const task = Promise.resolve().then(async () => {
      try {
        const result = await this.io.write(path, method, body);
        this.io.publish(mergeMutationTarget(this.io.current(), result.subscriptions, target));
        return true;
      } catch (error) {
        this.blocked.add(key);
        throw error;
      } finally {
        const reconciled = new Promise<void>(resolve => this.idleWaiters.push(resolve));
        --this.writes;
        if (this.writes === 0) void this.refresh();
        await reconciled;
        this.pending.delete(key);
        this.io.pendingChanged(new Set(this.pending.keys()));
      }
    });
    this.pending.set(key, task);
    this.io.pendingChanged(new Set(this.pending.keys()));
    return task;
  }
}
