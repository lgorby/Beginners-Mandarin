"use client";

import { useEffect } from "react";
import PicTile from "../PicTile";
import StepShell from "../StepShell";
import { getWord } from "@/lib/curriculum";
import { speak } from "@/lib/speech";
import type { Step } from "@/lib/steps";

export default function MeetStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "MEET" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  // Play the word once on arrival, after the English instruction.
  useEffect(() => {
    const t = setTimeout(() => speak(step.zh), 900);
    return () => clearTimeout(t);
  }, [step.zh]);

  return (
    <StepShell
      kind="MEET"
      onContinue={() => onDone({ correct: true, spoken: false })}
    >
      <PicTile zh={step.zh} size="lg" />
      <p className="text-2xl font-semibold text-zinc-500">
        {getWord(step.zh).en}
      </p>
    </StepShell>
  );
}
