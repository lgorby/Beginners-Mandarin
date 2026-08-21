"use client";

import { useEffect } from "react";
import { STEP_COPY, type Step } from "@/lib/steps";
import { speakEnglish } from "@/lib/speech";

/**
 * The step frame: instruction, spoken cue, Continue button. The ONLY
 * component that renders this chrome, so the five step components stay
 * thin and cannot drift apart visually.
 */
export default function StepShell({
  kind,
  children,
  onContinue,
  canContinue = true,
  continueLabel = "Next",
  narrate = true,
  spokenCue,
}: {
  kind: Step["kind"];
  children: React.ReactNode;
  onContinue: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  narrate?: boolean;
  /**
   * Extra English spoken after the instruction — the meaning cue a
   * pre-reader needs when the exercise itself is ambiguous (SWAP's
   * "Which one fits? Hello, Dad!"). Replayed with the instruction.
   */
  spokenCue?: string;
}) {
  const copy = STEP_COPY[kind];
  const line = spokenCue ? `${copy.text} ${spokenCue}` : copy.text;

  // Speak the instruction so a pre-reader can follow the app.
  useEffect(() => {
    if (narrate) speakEnglish(line);
  }, [line, narrate]);

  return (
    <div className="flex flex-1 flex-col items-center justify-between gap-6 px-4 py-6">
      <button
        type="button"
        onClick={() => speakEnglish(line)}
        className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-lg font-semibold dark:bg-zinc-800"
      >
        <span aria-hidden>{copy.icon}</span>
        {copy.text}
        <span aria-hidden>🔊</span>
      </button>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
        {children}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full max-w-sm rounded-full bg-red-600 px-8 py-5 text-xl font-bold text-white transition active:scale-95 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        {continueLabel}
      </button>
    </div>
  );
}
