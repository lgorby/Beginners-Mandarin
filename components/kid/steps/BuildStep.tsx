"use client";

import { useEffect, useState } from "react";
import PicTile from "../PicTile";
import StepShell from "../StepShell";
import { speakSentence, speakWord } from "@/lib/kidSpeech";
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
  const question = step.en.endsWith("?");

  // Say the sentence the child is meant to build — without hearing it,
  // "put them in order" is a guessing game, not listening comprehension.
  // The 900ms delay lets the English instruction finish first.
  useEffect(() => {
    const t = setTimeout(() => speakSentence(step.answer, { question }), 900);
    return () => clearTimeout(t);
  }, [step.answer, question]);

  const solved = placed.length === step.answer.length;
  const usedCount = (word: string) => placed.filter((p) => p === word).length;

  const place = (word: string) => {
    const next = [...placed, word];
    if (word !== step.answer[placed.length]) {
      setMissed(true);
      speakWord(word);
      return; // wrong slot — the tile simply doesn't stick
    }
    setPlaced(next);
    speakSentence(next, {
      question: question && next.length === step.answer.length,
    });
  };

  return (
    <StepShell
      kind="BUILD"
      canContinue={solved}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
    >
      <button
        type="button"
        onClick={() => speakSentence(step.answer, { question })}
        className="rounded-full bg-red-50 px-6 py-4 text-3xl dark:bg-red-950"
        aria-label="Hear the sentence again"
      >
        🔊
      </button>

      <div className="flex min-h-32 flex-wrap items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        {placed.length === 0 ? (
          <span className="text-lg text-zinc-400">
            Tap the pictures in order
          </span>
        ) : (
          placed.map((word, i) => (
            <PicTile key={`${word}-${i}`} wordKey={word} size="sm" />
          ))
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {tray.map((word, i) => (
          <PicTile
            key={`${word}-${i}`}
            wordKey={word}
            size="md"
            disabled={usedCount(word) > tray.filter((t) => t === word).length - 1}
            speakOnClick={false}
            onClick={() => place(word)}
          />
        ))}
      </div>

      {solved && step.en && (
        <p className="text-2xl font-bold text-green-600">🎉 {step.en}</p>
      )}
    </StepShell>
  );
}
