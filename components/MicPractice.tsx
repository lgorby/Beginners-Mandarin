"use client";

import { useEffect, useRef, useState } from "react";
import {
  ding,
  getRecognizer,
  hasSpeechRecognition,
  recognizeAttempt,
  speak,
  stopSpeaking,
} from "@/lib/speech";
import { useClientValue } from "@/lib/useClientValue";
import { useRetryKey } from "@/lib/useArrowNav";
import type { SyllableMark } from "@/lib/pronounce";
import PinyinText from "./PinyinText";
import SyllableReport from "./SyllableReport";
import { useGentleTones } from "./useGentleTones";

interface Props {
  /** The Mandarin phrase the learner should say */
  target: string;
  pinyin: string;
  en: string;
  /**
   * Bind Space/Enter to "Say it!". The binding is global, so only the
   * page's SOLE MicPractice may set this — the lesson pages render two
   * cards and must leave it off, or one keypress would open both mics.
   */
  retryKey?: boolean;
}

// Plain-language explanations for every Web Speech recognition error code.
const REC_ERRORS: Record<string, string> = {
  "not-allowed":
    "Microphone access is blocked. Click the 🔒/🎤 icon in the address bar, allow the microphone, and reload.",
  "service-not-allowed":
    "This browser blocked its speech service. Try Google Chrome — its Mandarin recognizer is the most reliable.",
  "language-not-supported":
    "This browser's speech recognizer doesn't support Mandarin. Use Google Chrome for scored practice — or use Record & Compare below, which works everywhere.",
  network:
    "The speech recognizer needs an internet connection (it runs in the cloud). Check your connection — or use Record & Compare below, which works offline.",
  "audio-capture":
    "No microphone was found. Check it's plugged in and enabled in Windows Settings → Privacy & security → Microphone.",
  "no-speech": "Didn't hear anything — try again and speak a bit louder.",
  aborted: "Listening was cancelled.",
};

/**
 * Microphone pronunciation practice, two ways:
 *  1. "Say it!" — the browser's zh-CN speech recognizer scores your attempt
 *     (Chrome/Edge, needs internet).
 *  2. "Record & Compare" — record your voice and play it back next to the
 *     native audio (works in any browser, offline).
 */
