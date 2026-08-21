"use client";

import { useState } from "react";
import PicTile from "../PicTile";
import SentenceRow from "../SentenceRow";
import StepShell from "../StepShell";
import { speakSentence, speakWord } from "@/lib/kidSpeech";
import type { Step } from "@/lib/steps";

export default function SwapStep({
  step,
  onDone,
  onBack,
}: {
  step: Extract<Step, { kind: "SWAP" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
  onBack?: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const solved = picked === step.answer;

  return (
    <StepShell
      kind="SWAP"
      canContinue={solved}
      onBack={onBack}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
    >
      <SentenceRow
        words={step.sentence}
        blankAt={solved ? undefined : step.blankAt}
      />

      <div className="flex flex-wrap justify-center gap-3">
        {step.choices.map((word) => (
          <PicTile
            key={word}
            wordKey={word}
            size="md"
            disabled={solved}
            selected={solved && word === step.answer}
            speakOnClick={false}
            onClick={() => {
              setPicked(word);
              if (word === step.answer) {
                speakSentence(step.sentence, {
                  question: step.en.endsWith("?"),
                });
              } else {
                setMissed(true);
                speakWord(word);
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
