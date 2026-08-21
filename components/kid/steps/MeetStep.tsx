"use client";

import { useEffect } from "react";
import PicTile from "../PicTile";
import StepShell from "../StepShell";
import { getWord } from "@/lib/curriculum";
import { speakWord } from "@/lib/kidSpeech";
import type { Step } from "@/lib/steps";

export default function MeetStep({
  step,
  onDone,
  onBack,
}: {
  step: Extract<Step, { kind: "MEET" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
  onBack?: () => void;
}) {
  // Play the word once on arrival, after the English instruction.
  useEffect(() => {
    const t = setTimeout(() => speakWord(step.word), 900);
    return () => clearTimeout(t);
  }, [step.word]);

  return (
    <StepShell
      kind="MEET"
      onBack={onBack}
      onContinue={() => onDone({ correct: true, spoken: false })}
    >
      <PicTile wordKey={step.word} size="lg" />
      <p className="text-2xl font-semibold text-zinc-500">
        {getWord(step.word).en}
      </p>
    </StepShell>
  );
}
