"use client";

import { useEffect } from "react";
import { STEP_COPY, type Step } from "@/lib/steps";
import { speakEnglish } from "@/lib/speech";
import { useArrowNav } from "@/lib/useArrowNav";

/**
 * The step frame: instruction, spoken cue, Previous arrow, Continue
 * button. The ONLY component that renders this chrome, so the five step
 * components stay thin and cannot drift apart visually. ArrowRight and
 * ArrowLeft drive Continue and Previous through lib/useArrowNav.ts —
 * the same keys as every grown-up pager.
 */
export default function StepShell({
  kind,
  children,
  onContinue,
  onBack,
  canContinue = true,
  continueLabel = "Next",
  narrate = true,
}: {
  kind: Step["kind"];
  children: React.ReactNode;
  onContinue: () => void;
  /** Go back one step. Omitted on a lesson's first step. */
  onBack?: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  narrate?: boolean;
}) {
  const copy = STEP_COPY[kind];

  useArrowNav(onBack, canContinue ? onContinue : undefined);

  // Speak the instruction so a pre-reader can follow the app.
  useEffect(() => {
    if (narrate) speakEnglish(copy.text);
  }, [copy.text, narrate]);

  return (
    <div className="flex flex-1 flex-col items-center justify-between gap-6 px-4 py-6">
      <button
        type="button"
        onClick={() => speakEnglish(copy.text)}
        className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-lg font-semibold dark:bg-zinc-800"
      >
        <span aria-hidden>{copy.icon}</span>
        {copy.text}
        <span aria-hidden>🔊</span>
      </button>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
        {children}
      </div>

      <div className="flex w-full max-w-sm items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          aria-label="Back to the last step"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-zinc-200 bg-white text-2xl font-bold transition active:scale-95 disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-900"
        >
          ←
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="flex-1 rounded-full bg-red-600 px-8 py-5 text-xl font-bold text-white transition active:scale-95 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
