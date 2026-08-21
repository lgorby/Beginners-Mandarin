"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SentenceRow from "../SentenceRow";
import StepShell from "../StepShell";
import {
  ding,
  getRecognizer,
  hasSpeechRecognition,
  micPermissionGranted,
  recognizeAttempt,
  stopSpeaking,
} from "@/lib/speech";
import { languageOf, sentenceText, speakSentence } from "@/lib/kidSpeech";
import { useClientValue } from "@/lib/useClientValue";
import type { Step } from "@/lib/steps";
import type { SyllableMark } from "@/lib/pronounce";
import SyllableReport from "../../SyllableReport";
import { useGentleTones } from "../../useGentleTones";

export default function SayStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "SAY" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
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
    "none"
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
  const recRef = useRef<SpeechRecognition | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hands-free listening is armed once per step; any manual tap (🎤 or
  // 🔊) disarms it so the mic never opens against the child's actions.
  const autoArmed = useRef(true);

  const listen = useCallback(() => {
    autoArmed.current = false;
    // A fresh recognizer per attempt: Edge can wedge a reused instance —
    // start() is accepted but no events ever fire, so the button would
    // pulse until the watchdog. Abort any previous session first.
    recRef.current?.abort();
    const rec = getRecognizer(language.recognitionLang);
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
    setReport(null);
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
        if (isMandarin && best.candidates.length > 0) {
          // Rescore by sound: the recognizer often writes a correct
          // pronunciation down as a homophone (吃 → 持), and characters
          // must never punish that. Also fetches the per-syllable report.
          try {
            const res = await fetch(
              `/api/score?target=${encodeURIComponent(target)}&heard=${encodeURIComponent(best.candidates.join("|"))}`
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
  }, [target, language.recognitionLang, isMandarin]);

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
    const rec = recRef;
    const timers = [speakTimer, watchdog];
    return () => {
      armed.current = false;
      timers.forEach((t) => t.current && clearTimeout(t.current));
      rec.current?.abort();
    };
  }, [step.words, question, listen]);

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
        onClick={() => {
          autoArmed.current = false; // replaying must not open the mic
          speakSentence(step.words, { question });
        }}
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
        <div className="flex flex-col items-center gap-3">
          <p className="text-2xl font-bold">
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
