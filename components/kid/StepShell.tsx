"use client";

import { useEffect } from "react";
import Paged from "@/components/Paged";
import { STEP_COPY, type Step } from "@/lib/steps";
import { speakEnglish } from "@/lib/speech";
import { useArrowNav } from "@/lib/useArrowNav";

/**
 * The step frame: instruction, spoken cue, Previous arrow, Continue
 * button. The ONLY component that renders this chrome, so the five step
 * components stay thin and cannot drift apart visually. ArrowRight and
 * ArrowLeft drive Continue and Previous through lib/useArrowNav.ts —
 * the same keys as every grown-up pager.
 *
 * The frame is exactly one viewport tall. Instruction pill and the
 * Continue row are fixed-height rails; the step's own content is the
 * only thing that flexes, and it pages inside its box rather than
 * pushing Continue off a short screen. Sizes step down below sm: a
 * phone in landscape has ~390px of height to spend on all of this.
 */
export default function StepShell({
  kind,
  children,
  onContinue,
  onBack,
  canContinue = true,
  continueLabel = "Next",
  narrate = true,
  spokenCue,
}: {
  kind: Step["kind"];
  children: React.ReactNode;
  onContinue: () => void;
  /** Go back one step. Omitted on a lesson's first step. */
  onBack?: () => void;
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

  useArrowNav(onBack, canContinue ? onContinue : undefined);

  // Speak the instruction so a pre-reader can follow the app.
  useEffect(() => {
    if (narrate) speakEnglish(line);
  }, [line, narrate]);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-4">
      <button
        type="button"
        onClick={() => speakEnglish(line)}
        className="flex shrink-0 items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold sm:px-4 sm:py-2 sm:text-lg dark:bg-zinc-800"
      >
        <span aria-hidden>{copy.icon}</span>
        {copy.text}
        <span aria-hidden>🔊</span>
      </button>

      <Paged className="w-full min-h-0 flex-1">
        <div className="my-auto flex w-full flex-col items-center gap-2 sm:gap-4">
          {children}
        </div>
      </Paged>

      <div className="flex w-full max-w-sm shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          aria-label="Back to the last step"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-zinc-200 bg-white text-xl font-bold transition active:scale-95 disabled:opacity-30 sm:h-16 sm:w-16 sm:text-2xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          ←
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="flex-1 rounded-full bg-red-600 px-6 py-3 text-lg font-bold text-white transition active:scale-95 disabled:bg-zinc-300 sm:px-8 sm:py-4 sm:text-xl dark:disabled:bg-zinc-700"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
