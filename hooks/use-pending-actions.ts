"use client";
import { useEffect, useState } from "react";
import { PendingActions } from "@/lib/classes/pending-actions";

export function usePendingActions() {
  const [keys, setKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [actions] = useState(() => new PendingActions(setKeys));
  useEffect(() => {
    actions.setListener(setKeys);
    return () => actions.setListener(() => undefined);
  }, [actions]);

  return {
    has: (key: string) => keys.has(key),
    run: <T,>(key: string, work: () => Promise<T>, conflicts?: (active: string) => boolean) => actions.run(key, work, conflicts),
  };
}
export type PendingActionController = ReturnType<typeof usePendingActions>;
