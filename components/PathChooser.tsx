"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import LangSwitch from "@/components/kid/LangSwitch";
import { useKidLang } from "@/components/kid/useKidLang";
import { lessonsFor } from "@/lib/curriculum";
import { LANGUAGES } from "@/lib/languages";
import {
  completedCount,
  currentLessonId,
  getProgressServerSnapshot,
  getProgressSnapshot,
  subscribeProgress,
  totalStars,
} from "@/lib/progress";

/**
 * The front door. Deliberately NOT a 50/50 split: the child's way in is
 * large and carries their progress, the grown-up way in is a clear but
 * secondary card. A five-year-old should recognise their door rather than
 * weigh a decision. The language chips above the door are the same idea:
 * a returning child sees their language already pressed.
 */
export default function PathChooser() {
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getProgressServerSnapshot
  );
  const lang = useKidLang();
  const language = LANGUAGES[lang];
  const lessons = lessonsFor(lang);

  const done = completedCount(progress, lang);
  const current = currentLessonId(progress, lang);
  const currentLesson = lessons.find((l) => l.id === current)!;
  const started = done > 0;
  const stars = totalStars(progress, lang);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <div className="text-5xl" aria-hidden>
          🐉
        </div>
        <h1 className="mt-2 text-3xl font-bold">
          <span lang="zh-CN">你好</span> · <span lang="es-MX">Hola</span>
        </h1>
        <p className="mt-1 text-zinc-500">Who&apos;s learning today?</p>
      </div>

      <LangSwitch />

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
            <span className="block text-2xl font-bold">
              For kids · {language.name}
            </span>
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
              <span aria-label={`${stars} stars earned`}>⭐ {stars}</span>
            </>
          ) : (
            <>
              <span>Start at the beginning</span>
              <span>{lessons.length} lessons</span>
            </>
          )}
        </span>

        {started && (
          <span
            className="h-2 overflow-hidden rounded-full bg-white/25"
            role="img"
            aria-label={`${done} of ${lessons.length} lessons finished`}
          >
            <span
              className="block h-full rounded-full bg-white"
              style={{ width: `${(done / lessons.length) * 100}%` }}
            />
          </span>
        )}
      </Link>

      {/* The grown-up door — clear, but deliberately quieter. Its toolkit
          (tones, CC-CEDICT, stroke order) only exists for Mandarin. */}
      <Link
        href="/grown-ups"
        className="flex items-center gap-3 rounded-3xl border-2 border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <span className="text-3xl" aria-hidden>
          🧑
        </span>
        <span className="flex-1">
          <span className="block font-bold">For grown-ups · Mandarin</span>
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
