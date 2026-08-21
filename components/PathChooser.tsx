"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Paged from "@/components/Paged";
import { lessonsFor } from "@/lib/curriculum";
import { LANGUAGES, LANG_CODES, type LangCode } from "@/lib/languages";
import { setKidLang } from "@/lib/langPref";
import {
  completedCount,
  currentLessonId,
  getProgressServerSnapshot,
  getProgressSnapshot,
  subscribeProgress,
  totalStars,
  type Progress,
} from "@/lib/progress";

/**
 * The front door. Deliberately NOT an even split: the children's ways in
 * are large and carry their progress, the grown-up way in is a clear but
 * secondary card. One door per language — each with its own color and
 * flag — so a returning pre-reader recognises THEIR door rather than
 * operating a switch first. Tapping a door is what chooses the language.
 */

// Each door owns a color so the doors tell apart at a glance without
// reading: Mandarin keeps the app's red, Spanish takes green.
const DOOR_STYLE: Record<LangCode, string> = {
  zh: "bg-red-600 hover:bg-red-700",
  es: "bg-emerald-600 hover:bg-emerald-700",
};

// One grown-up door per language, mirroring the kids' doors.
const GROWN_UP_DOORS = [
  {
    href: "/mandarin-grown-ups",
    title: "For grown-ups · Mandarin",
    desc: "Tones, dictionary, stroke order, flashcards",
  },
  {
    href: "/spanish-grown-ups",
    title: "For grown-ups · Spanish",
    desc: "Sounds, dictionary, accents, flashcards, mic practice",
  },
];

function KidDoor({ code, progress }: { code: LangCode; progress: Progress }) {
  const language = LANGUAGES[code];
  const lessons = lessonsFor(code);
  const done = completedCount(progress, code);
  const current = currentLessonId(progress, code);
  const currentLesson = lessons.find((l) => l.id === current)!;
  const started = done > 0;
  const stars = totalStars(progress, code);

  return (
    <Link
      href="/learn"
      onClick={() => setKidLang(code)}
      className={`flex flex-col gap-1.5 rounded-3xl p-3 text-white shadow-lg transition active:scale-[0.99] sm:gap-2 sm:p-6 ${DOOR_STYLE[code]}`}
    >
      <span className="flex items-center gap-3">
        <span className="text-3xl sm:text-5xl" aria-hidden>
          {language.flag}
        </span>
        <span>
          <span
            className="block text-xl font-bold sm:text-2xl"
            lang={language.speechLang}
          >
            {language.nativeName}
          </span>
          <span className="block text-sm opacity-90">
            Learn {language.name}
          </span>
        </span>
      </span>

      <span className="flex items-center justify-between rounded-2xl bg-white/15 px-3 py-1.5 text-sm sm:mt-1 sm:px-4 sm:py-2">
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
  );
}

export default function PathChooser() {
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getProgressServerSnapshot,
  );

  return (
    // Four doors stacked need ~460px; a phone in landscape has ~390. The
    // two groups sit side by side from sm: up, which is exactly the case
    // where height is scarce and width is not, and stack again on a
    // narrow phone in portrait, where height is plentiful. Whatever
    // still overflows pages. my-auto (not justify-center, which clips
    // its own top once content overflows) centers the doors when they fit.
    <main className="mx-auto flex w-full min-h-0 max-w-md flex-1 flex-col px-4 py-4 sm:max-w-3xl">
      <Paged className="min-h-0 flex-1">
      <div className="my-auto flex flex-col gap-3 sm:gap-4">
      <div className="shrink-0 text-center">
        <div className="text-3xl sm:text-5xl" aria-hidden>
          🐉
        </div>
        <h1 className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">
          <span lang="zh-CN">你好</span> · <span lang="es-MX">Hola</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500 sm:text-base">
          Who&apos;s learning today?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:items-start sm:gap-6">
        {/* The children's doors — primary, and the only ones showing progress. */}
        <div className="flex flex-col gap-2 sm:gap-4">
          <p className="text-center text-sm font-semibold text-zinc-500">
            🧒 For kids — tap your language
          </p>
          {LANG_CODES.map((code) => (
            <KidDoor key={code} code={code} progress={progress} />
          ))}
        </div>

        {/* The grown-up doors — clear, but deliberately quieter. Both
            languages now have a full toolkit; the lessons themselves live
            in the kid path, which is why each door's list starts with the
            tools rather than with "lessons". */}
        <div className="flex flex-col gap-2 sm:gap-4">
          <p className="text-center text-sm font-semibold text-zinc-500">
            🧑 For grown-ups
          </p>
          {GROWN_UP_DOORS.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              className="flex items-center gap-3 rounded-3xl border-2 border-zinc-200 bg-white p-3 transition hover:border-zinc-300 sm:p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <span className="text-2xl sm:text-3xl" aria-hidden>
                🧑
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold sm:text-base">
                  {door.title}
                </span>
                <span className="short-hide block text-sm text-zinc-500">
                  {door.desc}
                </span>
              </span>
              <span className="text-xl text-zinc-400" aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
      </div>
      </Paged>
    </main>
  );
}
