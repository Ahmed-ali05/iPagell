import { diarySchema, type Registration } from "./validation";
import { activeAccountId, activateAccount, forgetLocal, readLocal, saveLocal, sameLocal, LocalConflictError, type LocalDiary } from "./account-storage";
import { requestJson, RequestError } from "./client-http";
import type { AccountIdentity, DiarySnapshot, Preferences, SchoolData } from "@/types/domain";

export type SyncStatus = "saved" | "saving" | "offline" | "conflict" | "device-conflict" | "error" | "expired";
export type DiaryState = {
  phase: "loading" | "anonymous" | "onboarding" | "ready" | "error";
  user: AccountIdentity | null;
  diary: LocalDiary | null;
  error: string;
  status: SyncStatus;
};
type AccountResult = { user: AccountIdentity; diary: DiarySnapshot | null };
type Dependencies = {
  request: typeof requestJson;
  read: typeof readLocal;
  save: typeof saveLocal;
  forget: typeof forgetLocal;
  active: typeof activeAccountId;
  activate: typeof activateAccount;
  online: () => boolean;
};
const browser: Dependencies = {
  request: requestJson, read: readLocal, save: saveLocal, forget: forgetLocal,
  active: activeAccountId, activate: activateAccount, online: () => navigator.onLine,
};
const initial: DiaryState = { phase: "loading", user: null, diary: null, error: "", status: "saved" };
const sameDiary = (a: DiarySnapshot, b: DiarySnapshot) =>
  JSON.stringify({ data: a.data, preferences: a.preferences }) === JSON.stringify({ data: b.data, preferences: b.preferences });

