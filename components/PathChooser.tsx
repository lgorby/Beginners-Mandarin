"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { LESSONS, lessonIndex } from "@/lib/curriculum";
import {
  completedCount,
  currentLessonId,
  getProgressServerSnapshot,
  getProgressSnapshot,
  starsFor,
  subscribeProgress,
} from "@/lib/progress";

/**
 * The front door. Deliberately NOT a 50/50 split: the child's way in is
 * large and carries their progress, the grown-up way in is a clear but
 * secondary card. A five-year-old should recognise their door rather than
 * weigh a decision.
 */
export default function PathChooser() {
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getProgressServerSnapshot
  );

  const done = completedCount(progress);
  const current = currentLessonId(progress);
  const currentLesson = LESSONS[lessonIndex(current)];
  const started = done > 0;
  const totalStars = LESSONS.reduce((n, l) => n + starsFor(progress, l.id), 0);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <div className="text-5xl" aria-hidden>
          🐉
        </div>
        <h1 className="mt-2 text-3xl font-bold">
          <span lang="zh-CN">你好</span> Mandarin
        </h1>
        <p className="mt-1 text-zinc-500">Who&apos;s learning today?</p>
      </div>

      {/* The child's door — primary, and the only one showing progress. */}
      <Link
        href="/learn"
        className="flex flex-col gap-2 rounded-3xl bg-red-600 p-6 text-white shadow-lg transition hover:bg-red-700 active:scale-[0.99]"
      >
        <span className="flex items-center gap-3">
          <span className="text-5xl" aria-hidden>
            🧒
          </span>
          <span>
            <span className="block text-2xl font-bold">For kids</span>
            <span className="block text-sm opacity-90">
              Pictures and sounds — no reading needed
            </span>
          </span>
        </span>

        <span className="mt-1 flex items-center justify-between rounded-2xl bg-white/15 px-4 py-2 text-sm">
          {started ? (
            <>
              <span>
                Next: <strong>{currentLesson.title}</strong>
              </span>
              <span aria-label={`${totalStars} stars earned`}>
                ⭐ {totalStars}
              </span>
            </>
          ) : (
            <>
              <span>Start at the beginning</span>
              <span>{LESSONS.length} lessons</span>
            </>
          )}
        </span>

        {started && (
          <span
            className="h-2 overflow-hidden rounded-full bg-white/25"
            role="img"
            aria-label={`${done} of ${LESSONS.length} lessons finished`}
          >
            <span
              className="block h-full rounded-full bg-white"
              style={{ width: `${(done / LESSONS.length) * 100}%` }}
            />
          </span>
        )}
      </Link>

      {/* The grown-up door — clear, but deliberately quieter. */}
      <Link
        href="/grown-ups"
        className="flex items-center gap-3 rounded-3xl border-2 border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <span className="text-3xl" aria-hidden>
          🧑
        </span>
        <span className="flex-1">
          <span className="block font-bold">For grown-ups</span>
          <span className="block text-sm text-zinc-500">
            Tones, dictionary, stroke order, flashcards
          </span>
        </span>
        <span className="text-xl text-zinc-400" aria-hidden>
          →
        </span>
      </Link>
    </main>
  );
}
