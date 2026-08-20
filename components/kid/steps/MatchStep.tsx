"use client";

import { useEffect, useState } from "react";
import PicTile from "../PicTile";
import StepShell from "../StepShell";
import { speak } from "@/lib/speech";
import type { Step } from "@/lib/steps";

/** A wrong answer reveals and lets the child retry. It never blocks. */
export default function MatchStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "MATCH" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => speak(step.answer), 900);
    return () => clearTimeout(t);
  }, [step.answer]);

  const solved = picked === step.answer;

  return (
    <StepShell
      kind="MATCH"
      canContinue={solved}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
    >
      <button
        type="button"
        onClick={() => speak(step.answer)}
        className="rounded-full bg-red-50 px-8 py-6 text-5xl dark:bg-red-950"
        aria-label="Play the word again"
      >
        🔊
      </button>

      <div className="flex flex-wrap justify-center gap-3">
        {step.choices.map((zh) => {
          const wrong = picked === zh && zh !== step.answer;
          return (
            <span key={zh} className={wrong ? "animate-pulse" : ""}>
              <PicTile
                zh={zh}
                size="md"
                showText={false}
                selected={solved && zh === step.answer}
                disabled={solved}
                speakOnClick={false}
                onClick={() => {
                  setPicked(zh);
                  speak(zh);
                  if (zh !== step.answer) setMissed(true);
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
