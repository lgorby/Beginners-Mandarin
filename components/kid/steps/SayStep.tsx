"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SentenceRow from "../SentenceRow";
import StepShell from "../StepShell";
import {
  ding,
  hasSpeechRecognition,
  micPermissionGranted,
  recognizeAttempt,
  stopSpeaking,
  type RecognitionSession,
} from "@/lib/speech";
import { languageOf, sentenceText, speakSentence } from "@/lib/kidSpeech";
import { useClientValue } from "@/lib/useClientValue";
import { useRetryKey } from "@/lib/useArrowNav";
import type { Step } from "@/lib/steps";
import type { SyllableMark } from "@/lib/pronounce";
import SyllableReport from "../../SyllableReport";
import { useGentleTones } from "../../useGentleTones";

export default function SayStep({
  step,
  onDone,
  onBack,
}: {
  step: Extract<Step, { kind: "SAY" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
  onBack?: () => void;
}) {
  const language = languageOf(step.words);
  // Pinyin-and-tones rescoring only exists for Mandarin; other languages
  // are spelled the way they sound, so the transcript match IS the score.
  const isMandarin = language.code === "zh";
  const question = step.en.endsWith("?");
  const target = sentenceText(step.words, { question });
  // A lazy useState initialiser would run during the server render too and
  // hydrate to a different value; this reads the browser after hydration.
  const supported = useClientValue(hasSpeechRecognition, false);
  const [listening, setListening] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [trouble, setTrouble] = useState<"none" | "unheard" | "blocked">(
    "none",
  );
  const [attempt, setAttempt] = useState(0);
  const [toneHint, setToneHint] = useState(false);
  const [report, setReport] = useState<SyllableMark[] | null>(null);
  // Gentle by default for children: tones stabilise around six or seven
  // even for native speakers, so right sounds are a win and tones are
  // coached playfully. A grown-up can switch to strict in settings.
  const gentle = useGentleTones("kid");
  const [phase, setPhase] = useState<
    "starting" | "session" | "mic" | "sound" | "speech"
  >("starting");
  const sessionRef = useRef<RecognitionSession | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hands-free listening is armed once per step; any manual tap — 🎤,
  // the gloss replay, or a word tile — disarms it so the mic never opens
  // against the child's actions. This matters more than it looks:
  // speak() calls speechSynthesis.cancel() on entry, which fires the
  // utterance-in-flight's onend — and the auto-speak's onDone is what
  // opens the microphone. Without disarming, tapping a word mid-read
  // would hand the child an open mic they never asked for.
  const autoArmed = useRef(true);
  const disarm = useCallback(() => {
    autoArmed.current = false;
  }, []);
  const replay = useCallback(() => {
    disarm();
    speakSentence(step.words, { question });
  }, [disarm, step.words, question]);

  const listen = useCallback(() => {
    autoArmed.current = false;
    // Tear the previous attempt down SILENTLY: after abort() none of its
    // callbacks fire, so a superseded session can never flip this
    // attempt's listening state or clear its watchdog. (It used to —
    // that stale `ended` was one way a retry's mic died under the child.)
    sessionRef.current?.abort();
    // The word must never play into an open microphone: the recognizer
    // would hear the speakers, not the child.
    if (speakTimer.current) clearTimeout(speakTimer.current);
    stopSpeaking();
    setTrouble("none");
    setListening(true);
    setAttempt((a) => a + 1);
    setPhase("starting");
    setReport(null);
    // If the service hangs, reset the UI directly — a wedged recognizer
    // may not even honor stop() with an end event. stop(), not abort():
    // whatever it did hear still settles into a score.
    watchdog.current = setTimeout(() => {
      sessionRef.current?.stop();
      setListening(false);
      setTrouble((t) => (t === "none" ? "unheard" : t));
    }, 12000);
    const session = recognizeAttempt(language.recognitionLang, target, {
      phase: (p) => {
        setPhase(p);
        if (p === "mic") ding(); // the mic is truly open — speak now
      },
      settle: async (best) => {
        if (isMandarin && best.candidates.length > 0) {
          // Rescore by sound: the recognizer often writes a correct
          // pronunciation down as a homophone (吃 → 持), and characters
          // must never punish that. Also fetches the per-syllable report.
          try {
            const res = await fetch(
              `/api/score?target=${encodeURIComponent(target)}&heard=${encodeURIComponent(best.candidates.join("|"))}`,
            );
            if (res.ok) {
              const sound: {
                score: number;
                toneHint: boolean;
                syllables: SyllableMark[];
              } = await res.json();
              setReport(sound.syllables);
              setScore(Math.max(best.score, sound.score));
              setToneHint(sound.toneHint && sound.score >= best.score);
              setTrouble("none");
              return;
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
            : "unheard",
        ),
      ended: () => {
        if (watchdog.current) clearTimeout(watchdog.current);
        setListening(false);
      },
    });
    if (!session) {
      if (watchdog.current) clearTimeout(watchdog.current);
      setTrouble("unheard");
      setListening(false);
      return;
    }
    sessionRef.current = session;
  }, [target, language.recognitionLang, isMandarin]);

  // Space/Enter = say it (again): the same action as tapping 🎤, so a
  // "try again" never needs the mouse. Unbound while already listening
  // or when this browser cannot score speech at all.
  useRetryKey(supported && !listening ? listen : undefined);

  // Speak the word, then open the mic hands-free: hear it, echo it — no
  // button on the first go. Waits for the TTS to actually finish, opens
  // only when the mic is already allowed (the first-ever grant needs a
  // deliberate tap), and fires at most once per step.
  useEffect(() => {
    autoArmed.current = true;
    speakTimer.current = setTimeout(() => {
      speakSentence(step.words, {
        question,
        onDone: async () => {
          if (!autoArmed.current || !hasSpeechRecognition()) return;
          if (!(await micPermissionGranted())) return;
          if (!autoArmed.current) return; // disarmed while we awaited
          speakTimer.current = setTimeout(() => {
            if (autoArmed.current) listen();
          }, 350);
        },
      });
    }, 900);
    const armed = autoArmed;
    const session = sessionRef;
    const timers = [speakTimer, watchdog];
    return () => {
      armed.current = false;
      timers.forEach((t) => t.current && clearTimeout(t.current));
      session.current?.abort();
    };
  }, [step.words, question, listen]);

  return (
    <StepShell
      kind="SAY"
      continueLabel={score !== null || !supported ? "Next" : "Skip"}
      onBack={onBack}
      onContinue={() => onDone({ correct: true, spoken: score !== null })}
    >
      {/* Tapping a tile already speaks that word (PicTile speaks on
          click), so a separate 🔊 button was a second way to do what the
          picture does. Whole-sentence replay is NOT redundant, though —
          a tile says one word, and only speakSentence applies the
          language's question intonation (Spanish ¿…?) — so it moved onto
          the English gloss, which is on screen for every SAY step. */}
      <SentenceRow
        words={step.words}
        size={step.words.length > 2 ? "sm" : "lg"}
        onWordTap={disarm}
      />
      {step.en && (
        <button
          type="button"
          onClick={replay}
          aria-label={`Hear it again: ${step.en}`}
          className="rounded-full px-4 py-1.5 text-base text-zinc-500 transition active:scale-95 hover:bg-zinc-100 sm:text-xl dark:hover:bg-zinc-800"
        >
          {step.en} <span aria-hidden>🔊</span>
        </button>
      )}

      {supported ? (
        <button
          type="button"
          onClick={listen}
          disabled={listening}
          className={`rounded-full px-6 py-3 text-2xl transition sm:px-10 sm:py-5 sm:text-4xl ${
            listening
              ? "animate-pulse bg-red-600"
              : "bg-red-100 dark:bg-red-900"
          }`}
          aria-label="Say it into the microphone"
        >
          🎤
        </button>
      ) : (
        // Recognition is Chrome/Edge-only and needs internet. The child
        // must never hit a wall because of their browser.
        <p className="max-w-xs text-center text-base text-zinc-500 sm:text-lg">
          Say it out loud, then tap Next.
        </p>
      )}

      {listening && (
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <p className="text-sm text-zinc-500 sm:text-lg">
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
        <p className="max-w-xs text-center text-sm text-zinc-500 sm:text-lg">
          {trouble === "blocked"
            ? "🔇 Ask a grown-up to switch on the microphone (the 🔒 by the address bar)"
            : "🙉 I didn't hear you — tap 🎤 and try again"}
        </p>
      ) : score !== null ? (
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <p className="text-lg font-bold sm:text-2xl">
            {score >= 90
              ? "🎉 Perfect!"
              : toneHint
                ? gentle
                  ? // All the sounds were right — for a young child that IS
                    // the win; the tone nudge rides along as a game.
                    "🎉 You said it! Now try making it sing 🎵"
                  : "😊 Right sounds — now make them sing! Listen 🔊 and copy the tune."
                : score >= (gentle ? 40 : 50)
                  ? "😊 So close — try again!"
                  : "🙂 Try again!"}
          </p>
          {report && <SyllableReport syllables={report} score={score} />}
        </div>
      ) : null}
    </StepShell>
  );
}
