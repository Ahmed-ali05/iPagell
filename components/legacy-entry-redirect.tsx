"use client";

import { useEffect } from "react";

const appParameters = new Set(["view", "action", "source"]);

export function LegacyEntryRedirect() {
  useEffect(() => {
    const current = new URL(window.location.href);
    const hasAppQuery = [...current.searchParams.keys()].some((key) =>
      appParameters.has(key),
    );
    if (!hasAppQuery && !current.hash.includes("join=")) return;
    window.location.replace(`/app${current.search}${current.hash}`);
  }, []);

  return null;
}