// One queue for load, edits, sync and logout. Outside React so tests can exercise
// the actual lifecycle with delayed requests and failing storage.
export function createDiarySession(io: Dependencies = browser) {
  let state = initial;
  let queue = Promise.resolve();
  let generation = 0;
  const listeners = new Set<() => void>();
  const update = (patch: Partial<DiaryState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };
  const check = (ticket: number) => {
    if (ticket !== generation) throw new Error("La sessione è cambiata. Riprova dopo l’accesso.");
  };
  const enqueue = (work: (ticket: number) => Promise<void>) => {
    const ticket = generation;
    const next = queue.then(() => { check(ticket); return work(ticket); }).catch((error: unknown) => {
      if (ticket === generation && error instanceof LocalConflictError) fail(error);
      throw error;
    });
    queue = next.catch(() => undefined);
    return next;
  };
  const publish = (diary: LocalDiary, status: SyncStatus) =>
    update({ phase: "ready", user: diary.user, diary, error: "", status });
  const fail = (error: unknown) => {
    const status: SyncStatus = error instanceof LocalConflictError ? "device-conflict"
      : error instanceof RequestError ? error.status === 401 ? "expired" : error.status === 409 ? "conflict" : "error"
      : "error";
    update({ status, error: error instanceof Error ? error.message : "Archivio locale non disponibile. Riprova senza chiudere il modulo." });
  };
  async function account(ticket: number) {
    const result = await io.request<AccountResult>("/api/account");
    check(ticket);
    if (!result.user?.id || !result.user.username || result.diary === undefined || (result.diary &&
      (!Number.isSafeInteger(result.diary.revision) || result.diary.revision < 1 || !diarySchema.safeParse({ data: result.diary.data, preferences: result.diary.preferences }).success)))
      throw new RequestError(502, "Risposta del server non valida. Riprova online.");
    return result;
  }
  async function sync(ticket: number) {
    const local = state.diary;
    if (!local?.dirty || ["conflict", "device-conflict", "expired"].includes(state.status)) return;
    if (!io.online()) { update({ status: "offline", error: "" }); return; }
    update({ status: "saving", error: "" });
    try {
      const persisted = await io.read(local.user.id);
      check(ticket);
      if (!sameLocal(persisted, local)) throw new LocalConflictError();
      if (io.active() !== local.user.id) throw new RequestError(401, "L’account attivo è cambiato. Accedi di nuovo.");
      let revision: number;
      try {
        const result = await io.request<{ revision: number }>("/api/diary", {
          method: "PUT", body: JSON.stringify({ expectedUserId: local.user.id, revision: local.revision, diary: { data: local.data, preferences: local.preferences } }),
        });
        check(ticket);
        if (result.revision !== local.revision + 1) throw new RequestError(502, "Conferma di salvataggio non valida. Riprova.");
        revision = result.revision;
      } catch (error) {
        check(ticket);
        if (!(error instanceof RequestError)) { update({ status: "offline", error: "" }); return; }
        if (error.status !== 409) throw error;
        const remote = await account(ticket);
        if (remote.user.id !== local.user.id) throw new RequestError(401, "Accedi allo stesso account.");
        // Reconcile a lost acknowledgement only if EVERY field matches.
        if (!remote.diary || !sameDiary(local, remote.diary)) throw error;
        revision = remote.diary.revision;
      }
      const saved = { ...local, dirty: false, revision };
      await io.save(saved, local);
      check(ticket);
      publish(saved, "saved");
    } catch (error) {
      if (ticket === generation) fail(error);
    }
  }
  async function load(ticket: number) {
    update({ phase: state.diary ? "ready" : "loading", error: "" });
    let result: AccountResult;
    // Only failure of the identity request may use the offline pointer. Storage
    // failures after a successful identity response must never do so.
    try {
      result = await account(ticket);
    } catch (error) {
      if (ticket !== generation) return;
      if (error instanceof RequestError && error.status === 401) {
        try { io.activate(null); } catch { /* No offline fallback in this session. */ }
        if (state.diary) { fail(error); return; }
        update({ ...initial, phase: "anonymous" });
        return;
      }
      if (!(error instanceof RequestError)) {
        const id = io.active();
        const cached = id ? await io.read(id).catch(() => null) : null;
        if (ticket !== generation) return;
        if (cached && (!state.user || state.user.id === id)) { publish(cached, "offline"); return; }
      }
      update({ phase: state.diary ? "ready" : "error", status: "error", error: "Impossibile aggiornare il diario. Controlla la connessione e riprova. La copia già aperta è conservata." });
      return;
    }
    try {
      // Hide the previous account before touching the new account's storage.
      if (state.user?.id !== result.user.id) update({ diary: null, user: result.user, phase: "loading" });
      io.activate(result.user.id);
      if (!result.diary) {
        update({ ...initial, phase: "onboarding", user: result.user });
        return;
      }
      const cached = await io.read(result.user.id);
      check(ticket);
      if (cached && cached.revision > result.diary.revision) {
        publish(cached, "error");
        update({ error: "Un’altra scheda ha salvato dati più recenti. Aggiorna il diario per continuare." });
        return;
      }
      if (cached?.dirty && !sameDiary(cached, result.diary)) {
        publish(cached, cached.revision === result.diary.revision ? "offline" : "conflict");
        await sync(ticket);
      } else {
        const local = { ...result.diary, user: result.user, dirty: false };
        await io.save(local, cached);
        check(ticket);
        publish(local, "saved");
      }
    } catch (error) {
      if (ticket !== generation) return;
      fail(error);
      if (!state.diary) update({ phase: "error" });
    }
  }
  const reload = () => enqueue(load);
  return {
    getState: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    reload,
    retry: () => enqueue((ticket) => state.diary?.dirty ? sync(ticket) : load(ticket)),
    commit(recipe: (data: SchoolData) => SchoolData, patch?: Partial<Preferences>) {
      const userId = state.user?.id;
      return enqueue(async (ticket) => {
        const local = state.diary;
        if (!local || local.user.id !== userId) throw new Error("Apri prima lo stesso diario.");
        if (state.status === "expired" || io.active() !== userId) throw new Error("Accedi di nuovo prima di modificare il diario.");
        if (state.status === "device-conflict") throw new LocalConflictError();
        const data = { ...recipe(structuredClone(local.data)), updatedAt: new Date().toISOString() };
        const preferences = { ...local.preferences, ...patch };
        if (!data.semesters.some((s) => s.id === preferences.currentSemesterId)) preferences.currentSemesterId = data.semesters[0]?.id ?? "";
        const parsed = diarySchema.safeParse({ data, preferences });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
        const next = { ...local, ...parsed.data, dirty: true };
        try { await io.save(next, local); } catch (error) { fail(error); throw error; }
        check(ticket);
        publish(next, state.status === "conflict" ? "conflict" : "offline");
        await sync(ticket);
      });
    },
    register: (input: Registration) => enqueue(async (ticket) => {
      const userId = state.user?.id;
      if (!userId) throw new Error("Accedi prima di creare il diario.");
      const result = await io.request<AccountResult>("/api/account", { method: "POST", headers: { "X-IPagell-Account": userId }, body: JSON.stringify(input) });
      check(ticket);
      if (result.user.id !== userId || !result.diary) throw new Error("L’account è cambiato. Accedi di nuovo.");
      const cached = await io.read(userId);
      check(ticket);
      if (cached?.dirty) { await load(ticket); return; }
      const local = { ...result.diary, user: result.user, dirty: false };
      await io.save(local, cached);
      check(ticket);
      io.activate(userId);
      publish(local, "saved");
    }),
    useServer: () => enqueue(async (ticket) => {
      const local = state.diary;
      const result = await account(ticket);
      if (!local || !result.diary || result.user.id !== local.user.id) throw new Error("Accedi allo stesso account");
      const next = { ...result.diary, user: result.user, dirty: false };
      await io.save(next, local);
      check(ticket);
      publish(next, "saved");
    }),
    logout: (discard = false) => enqueue(async (ticket) => {
      const local = state.diary;
      const persisted = local ? await io.read(local.user.id) : null;
      check(ticket);
      if (!sameLocal(local, persisted)) throw new LocalConflictError();
      if (local?.dirty && !discard) throw new Error("Esporta prima il backup o sincronizza le modifiche in attesa.");
      const userId = state.user?.id;
      if (userId && io.active() !== userId) throw new RequestError(401, "L’account attivo è cambiato. Accedi di nuovo.");
      await io.request("/api/auth/logout", { method: "POST", headers: userId ? { "X-IPagell-Account": userId } : {}, body: "{}" });
      check(ticket);
      try { await io.forget(local?.user.id, local); }
      finally { if (ticket === generation) update({ ...initial, phase: "anonymous" }); }
    }),
    reauthenticate() {
      ++generation;
      update({ ...initial, phase: "anonymous" });
    },
    accountChanged() {
      if (state.user && io.active() !== state.user.id) {
        ++generation;
        fail(new RequestError(401, "L’account attivo è cambiato. Accedi di nuovo."));
      }
    },
    cancelPending() { ++generation; },
  };
}
