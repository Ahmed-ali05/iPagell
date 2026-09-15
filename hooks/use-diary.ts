"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { diarySchema, type Registration } from "@/lib/validation";
import {
  activeAccountId,
  forgetLocal,
  readLocal,
  saveLocal,
  type LocalDiary,
} from "@/lib/account-storage";
import type {
  AccountIdentity,
  DiarySnapshot,
  Preferences,
  SchoolData,
} from "@/types/domain";

export type SyncStatus =
  "saved" | "saving" | "offline" | "conflict" | "error" | "expired";
type State = {
  phase: "loading" | "anonymous" | "onboarding" | "ready" | "error";
  user: AccountIdentity | null;
  diary: LocalDiary | null;
  error: string;
  status: SyncStatus;
};
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    signal: AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(
      response.status === 200 ? 502 : response.status,
      "Risposta del server non valida. Riprova online.",
    );
  const value = (await response.json()) as {
    error?: string;
    user: AccountIdentity;
    diary: DiarySnapshot | null;
    revision: number;
  };
  if (!response.ok)
    throw new ApiError(response.status, value.error ?? "Accesso richiesto");
  return value;
}

export function useDiary() {
  const [state, setState] = useState<State>({
    phase: "loading",
    user: null,
    diary: null,
    error: "",
    status: "saved",
  });
  const current = useRef<LocalDiary | null>(null);
  const status = useRef<SyncStatus>("saved");
  const queue = useRef(Promise.resolve());
  const setStatus = useCallback((value: SyncStatus) => {
    status.current = value;
    setState((s) => ({ ...s, status: value }));
  }, []);
  const publish = useCallback((value: LocalDiary) => {
    current.current = value;
    setState((s) => ({
      ...s,
      phase: "ready",
      user: value.user,
      diary: value,
      error: "",
    }));
  }, []);
  const sync = useCallback(async () => {
    const local = current.current;
    if (
      !local?.dirty ||
      status.current === "conflict" ||
      status.current === "expired"
    )
      return;
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    setStatus("saving");
    try {
      const result = await api("/api/diary", {
        method: "PUT",
        body: JSON.stringify({
          expectedUserId: local.user.id,
          revision: local.revision,
          diary: { data: local.data, preferences: local.preferences },
        }),
      });
      const saved = { ...local, dirty: false, revision: result.revision };
      await saveLocal(saved);
      publish(saved);
      setStatus("saved");
    } catch (error) {
      setStatus(
        error instanceof ApiError
          ? error.status === 409
            ? "conflict"
            : error.status === 401
              ? "expired"
              : "error"
          : "offline",
      );
    }
  }, [publish, setStatus]);
  const load = useCallback(async () => {
    setState((s) => ({
      ...s,
      phase: s.phase === "ready" ? "ready" : "loading",
      error: "",
    }));
    try {
      const result = (await api("/api/account")) as {
        user: AccountIdentity;
        diary: DiarySnapshot | null;
      };
      if (!result.diary) {
        current.current = null;
        localStorage.removeItem("ipagell-active-account-v2");
        setState({
          phase: "onboarding",
          user: result.user,
          diary: null,
          error: "",
          status: "saved",
        });
        return;
      }
      const cached = await readLocal(result.user.id);
      if (cached?.dirty) {
        publish({ ...cached, user: result.user });
        if (cached.revision !== result.diary.revision) setStatus("conflict");
        else {
          setStatus("offline");
          await sync();
        }
      } else {
        const local = { ...result.diary, user: result.user, dirty: false };
        await saveLocal(local);
        publish(local);
        setStatus("saved");
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await forgetLocal();
        current.current = null;
        setState({
          phase: "anonymous",
          user: null,
          diary: null,
          error: "",
          status: "saved",
        });
        return;
      }
      // Only a network failure may open the last active device copy. Server-side
      // failures and authentication rejections must not become offline logins.
      const id = activeAccountId();
      const cached =
        !(error instanceof ApiError) && id
          ? await readLocal(id).catch(() => null)
          : null;
      if (cached) {
        publish(cached);
        setStatus("offline");
      } else
        setState((s) => ({
          ...s,
          phase: "error",
          error:
            "Impossibile aprire il diario. Controlla la connessione o lo spazio del dispositivo.",
        }));
    }
  }, [publish, setStatus, sync]);
  useEffect(() => {
    void load();
  }, [load]);

  const enqueue = useCallback((work: () => Promise<void>) => {
    const next = queue.current.then(work);
    queue.current = next.catch(() => undefined);
    return next;
  }, []);
  useEffect(() => {
    const retry = () => {
      void enqueue(async () => {
        if (current.current?.dirty) await sync();
        else if (current.current) await load();
      });
    };
    const reconnect = () => retry();
    const visibility = () => {
      if (document.visibilityState === "visible") retry();
    };
    window.addEventListener("online", reconnect);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("online", reconnect);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [enqueue, load, sync]);

  const commit = useCallback(
    (recipe: (data: SchoolData) => SchoolData, patch?: Partial<Preferences>) =>
      enqueue(async () => {
        const local = current.current;
        if (!local) throw new Error("Apri prima un diario");
        if (status.current === "expired")
          throw new Error("Accedi di nuovo prima di modificare il diario");
        const data = {
          ...recipe(local.data),
          updatedAt: new Date().toISOString(),
        };
        const preferences = { ...local.preferences, ...patch };
        if (!data.semesters.some((s) => s.id === preferences.currentSemesterId))
          preferences.currentSemesterId = data.semesters[0]?.id ?? "";
        const parsed = diarySchema.safeParse({ data, preferences });
        if (!parsed.success)
          throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
        const next = { ...local, ...parsed.data, dirty: true };
        await saveLocal(next);
        publish(next);
        await sync();
      }),
    [enqueue, publish, sync],
  );

  const register = useCallback(
    async (input: Registration) => {
      const result = await api("/api/account", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const local = {
        ...result.diary,
        user: result.user,
        dirty: false,
      } as LocalDiary;
      await saveLocal(local);
      publish(local);
      setStatus("saved");
    },
    [publish, setStatus],
  );
  const useServer = useCallback(
    () =>
      enqueue(async () => {
        const result = await api("/api/account");
        if (!result.diary || result.user.id !== current.current?.user.id)
          throw new Error("Accedi allo stesso account");
        const next = { ...result.diary, user: result.user, dirty: false };
        await saveLocal(next);
        publish(next);
        setStatus("saved");
      }),
    [enqueue, publish, setStatus],
  );
  const logout = useCallback(
    (discard = false) =>
      enqueue(async () => {
        if (current.current?.dirty && !discard)
          throw new Error(
            "Esporta prima il backup o sincronizza le modifiche in attesa.",
          );
        await api("/api/auth/logout", { method: "POST", body: "{}" });
        await forgetLocal(current.current?.user.id);
        current.current = null;
        setState({
          phase: "anonymous",
          user: null,
          diary: null,
          error: "",
          status: "saved",
        });
      }),
    [enqueue],
  );
  const reauthenticate = () => {
    setState((s) => ({ ...s, phase: "anonymous", user: null }));
  };
  return {
    ...state,
    commit,
    register,
    reload: load,
    retry: () => enqueue(sync),
    useServer,
    logout,
    reauthenticate,
  };
}
