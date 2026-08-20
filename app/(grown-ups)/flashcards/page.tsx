"use client";

import { useEffect, useMemo, useState } from "react";
import PinyinText from "@/components/PinyinText";
import SpeakButton from "@/components/SpeakButton";
import { speak } from "@/lib/speech";
import { VOCAB } from "@/lib/vocab";

// Simple spaced repetition (Leitner boxes) stored in localStorage.
// Box 0 = new/again; higher boxes are reviewed at longer intervals.
const INTERVALS_DAYS = [0, 1, 3, 7, 16, 35];
const STORAGE_KEY = "mandarin-srs-v1";

interface CardState {
  box: number;
  due: number; // epoch ms
}

type Store = Record<string, CardState>;

function loadStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function saveStore(s: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function FlashcardsPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    const s = loadStore();
    setStore(s);
    const now = Date.now();
    const due = VOCAB.filter((w) => {
      const st = s[w.zh];
      return !st || st.due <= now;
    }).map((w) => w.zh);
    // New cards last, capped so a session stays short.
    setQueue(due.slice(0, 20));
  }, []);

  const current = useMemo(
    () => VOCAB.find((w) => w.zh === queue[0]),
    [queue]
  );

  const rate = (grade: "again" | "good" | "easy") => {
    if (!current || !store) return;
    const prev = store[current.zh] ?? { box: 0, due: 0 };
    const box =
      grade === "again"
        ? 0
        : Math.min(prev.box + (grade === "easy" ? 2 : 1), INTERVALS_DAYS.length - 1);
    const days = INTERVALS_DAYS[box];
    const due =
      grade === "again"
        ? Date.now() + 60_000 // see it again this session
        : Date.now() + days * 24 * 60 * 60 * 1000;
    const next: Store = { ...store, [current.zh]: { box, due } };
    setStore(next);
    saveStore(next);
    setFlipped(false);
    setReviewed((r) => r + 1);
    setQueue((q) => {
      const rest = q.slice(1);
      // "Again" cards return to the end of today's queue.
      return grade === "again" ? [...rest, q[0]] : rest;
    });
  };

  const flip = () => {
    if (!current) return;
    setFlipped(true);
    speak(current.zh, { rate: 0.85 });
  };

  const learned = store
    ? Object.values(store).filter((c) => c.box >= 2).length
    : 0;

  if (store === null) {
    return <p className="text-center text-zinc-400">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🃏 Flashcard Review</h1>
        <p className="mt-1 text-zinc-500">
          See the English, say the Mandarin out loud, then flip to check.
          Cards you miss come back sooner; cards you know come back later —
          that&apos;s spaced repetition, the most proven way to memorize
          vocabulary.
        </p>
      </div>

      <div className="flex justify-between text-sm text-zinc-500">
        <span>📥 Due now: {queue.length}</span>
        <span>✅ Reviewed today: {reviewed}</span>
        <span>
          🧠 Learned: {learned}/{VOCAB.length}
        </span>
      </div>

      {!current ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
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
            className="block w-full cursor-pointer rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-5xl">{current.emoji}</div>
            <div className="mt-2 text-2xl font-semibold">{current.en}</div>
            {flipped ? (
              <div className="mt-4 border-t border-dashed border-zinc-300 pt-4 dark:border-zinc-700">
                <div className="text-5xl" lang="zh-CN">
                  {current.zh}
                </div>
                <PinyinText
                  pinyin={current.pinyin}
                  className="mt-1 block text-xl font-medium"
                />
                <div
                  className="mt-2"
                  onClick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <SpeakButton text={current.zh} showSlow />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">
                Say it in Mandarin, then tap to reveal
              </p>
            )}
          </div>

          {flipped && (
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => rate("again")}
                className="rounded-xl bg-red-100 py-3 font-semibold text-red-700 transition hover:bg-red-200 dark:bg-red-950 dark:text-red-300"
              >
                ❌ Again
              </button>
              <button
                type="button"
                onClick={() => rate("good")}
                className="rounded-xl bg-amber-100 py-3 font-semibold text-amber-700 transition hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
              >
                👍 Good
              </button>
              <button
                type="button"
                onClick={() => rate("easy")}
                className="rounded-xl bg-green-100 py-3 font-semibold text-green-700 transition hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
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
