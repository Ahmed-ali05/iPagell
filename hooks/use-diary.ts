"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createDiarySession } from "@/lib/diary-session";
export type { SyncStatus } from "@/lib/diary-session";

export function useDiary() {
  const [session] = useState(() => createDiarySession());
  const state = useSyncExternalStore(session.subscribe, session.getState, session.getState);
  useEffect(() => {
    void session.reload().catch(() => undefined);
    const retry = () => { void session.retry().catch(() => undefined); };
    const visibility = () => { if (document.visibilityState === "visible") retry(); };
    window.addEventListener("online", retry);
    window.addEventListener("storage", session.accountChanged);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      session.cancelPending();
      window.removeEventListener("online", retry);
      window.removeEventListener("storage", session.accountChanged);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [session]);
  return { ...state, ...session };
}
