"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { DraftAutosaver } from "@/lib/notes/autosave";
import { NOTES_FLUSH_EVENT } from "@/lib/notes/flush";

export function useNoteAutosave(save: () => Promise<void>, onStatus: (status: "saving" | "device" | "error", error?: unknown) => void, initiallySaved: boolean) {
  const callbacks = useRef({ save, onStatus });
  useEffect(() => { callbacks.current = { save, onStatus }; }, [save, onStatus]);
  const [saver] = useState(() => new DraftAutosaver(save, initiallySaved));
  useEffect(() => { saver.setSave(save); }, [saver, save]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const flush = useCallback(async (force = false) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    try {
      const pending = saver.dirty || force;
      await saver.flush(force);
      if (pending && mounted.current) callbacks.current.onStatus("device");
    } catch (error) {
      if (mounted.current) callbacks.current.onStatus("error", error);
      throw error;
    }
  }, [saver]);
  const changed = useCallback(() => {
    saver.changed(); callbacks.current.onStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush().catch(() => undefined); }, 700);
  }, [flush, saver]);
  useEffect(() => {
    mounted.current = true;
    const before = (event: BeforeUnloadEvent) => {
      if (saver.dirty) { event.preventDefault(); event.returnValue = ""; }
    };
    const hidden = () => { if (document.visibilityState === "hidden") void flush().catch(() => undefined); };
    const onFlush = (event: Event) => { (event as CustomEvent<Promise<void>[]>).detail.push(flush()); };
    window.addEventListener("beforeunload", before);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener(NOTES_FLUSH_EVENT, onFlush);
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (saver.dirty) void flush().catch(() => undefined);
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener(NOTES_FLUSH_EVENT, onFlush);
    };
  }, [flush, saver]);
  const dirty = useCallback(() => saver.isDirty(), [saver]);
  return { changed, flush, dirty };
}
