"use client";

import { createClientStore } from "./clientStore";

export type ScoringMode = "kid" | "adult";

/**
 * Gentle scoring celebrates right sounds and coaches tones playfully;
 * strict requires the tones. Five-year-olds default to gentle — native
 * Chinese children don't stabilise tone production until around six or
 * seven — while adults default to strict, because a grown-up learner
 * should drill tones from day one. Each mode remembers its own switch.
 */
const DEFAULTS: Record<ScoringMode, boolean> = { kid: true, adult: false };

function makeStore(mode: ScoringMode) {
  const key = `mandarin-gentle-tones-${mode}-v1`;
  const read = (): boolean => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? DEFAULTS[mode] : v === "1";
    } catch {
      return DEFAULTS[mode];
    }
  };
  return { key, store: createClientStore<boolean>(read, DEFAULTS[mode]) };
}

const stores: Record<ScoringMode, ReturnType<typeof makeStore>> = {
  kid: makeStore("kid"),
  adult: makeStore("adult"),
};

export function gentleTonesStore(mode: ScoringMode) {
  return stores[mode].store;
}

export function setGentleTones(mode: ScoringMode, gentle: boolean): void {
  try {
    localStorage.setItem(stores[mode].key, gentle ? "1" : "0");
  } catch {
    // preference just won't persist
  }
  stores[mode].store.set(gentle);
}
