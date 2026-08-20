"use client";

import { useEffect, useState } from "react";
import { getRecognizer, hasSpeechRecognition, scoreMatch } from "@/lib/speech";
import { useClientValue } from "@/lib/useClientValue";

type Tone = "good" | "bad" | "info";
type Row = { at: string; msg: string; tone: Tone };
type Log = (msg: string, tone?: Tone) => void;

const TESTS = {
  "zh-CN": { label: "Mandarin", say: "nǐ hǎo (你好)", target: "你好" },
  "en-US": { label: "English", say: "hello", target: "hello" },
} as const;

type Lang = keyof typeof TESTS;

// The whole test routine lives at module scope: the React compiler forbids
// a component from mutating outside values, and a recognizer's lifetime
// must outlive any single render anyway. This is a mount-once diagnostic.
let t0 = 0;
let attempts = 0;
const recs: Partial<Record<Lang, SpeechRecognition>> = {};

function abortAll() {
  Object.values(recs).forEach((r) => r?.abort());
}

const stamp = () => `+${Math.round(performance.now() - t0)}ms`;

/** Run one recognition attempt, reporting every event through log. */
function runTest(lang: Lang, log: Log, onSettled: () => void): boolean {
  // A fresh instance per attempt — the same pattern the lessons use
  // (Edge can wedge a reused instance: start() accepted, no events).
  recs[lang]?.abort();
  const rec = getRecognizer(lang);
  if (!rec) return false;
  recs[lang] = rec;
  const { target, say } = TESTS[lang];
  attempts += 1;
  t0 = performance.now();
  log(`— attempt ${attempts} (${lang}): say “${say}” — (fresh recognizer)`);
  rec.onstart = () => log("start: session opened", "good");
  rec.onaudiostart = () => log("audiostart: microphone is capturing", "good");
  rec.onsoundstart = () => log("soundstart: sound detected", "good");
  rec.onspeechstart = () => log("speechstart: speech detected", "good");
  rec.onspeechend = () => log("speechend");
  rec.onaudioend = () => log("audioend: microphone released");
  rec.onresult = (e: SpeechRecognitionEvent) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      for (let j = 0; j < r.length; j++) {
        log(
          `result[${i}][${j}] ${r.isFinal ? "final" : "interim"}: “${r[j].transcript}” (confidence ${r[j].confidence.toFixed(2)}, match ${scoreMatch(target, r[j].transcript)}%)`,
          "good"
        );
      }
    }
  };
  rec.onnomatch = () =>
    log("nomatch: heard something but recognized nothing", "bad");
  rec.onerror = (e: SpeechRecognitionErrorEvent) =>
    log(`error: ${e.error}${e.message ? ` — ${e.message}` : ""}`, "bad");
  rec.onend = () => {
    log("end: session closed");
    onSettled();
  };
  try {
    rec.start();
    return true;
  } catch (err) {
    log(
      `start() threw: ${err instanceof Error ? err.message : String(err)}`,
      "bad"
    );
    return false;
  }
}

/**
 * Speech-recognition diagnostic: runs the exact recognizer configuration
 * the lessons use and logs every event it fires, so a failing retry shows
 * its real error code instead of silently looking dead. English is here
 * as a control — if English works and Mandarin doesn't, the zh-CN
 * recognition service is the problem, not the microphone.
 */
export default function RecognitionTest() {
  const supported = useClientValue(hasSpeechRecognition, true);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => abortAll, []);

  const log: Log = (msg, tone = "info") =>
    setRows((r) => [...r.slice(-199), { at: stamp(), msg, tone }]);

  const run = (lang: Lang) =>
    setRunning(runTest(lang, log, () => setRunning(false)));

  const copyLog = () => {
    const text = [
      navigator.userAgent,
      ...rows.map((r) => `${r.at}  ${r.msg}`),
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  if (!supported) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          This browser has no speech recognizer at all — use Google Chrome or
          Microsoft Edge for the speaking exercises.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">🗣️ Recognition test:</span>
        {(Object.keys(TESTS) as Lang[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => run(lang)}
            disabled={running}
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium transition hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {running ? "🎤 Listening…" : `▶ ${TESTS[lang].label}`}
          </button>
        ))}
        {rows.length > 0 && (
          <>
            <button
              type="button"
              onClick={copyLog}
              className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              📋 Copy log
            </button>
            <button
              type="button"
              onClick={() => setRows([])}
              className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {rows.length > 0 && (
        <ol className="mt-3 max-h-80 space-y-0.5 overflow-y-auto font-mono text-xs">
          {rows.map((r, i) => (
            <li
              key={i}
              className={
                r.tone === "bad"
                  ? "text-red-600 dark:text-red-400"
                  : r.tone === "good"
                    ? "text-green-700 dark:text-green-400"
                    : "text-zinc-500"
              }
            >
              <span className="mr-2 inline-block w-16 text-right text-zinc-400">
                {r.at}
              </span>
              {r.msg}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
