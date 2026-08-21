"use client";

import { useSyncExternalStore } from "react";
import {
  getKidLangServerSnapshot,
  getKidLangSnapshot,
  subscribeKidLang,
} from "@/lib/langPref";
import type { LangCode } from "@/lib/languages";

/**
 * Reads the kid path's language without calling setState inside an
 * effect (the pattern eslint rejects — see MicPractice.tsx:53).
 */
export function useKidLang(): LangCode {
  return useSyncExternalStore(
    subscribeKidLang,
    getKidLangSnapshot,
    getKidLangServerSnapshot
  );
}
