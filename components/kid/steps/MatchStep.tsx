"use client";

import { useEffect, useState } from "react";
import PicTile from "../PicTile";
import StepShell from "../StepShell";
import { speakWord } from "@/lib/kidSpeech";
import type { Step } from "@/lib/steps";

/** A wrong answer reveals and lets the child retry. It never blocks. */
export default function MatchStep({
  step,
  onDone,
  onBack,
}: {
  step: Extract<Step, { kind: "MATCH" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
  onBack?: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => speakWord(step.answer), 900);
    return () => clearTimeout(t);
  }, [step.answer]);

  const solved = picked === step.answer;

  return (
    <StepShell
      kind="MATCH"
      canContinue={solved}
      onBack={onBack}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
    >
      <button
        type="button"
        onClick={() => speakWord(step.answer)}
        className="rounded-full bg-red-50 px-8 py-6 text-5xl dark:bg-red-950"
        aria-label="Play the word again"
      >
        🔊
      </button>

      <div className="flex flex-wrap justify-center gap-3">
        {step.choices.map((word) => {
          const wrong = picked === word && word !== step.answer;
          return (
            <span key={word} className={wrong ? "animate-pulse" : ""}>
              <PicTile
                wordKey={word}
                size="md"
                showText={false}
                selected={solved && word === step.answer}
                disabled={solved}
                speakOnClick={false}
                onClick={() => {
                  setPicked(word);
                  speakWord(word);
                  if (word !== step.answer) setMissed(true);
                }}
              />
            </span>
          );
        })}
      </div>

      {picked && !solved && (
        <p className="text-lg font-semibold text-amber-600">Try again 🙂</p>
      )}
    </StepShell>
  );
}
