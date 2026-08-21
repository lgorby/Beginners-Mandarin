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
    getProgressServerSnapshot,
  );
  const lang = useKidLang();
  const lessons = lessonsFor(lang);

  const current = currentLessonId(progress, lang);
  const currentLesson = lessons.find((l) => l.id === current)!;
  const done = completedCount(progress, lang);
  const finished = done === lessons.length;

  return (
    // The map is a list of N lessons, so it is the one kid screen that
    // cannot promise to fit: Home row and the "keep going" card are
    // fixed rails, and only the list scrolls. The page itself never does.
    <main className="mx-auto flex w-full min-h-0 max-w-md flex-1 flex-col gap-3 px-4 py-3 sm:max-w-3xl lg:max-w-5xl">
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:underline"
        >
          ← Home
        </Link>
        <span className="ml-auto">
          <ParentSettings />
        </span>
      </div>

      <Link
        href={`/learn/${current}`}
        className="flex shrink-0 items-center gap-3 rounded-3xl bg-red-600 p-3 text-white shadow-lg sm:gap-4 sm:p-5"
      >
        <span className="text-3xl sm:text-5xl" aria-hidden>
          {finished ? "🔁" : "▶️"}
        </span>
        <span>
          <span className="block text-sm opacity-80">
            {finished ? "Play again" : "Keep going"}
          </span>
          <span className="block text-xl font-bold sm:text-2xl">
            {currentLesson.title}
          </span>
        </span>
      </Link>

      {/* A grid, not a column: twenty lessons stacked is four screens
          even on a desktop, and the map is meant to be seen at a glance. */}
      <ol className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lessons.map((lesson) => {
          const unlocked = isUnlocked(progress, lesson.id);
          const stars = starsFor(progress, lesson.id);
          const row = (
            <span className="flex w-full items-center gap-3 rounded-3xl border-4 border-zinc-200 bg-white p-2 sm:gap-4 sm:p-3 dark:border-zinc-700 dark:bg-zinc-900">
              <PicTile
                wordKey={lesson.icon}
                size="sm"
                showText={false}
                speakOnClick={false}
              />
              <span className="flex-1 text-left">
                <span className="block font-bold sm:text-lg">
                  {lesson.title}
                </span>
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
    </main>
  );
}
