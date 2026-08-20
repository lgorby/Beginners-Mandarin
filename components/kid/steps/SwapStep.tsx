"use client";

import { useState } from "react";
import PicTile from "../PicTile";
import SentenceRow from "../SentenceRow";
import StepShell from "../StepShell";
import { speak } from "@/lib/speech";
import type { Step } from "@/lib/steps";

export default function SwapStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "SWAP" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const solved = picked === step.answer;

  return (
    <StepShell
      kind="SWAP"
      canContinue={solved}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
    >
      <SentenceRow
        words={step.sentence}
        blankAt={solved ? undefined : step.blankAt}
      />

      <div className="flex flex-wrap justify-center gap-3">
        {step.choices.map((zh) => (
          <PicTile
            key={zh}
            zh={zh}
            size="md"
            disabled={solved}
            selected={solved && zh === step.answer}
            speakOnClick={false}
            onClick={() => {
              setPicked(zh);
              if (zh === step.answer) {
                speak(step.sentence.join(""));
              } else {
                setMissed(true);
                speak(zh);
              }
            }}
          />
        ))}
      </div>

      {solved ? (
        <p className="text-2xl font-bold text-green-600">🎉 {step.en}</p>
      ) : (
        picked && (
          <p className="text-lg font-semibold text-amber-600">Try again 🙂</p>
        )
      )}
    </StepShell>
  );
}
