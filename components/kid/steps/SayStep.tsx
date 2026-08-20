"use client";

import { useEffect, useRef, useState } from "react";
import SentenceRow from "../SentenceRow";
import StepShell from "../StepShell";
import {
  getRecognizer,
  hasSpeechRecognition,
  scoreMatch,
  speak,
} from "@/lib/speech";
import { useClientValue } from "@/lib/useClientValue";
import type { Step } from "@/lib/steps";

export default function SayStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "SAY" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  const target = step.words.join("");
  // A lazy useState initialiser would run during the server render too and
  // hydrate to a different value; this reads the browser after hydration.
  const supported = useClientValue(hasSpeechRecognition, false);
  const [listening, setListening] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const t = setTimeout(() => speak(target), 900);
    const rec = recRef;
    return () => {
      clearTimeout(t);
      rec.current?.abort();
    };
  }, [target]);

  const listen = () => {
    const rec = getRecognizer();
    if (!rec) return;
    recRef.current = rec;
    setListening(true);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const heard = e.results[0]?.[0]?.transcript ?? "";
      setScore(scoreMatch(target, heard));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  };

  return (
    <StepShell
      kind="SAY"
      continueLabel={score !== null || !supported ? "Next" : "Skip"}
      onContinue={() => onDone({ correct: true, spoken: score !== null })}
    >
      <SentenceRow
        words={step.words}
        size={step.words.length > 2 ? "sm" : "lg"}
      />
      {step.en && <p className="text-xl text-zinc-500">{step.en}</p>}

      <button
        type="button"
        onClick={() => speak(target)}
        className="rounded-full bg-red-50 px-6 py-4 text-3xl dark:bg-red-950"
        aria-label="Hear it again"
      >
        🔊
      </button>

      {supported ? (
        <button
          type="button"
          onClick={listen}
          disabled={listening}
          className={`rounded-full px-10 py-6 text-4xl transition ${
            listening ? "animate-pulse bg-red-600" : "bg-red-100 dark:bg-red-900"
          }`}
          aria-label="Say it into the microphone"
        >
          🎤
        </button>
      ) : (
        // Recognition is Chrome/Edge-only and needs internet. The child
        // must never hit a wall because of their browser.
        <p className="max-w-xs text-center text-lg text-zinc-500">
          Say it out loud, then tap Next.
        </p>
      )}

      {score !== null && (
        <p className="text-2xl font-bold">
          {score >= 60 ? `🎉 ${score}%` : `🙂 Nearly — ${score}%`}
        </p>
      )}
    </StepShell>
  );
}
