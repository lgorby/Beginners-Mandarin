"use client";

import { useEffect, useRef, useState } from "react";
import SentenceRow from "../SentenceRow";
import StepShell from "../StepShell";
import {
  ding,
  getRecognizer,
  hasSpeechRecognition,
  recognizeAttempt,
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
  const [trouble, setTrouble] = useState<"none" | "unheard" | "blocked">(
    "none"
  );
  const [attempt, setAttempt] = useState(0);
  const [toneHint, setToneHint] = useState(false);
  const [phase, setPhase] = useState<
    "starting" | "session" | "mic" | "sound" | "speech"
  >("starting");
  const recRef = useRef<SpeechRecognition | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    speakTimer.current = setTimeout(() => speak(target), 900);
    const rec = recRef;
    const timers = [speakTimer, watchdog];
    return () => {
      timers.forEach((t) => t.current && clearTimeout(t.current));
      rec.current?.abort();
    };
  }, [target]);

  // One recognizer for the whole step. Chrome runs a single recognition
  // session per page and tears the old one down asynchronously, so a
  // fresh instance per tap can start against a half-dead session and
  // fail every retry.
  const listen = () => {
    // A fresh recognizer per attempt: Edge can wedge a reused instance —
    // start() is accepted but no events ever fire, so the button would
    // pulse until the watchdog. Abort any previous session first.
    recRef.current?.abort();
    const rec = getRecognizer();
    if (!rec) return;
    recRef.current = rec;
    // The word must never play into an open microphone: the recognizer
    // would hear the speakers, not the child.
    if (speakTimer.current) clearTimeout(speakTimer.current);
    stopSpeaking();
    setTrouble("none");
    setListening(true);
    setAttempt((a) => a + 1);
    setPhase("starting");
    // If the service hangs, reset the UI directly — a wedged recognizer
    // may not even honor abort() with an end event.
    watchdog.current = setTimeout(() => {
      recRef.current?.abort();
      setListening(false);
      setTrouble((t) => (t === "none" ? "unheard" : t));
    }, 12000);
    const ok = recognizeAttempt(rec, target, {
      phase: (p) => {
        setPhase(p);
        if (p === "mic") ding(); // the mic is truly open — speak now
      },
      settle: async (best) => {
        // The characters matched exactly, or nothing to rescore: settle now.
        if (best.score < 100 && best.candidates.length > 0) {
          // Rescore by sound: the recognizer often writes a correct
          // pronunciation down as a homophone (吃 → 持), and characters
          // must never punish that.
          try {
            const res = await fetch(
              `/api/score?target=${encodeURIComponent(target)}&heard=${encodeURIComponent(best.candidates.join("|"))}`
            );
            if (res.ok) {
              const sound: { score: number; toneHint: boolean } =
                await res.json();
              if (sound.score > best.score) {
                setScore(sound.score);
                setToneHint(sound.toneHint);
                setTrouble("none");
                return;
              }
            }
          } catch {
            // Scoring API unreachable — the character score still stands.
          }
        }
        if (best.score >= 0) {
          setScore(best.score);
          setToneHint(false);
          setTrouble("none");
        } else if (best.heardSound) {
          // Sound arrived but nothing was recognized — that's a "try
          // again", not a false "I didn't hear you".
          setScore(0);
          setToneHint(false);
          setTrouble("none");
        } else {
          // No sound at all — say so rather than showing nothing.
          setTrouble((t) => (t === "none" ? "unheard" : t));
        }
      },
      error: (code) =>
        setTrouble(
          ["not-allowed", "service-not-allowed", "audio-capture"].includes(code)
            ? "blocked"
            : "unheard"
        ),
      ended: () => {
        if (watchdog.current) clearTimeout(watchdog.current);
        setListening(false);
      },
    });
    if (!ok) {
      setTrouble("unheard");
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

      {listening && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg text-zinc-500">
            Attempt {attempt} ·{" "}
            {phase === "starting"
              ? "getting ready…"
              : phase === "session" || phase === "mic"
                ? "🎙️ listening — say it now!"
                : "👂 I can hear you!"}
          </p>
          {/* The bars only dance once the recognizer itself reports
              sound — an honest signal, not a decoration. */}
          {(phase === "sound" || phase === "speech") && (
            <div className="flex h-8 items-center gap-1" aria-hidden>
              {[10, 20, 28, 16, 24, 12, 22].map((h, i) => (
                <span
                  key={i}
                  className="w-1.5 animate-bounce rounded-full bg-red-500"
                  style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {trouble !== "none" ? (
        <p className="max-w-xs text-center text-lg text-zinc-500">
          {trouble === "blocked"
            ? "🔇 Ask a grown-up to switch on the microphone (the 🔒 by the address bar)"
            : "🙉 I didn't hear you — tap 🎤 and try again"}
        </p>
      ) : score !== null ? (
        // A pre-reader can't parse "67%", and a one-word target can only
        // score 0 or 100 anyway — tiers say it better than numbers.
        <p className="text-2xl font-bold">
          {score >= 90
            ? "🎉 Perfect!"
            : toneHint
              ? "😊 Right sounds — now make them sing! Listen 🔊 and copy the tune."
              : score >= 50
                ? "😊 So close — try again!"
                : "🙂 Try again!"}
        </p>
      ) : null}
    </StepShell>
  );
}
