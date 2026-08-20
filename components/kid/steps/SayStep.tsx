"use client";

import { useEffect, useRef, useState } from "react";
import SentenceRow from "../SentenceRow";
import StepShell from "../StepShell";
import {
  bestMatch,
  getRecognizer,
  hasSpeechRecognition,
  speak,
  stopSpeaking,
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
  const [micTrouble, setMicTrouble] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    speakTimer.current = setTimeout(() => speak(target), 900);
    const rec = recRef;
    const timer = speakTimer;
    return () => {
      if (timer.current) clearTimeout(timer.current);
      rec.current?.abort();
    };
  }, [target]);

  const listen = () => {
    const rec = getRecognizer();
    if (!rec) return;
    // The word must never play into an open microphone: the recognizer
    // would hear the speakers, not the child.
    if (speakTimer.current) clearTimeout(speakTimer.current);
    stopSpeaking();
    recRef.current = rec;
    setMicTrouble(false);
    setListening(true);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      setScore(bestMatch(target, e.results[0]).score);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setMicTrouble(true);
      setListening(false);
    };
    try {
      rec.start();
    } catch {
      setMicTrouble(true);
      setListening(false);
    }
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

      {/* A pre-reader can't parse "67%", and a one-word target can only
          score 0 or 100 anyway — tiers say it better than numbers. */}
      {score !== null && (
        <p className="text-2xl font-bold">
          {score >= 90
            ? "🎉 Perfect!"
            : score >= 50
              ? "😊 So close — try again!"
              : "🙂 Try again!"}
        </p>
      )}
      {micTrouble && score === null && (
        <p className="max-w-xs text-center text-lg text-zinc-500">
          🙉 I didn&apos;t hear you — tap 🎤 and try again
        </p>
      )}
    </StepShell>
  );
}
