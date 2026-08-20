"use client";

import { useSyncExternalStore } from "react";
import { gentleTonesStore, type ScoringMode } from "@/lib/tonePref";

/**
 * Reads the gentle-tones preference for a mode without calling setState
 * inside an effect (the pattern eslint rejects — see MicPractice.tsx:53).
 */
export function useGentleTones(mode: ScoringMode): boolean {
  const store = gentleTonesStore(mode);
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}
