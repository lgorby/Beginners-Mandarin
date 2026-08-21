"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import PicTile from "./PicTile";
import ParentSettings from "./ParentSettings";
import { lessonsFor } from "@/lib/curriculum";
import {
  completedCount,
  currentLessonId,
  getProgressServerSnapshot,
  getProgressSnapshot,
  isUnlocked,
  starsFor,
  subscribeProgress,
} from "@/lib/progress";
import { useKidLang } from "./useKidLang";

export default function StarPath() {
  // Progress lives in localStorage. useSyncExternalStore reads it without
  // calling setState inside an effect (see MicPractice.tsx:53) and serves
  // server renders a neutral snapshot, so hydration matches.
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getProgressServerSnapshot
  );
  const lang = useKidLang();
  const lessons = lessonsFor(lang);

  const current = currentLessonId(progress, lang);
  const currentLesson = lessons.find((l) => l.id === current)!;
  const done = completedCount(progress, lang);
  const finished = done === lessons.length;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:underline"
      >
        ← Home
      </Link>

      <Link
        href={`/learn/${current}`}
        className="flex items-center gap-4 rounded-3xl bg-red-600 p-5 text-white shadow-lg"
      >
        <span className="text-5xl" aria-hidden>
          {finished ? "🔁" : "▶️"}
        </span>
        <span>
          <span className="block text-sm opacity-80">
            {finished ? "Play again" : "Keep going"}
          </span>
          <span className="block text-2xl font-bold">{currentLesson.title}</span>
        </span>
      </Link>

      <ol className="mt-6 space-y-3">
        {lessons.map((lesson) => {
          const unlocked = isUnlocked(progress, lesson.id);
          const stars = starsFor(progress, lesson.id);
          const row = (
            <span className="flex w-full items-center gap-4 rounded-3xl border-4 border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
              <PicTile
                wordKey={lesson.icon}
                size="sm"
                showText={false}
                speakOnClick={false}
              />
              <span className="flex-1 text-left">
                <span className="block text-lg font-bold">{lesson.title}</span>
                <span className="text-lg" aria-label={`${stars} of 3 stars`}>
                  {"⭐".repeat(stars)}
                  <span className="opacity-20">{"⭐".repeat(3 - stars)}</span>
                </span>
              </span>
              {!unlocked && (
                <span className="pr-2 text-2xl opacity-40" aria-hidden>
                  🔒
                </span>
              )}
            </span>
          );
          return (
            <li key={lesson.id}>
              {unlocked ? (
                <Link href={`/learn/${lesson.id}`} className="block">
                  {row}
                </Link>
              ) : (
                <span className="block opacity-50" aria-disabled>
                  {row}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <ParentSettings />
    </main>
  );
}
