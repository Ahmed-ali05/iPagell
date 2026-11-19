import { LabError } from "./source";

type WorkerLike = Pick<Worker, "postMessage" | "terminate" | "onmessage" | "onerror">;
export class Jobs {
  private serial = 0;
  private active?: { worker: WorkerLike; reject: (error: unknown) => void; timer: ReturnType<typeof setTimeout> };
  get busy(): boolean { return !!this.active; }
  cancel(): void {
    this.serial++;
    const active = this.active; this.active = undefined;
    if (active) { clearTimeout(active.timer); active.worker.terminate(); active.reject(new LabError("CANCELLED", "Elaborazione annullata.")); }
  }
  run<T>(factory: () => WorkerLike, payload: object, progress: (data: Record<string, unknown>) => void, timeout = 120_000, deadline?: (data: Record<string, unknown>) => number | undefined): Promise<T> {
    if (this.active) return Promise.reject(new LabError("BUSY", "È già in corso un’elaborazione."));
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      const worker = factory();
      const finish = () => { if (this.active?.worker === worker) { clearTimeout(this.active.timer); this.active = undefined; } worker.terminate(); };
      const expire = () => { if (id === this.serial) { this.serial++; finish(); reject(new LabError("TIMEOUT", "Tempo massimo raggiunto. Riduci il materiale oppure usa la ricerca testuale.")); } };
      const timer = setTimeout(expire, timeout);
      this.active = { worker, reject, timer };
      worker.onmessage = event => {
        if (id !== this.serial || event.data.jobId !== id) return;
        if (event.data.type === "progress") {
          const budget = deadline?.(event.data);
          if (budget !== undefined && this.active?.worker === worker) { clearTimeout(this.active.timer); this.active.timer = setTimeout(expire, budget); }
          progress(event.data); return;
        }
        finish();
        if (event.data.type === "error") reject(new LabError(event.data.code, event.data.message));
        else resolve(event.data.result as T);
      };
      worker.onerror = () => { if (id === this.serial) { finish(); reject(new LabError("WORKER", "Il motore si è fermato. Riprova o usa la ricerca testuale.")); } };
      try { worker.postMessage({ ...payload, jobId: id }); }
      catch { finish(); reject(new LabError("WORKER", "Invio al motore non riuscito. Riprova con meno materiale.")); }
    });
  }
}
