"use client";

import { useState } from "react";
import PicTile from "../PicTile";
import StepShell from "../StepShell";
import { speak } from "@/lib/speech";
import type { Step } from "@/lib/steps";

/**
 * Deterministic shuffle. Math.random() would differ between the server
 * and client renders and trip a hydration mismatch, as well as making
 * the step untestable.
 */
const scramble = (words: string[]) => [...words].reverse();

/** Tap-to-place: far more forgiving for small hands than drag-and-drop. */
export default function BuildStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "BUILD" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [missed, setMissed] = useState(false);
  const tray = scramble(step.answer);

  const solved = placed.length === step.answer.length;
  const usedCount = (zh: string) => placed.filter((p) => p === zh).length;

  const place = (zh: string) => {
    const next = [...placed, zh];
    if (zh !== step.answer[placed.length]) {
      setMissed(true);
      speak(zh);
      return; // wrong slot — the tile simply doesn't stick
    }
    setPlaced(next);
    speak(next.join(""));
  };

  return (
    <StepShell
      kind="BUILD"
      canContinue={solved}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
    >
      <div className="flex min-h-32 flex-wrap items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        {placed.length === 0 ? (
          <span className="text-lg text-zinc-400">
            Tap the pictures in order
          </span>
        ) : (
          placed.map((zh, i) => <PicTile key={`${zh}-${i}`} zh={zh} size="sm" />)
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {tray.map((zh, i) => (
          <PicTile
            key={`${zh}-${i}`}
            zh={zh}
            size="md"
            disabled={usedCount(zh) > tray.filter((t) => t === zh).length - 1}
            speakOnClick={false}
            onClick={() => place(zh)}
          />
        ))}
      </div>

      {solved && step.en && (
        <p className="text-2xl font-bold text-green-600">🎉 {step.en}</p>
      )}
    </StepShell>
  );
}
