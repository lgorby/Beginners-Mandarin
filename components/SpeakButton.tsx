"use client";

import { useState } from "react";
import { speak } from "@/lib/speech";

/** Plays Mandarin text through the speakers. Long-press-free: two buttons,
 * normal speed and slow speed. */
export default function SpeakButton({
  text,
  size = "md",
  showSlow = false,
}: {
  text: string;
  size?: "sm" | "md" | "lg";
  showSlow?: boolean;
}) {
  const [speaking, setSpeaking] = useState(false);

  const play = (rate: number) => {
    setSpeaking(true);
    speak(text, { rate });
    // speechSynthesis has no reliable end event across browsers for our
    // cancel-then-speak pattern; just reset the visual state shortly after.
    setTimeout(() => setSpeaking(false), 600);
  };

  const sizeClasses =
    size === "sm"
      ? "h-8 w-8 text-base"
      : size === "lg"
        ? "h-14 w-14 text-2xl"
        : "h-10 w-10 text-lg";

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => play(0.85)}
        aria-label={`Play pronunciation of ${text}`}
        className={`${sizeClasses} inline-flex items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 active:scale-95 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900 ${speaking ? "ring-2 ring-red-300" : ""}`}
      >
        🔊
      </button>
      {showSlow && (
        <button
          type="button"
          onClick={() => play(0.5)}
          aria-label={`Play slowly: ${text}`}
          title="Play slowly"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-sm text-amber-600 transition hover:bg-amber-100 active:scale-95 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
        >
          🐢
        </button>
      )}
    </span>
  );
}
