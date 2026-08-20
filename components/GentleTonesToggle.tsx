"use client";

import { setGentleTones } from "@/lib/tonePref";
import { useGentleTones } from "./useGentleTones";

/**
 * Strictness switch for the grown-up practice cards. Off (strict) by
 * default — an adult learner should drill tones — but it can be relaxed.
 */
export default function GentleTonesToggle() {
  const gentle = useGentleTones("adult");
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
      <input
        type="checkbox"
        checked={gentle}
        onChange={(e) => setGentleTones("adult", e.target.checked)}
        className="h-4 w-4"
      />
      Gentle tones — count the right sounds as a match even when tones are off
    </label>
  );
}