export default function MicPractice({
  target,
  pinyin,
  en,
  retryKey = false,
}: Props) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [report, setReport] = useState<SyllableMark[] | null>(null);
  const [toneHint, setToneHint] = useState(false);
  // Strict by default for adults — drill the tones — but relaxable.
  const gentle = useGentleTones("adult");
  // Server render (and hydration) assume supported, matching what this
  // component has always shown first; the client then reads the truth.
  const supported = useClientValue(hasSpeechRecognition, true);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Record & Compare state
  const [recording, setRecording] = useState(false);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      recRef.current?.abort();
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Revoke old object URLs so recordings don't leak memory.
  useEffect(() => {
    return () => {
      if (clipUrl) URL.revokeObjectURL(clipUrl);
    };
  }, [clipUrl]);

  // One recognizer per card. Chrome runs a single recognition session per
  // page and tears the old one down asynchronously, so a fresh instance
  // per tap can start against a half-dead session and fail every retry.
  const start = () => {
    // A fresh recognizer per attempt: Edge can wedge a reused instance —
    // start() is accepted but no events ever fire. Abort any previous
    // session first.
    recRef.current?.abort();
    const rec = getRecognizer();
    if (!rec) return;
    recRef.current = rec;
    // Never listen while the speakers are playing the target phrase.
    stopSpeaking();
    setHeard(null);
    setScore(null);
    setReport(null);
    setToneHint(false);
    setError(null);
    setListening(true);
    // If the service hangs, force the session closed so the button
    // comes back instead of pulsing forever.
    watchdogRef.current = setTimeout(() => recRef.current?.abort(), 12000);
    const ok = recognizeAttempt(rec, target, {
      phase: (p) => {
        if (p === "mic") ding(); // the mic is truly open — speak now
      },
      settle: async (best) => {
        if (best.candidates.length > 0) {
          // Rescore by sound (pinyin + tones): a homophone transcript of
          // a correct pronunciation must not read as failure. Also
          // fetches the per-syllable report.
          try {
            const res = await fetch(
              `/api/score?target=${encodeURIComponent(target)}&heard=${encodeURIComponent(best.candidates.join("|"))}`
            );
            if (res.ok) {
              const sound: {
                transcript: string;
                score: number;
                toneHint: boolean;
                syllables: SyllableMark[];
              } = await res.json();
              setReport(sound.syllables);
              setToneHint(sound.toneHint);
              setHeard(
                sound.score > best.score ? sound.transcript : best.transcript
              );
              setScore(Math.max(best.score, sound.score));
              return;
            }
          } catch {
            // Scoring API unreachable — the character score still stands.
          }
        }
        if (best.score >= 0) {
          setHeard(best.transcript);
          setScore(best.score);
        } else {
          setError((er) => er ?? REC_ERRORS["no-speech"]);
        }
      },
      error: (code) =>
        setError(
          code === "nomatch"
            ? REC_ERRORS["no-speech"]
            : (REC_ERRORS[code] ?? `Speech recognition error: ${code}`)
        ),
      ended: () => {
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
        setListening(false);
      },
    });
    if (!ok) {
      setError("Could not start listening — try again in a moment.");
      setListening(false);
    }
  };

  // Space/Enter = Say it! / try again, where this is the page's only mic.
  useRetryKey(retryKey && supported && !listening ? start : undefined);

  const startRecording = async () => {
    setRecError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType });
        setClipUrl(URL.createObjectURL(blob));
        setRecording(false);
      };
      recorder.start();
      setRecording(true);
      // Auto-stop after 6 seconds so a missed click doesn't record forever.
      stopTimerRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 6000);
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setRecError(
        name === "NotAllowedError"
          ? "Microphone permission is blocked — allow it via the 🔒/🎤 icon in the address bar, then reload."
          : name === "NotFoundError"
            ? "No microphone found — check Windows sound settings."
            : "Could not start recording."
      );
    }
  };

  const stopRecording = () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const feedback =
    score === null
      ? null
      : score >= 90
        ? { emoji: "🎉", msg: "Perfect! The recognizer heard exactly the right phrase.", color: "text-green-600 dark:text-green-400" }
        : gentle && toneHint
          ? { emoji: "🎉", msg: "All the right sounds! (Gentle mode — tones not required. Listen again to copy the melody.)", color: "text-green-600 dark:text-green-400" }
          : score >= 60
            ? { emoji: "👍", msg: "Close! Most of it came through — listen again and watch the tones.", color: "text-amber-600 dark:text-amber-400" }
            : { emoji: "🔁", msg: "Not quite — listen to the slow version and try again.", color: "text-red-600 dark:text-red-400" };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 text-3xl font-semibold" lang="zh-CN">
        {target}
      </div>
      <PinyinText pinyin={pinyin} className="text-lg" />
      <div className="mb-4 text-sm text-zinc-500">{en}</div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => speak(target, { rate: 0.85 })}
          className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          🔊 Listen
        </button>
        <button
          type="button"
          onClick={() => speak(target, { rate: 0.5 })}
          className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          🐢 Slow
        </button>
        {supported && (
          <button
            type="button"
            onClick={start}
            disabled={listening}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition active:scale-95 ${
              listening
                ? "animate-pulse bg-red-500"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {listening ? "🎤 Listening…" : "🎤 Say it!"}
          </button>
        )}
      </div>

      {!supported && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          Scored practice needs Google Chrome (this browser has no Mandarin
          speech recognizer) — but Record &amp; Compare below works here.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {heard !== null && feedback && (
        <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
          <div className={`font-semibold ${feedback.color}`}>
            {feedback.emoji} {score}% match
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            We heard:{" "}
            <span className="text-lg" lang="zh-CN">
              {heard || "(nothing)"}
            </span>
          </div>
          <div className="mt-1 text-sm text-zinc-500">{feedback.msg}</div>
          {report && (
            <div className="mt-3">
              <SyllableReport syllables={report} score={score ?? 0} />
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-700">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            🎙️ Record &amp; Compare:
          </span>
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              ⏺ Record me
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="animate-pulse rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              ⏹ Stop
            </button>
          )}
          {clipUrl && !recording && (
            <>
              <audio src={clipUrl} controls className="h-9 max-w-52" />
              <button
                type="button"
                onClick={() => speak(target, { rate: 0.85 })}
                className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                🔊 Native again
              </button>
            </>
          )}
        </div>
        {recError && <p className="mt-2 text-sm text-red-600">{recError}</p>}
        {clipUrl && !recording && (
          <p className="mt-2 text-xs text-zinc-400">
            Play your voice, then the native audio — do the tones rise and fall
            the same way?
          </p>
        )}
      </div>
    </div>
  );
}
