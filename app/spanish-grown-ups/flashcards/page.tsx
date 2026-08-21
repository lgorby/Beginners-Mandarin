"use client";

import { useState, useSyncExternalStore } from "react";
import SpeakButton from "@/components/SpeakButton";
import { WORDS } from "@/lib/curriculum";
import { LANGUAGES } from "@/lib/languages";
import { speak } from "@/lib/speech";
import { learnedCount, spanishSrs, type Grade } from "@/lib/srs";

const es = LANGUAGES.es;
const DECK = Object.values(WORDS).filter((w) => w.lang === "es");

// The Mandarin flashcards page's twin, running on its own SRS deck —
// missing "perro" never brings back "你好".
export default function SpanishFlashcardsPage() {
  const session = useSyncExternalStore(
    spanishSrs.subscribe,
    spanishSrs.getSnapshot,
    spanishSrs.getServerSnapshot,
  );
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const current = DECK.find((w) => w.text === session.queue[0]);

  const rate = (grade: Grade) => {
    spanishSrs.rateCurrent(grade);
    setFlipped(false);
    setReviewed((r) => r + 1);
  };

  const flip = () => {
    if (!current) return;
    setFlipped(true);
    speak(current.text, {
      rate: 0.85,
      lang: es.speechLang,
      voicePrefer: es.preferredVoices,
      voiceAvoid: es.wrongVarietyVoices,
    });
  };

  const learned = learnedCount(session.store);

  if (!session.ready) {
    return <p className="text-center text-zinc-400">Loading…</p>;
  }

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col gap-3">
      <div className="shrink-0">
        <h1 className="text-xl font-bold sm:text-3xl">🃏 Flashcard Review</h1>
        <p className="short-hide mt-1 text-sm text-zinc-500">
          See the English, say the Spanish out loud, then flip to check. Cards
          you miss come back sooner; cards you know come back later —
          that&apos;s spaced repetition, the most proven way to memorize
          vocabulary.
        </p>
      </div>

      <div className="flex shrink-0 justify-between text-sm text-zinc-500">
        <span>📥 Due now: {session.queue.length}</span>
        <span>✅ Reviewed today: {reviewed}</span>
        <span>
          🧠 Learned: {learned}/{DECK.length}
        </span>
      </div>

      {!current ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-5xl">🎉</div>
          <p className="mt-3 text-lg font-semibold">All caught up!</p>
          <p className="mt-1 text-sm text-zinc-500">
            No cards are due right now. Do a lesson to learn new words, or come
            back tomorrow.
          </p>
        </div>
      ) : (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => !flipped && flip()}
            onKeyDown={(e) => e.key === "Enter" && !flipped && flip()}
            className="block min-h-0 w-full flex-1 cursor-pointer overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md sm:p-10 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-4xl sm:text-5xl">{current.emoji}</div>
            <div className="mt-2 text-xl font-semibold sm:text-2xl">
              {current.en}
            </div>
            {flipped ? (
              <div className="mt-4 border-t border-dashed border-zinc-300 pt-4 dark:border-zinc-700">
                <div className="text-5xl" lang="es-MX">
                  {current.text}
                </div>
                <div
                  className="mt-3"
                  onClick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <SpeakButton
                    text={current.text}
                    showSlow
                    lang={es.speechLang}
                    voicePrefer={es.preferredVoices}
                    voiceAvoid={es.wrongVarietyVoices}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">
                Say it in Spanish, then tap to reveal
              </p>
            )}
          </div>

          {flipped && (
            <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => rate("again")}
                className="rounded-xl bg-red-100 py-2 font-semibold text-red-700 sm:py-3 transition hover:bg-red-200 dark:bg-red-950 dark:text-red-300"
              >
                ❌ Again
              </button>
              <button
                type="button"
                onClick={() => rate("good")}
                className="rounded-xl bg-amber-100 py-2 font-semibold text-amber-700 sm:py-3 transition hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
              >
                👍 Good
              </button>
              <button
                type="button"
                onClick={() => rate("easy")}
                className="rounded-xl bg-green-100 py-2 font-semibold text-green-700 sm:py-3 transition hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
              >
                ✨ Easy
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
