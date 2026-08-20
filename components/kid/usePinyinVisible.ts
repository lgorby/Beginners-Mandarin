"use client";

import { useSyncExternalStore } from "react";
import {
  getPinyinServerSnapshot,
  getPinyinSnapshot,
  subscribePinyin,
} from "@/lib/pinyinPref";

/**
 * Reads the pinyin preference without calling setState inside an effect
 * (the pattern eslint rejects — see MicPractice.tsx:53).
 */
export function usePinyinVisible(): boolean {
  return useSyncExternalStore(
    subscribePinyin,
    getPinyinSnapshot,
    getPinyinServerSnapshot
  );
}
