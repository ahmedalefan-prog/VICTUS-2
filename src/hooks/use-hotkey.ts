"use client";

import { useEffect } from "react";

type Modifier = "ctrl" | "meta" | "shift" | "alt";

export function useHotkey(
  keys: { key: string; modifiers?: Modifier[] },
  callback: () => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const { key, modifiers = [] } = keys;
      const matchMods = modifiers.every((m) => {
        if (m === "ctrl") return e.ctrlKey;
        if (m === "meta") return e.metaKey;
        if (m === "shift") return e.shiftKey;
        if (m === "alt") return e.altKey;
        return false;
      });

      if (e.key.toLowerCase() === key.toLowerCase() && matchMods) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.key, JSON.stringify(keys.modifiers), callback, enabled]);
}
