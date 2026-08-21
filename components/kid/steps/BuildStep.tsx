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
  onBack,
}: {
  step: Extract<Step, { kind: "BUILD" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
  onBack?: () => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [missed, setMissed] = useState(false);
  const tray = scramble(step.answer);
  const question = step.en.endsWith("?");

  // A by-ear build says the sentence the child is meant to assemble —
  // without hearing it, "put them in order" is a guessing game, not
  // listening comprehension. The 900ms delay lets the English
  // instruction finish first. A from-English build stays silent: the
  // meaning is the cue (spokenCue below), and hearing the target
  // sentence would hand over the answer.
  useEffect(() => {
    if (step.fromEnglish) return;
    const t = setTimeout(() => speakSentence(step.answer, { question }), 900);
    return () => clearTimeout(t);
  }, [step.answer, step.fromEnglish, question]);

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
      onBack={onBack}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
      // From-English: the meaning is the cue, exactly like SWAP.
      spokenCue={step.fromEnglish ? step.en : undefined}
    >
      {step.fromEnglish ? (
        // The cue in print, for readers — hidden once the solved
        // celebration line shows it in green below.
        !solved && (
          <p className="text-base text-zinc-500 sm:text-xl">{step.en}</p>
        )
      ) : (
        <button
          type="button"
          onClick={() => speakSentence(step.answer, { question })}
          className="shrink-0 rounded-full bg-red-50 px-4 py-2 text-2xl sm:px-6 sm:py-3 sm:text-3xl dark:bg-red-950"
          aria-label="Hear the sentence again"
        >
          🔊
        </button>
      )}

      <div className="flex min-h-[clamp(3.5rem,13dvh,8rem)] flex-wrap items-center justify-center gap-1.5 rounded-3xl border-4 border-dashed border-zinc-300 p-2 sm:gap-2 sm:p-3 dark:border-zinc-700">
        {placed.length === 0 ? (
          <span className="text-sm text-zinc-400 sm:text-lg">
            Tap the pictures in order
          </span>
        ) : (
          placed.map((word, i) => (
            <PicTile key={`${word}-${i}`} wordKey={word} size="sm" />
          ))
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {tray.map((word, i) => (
          <PicTile
            key={`${word}-${i}`}
            wordKey={word}
            size="md"
            disabled={
              usedCount(word) > tray.filter((t) => t === word).length - 1
            }
            speakOnClick={false}
            onClick={() => place(word)}
          />
        ))}
      </div>

      {solved && step.en && (
        <p className="text-lg font-bold text-green-600 sm:text-2xl">
          🎉 {step.en}
        </p>
      )}
    </StepShell>
  );
}
