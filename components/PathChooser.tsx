"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
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
    desc: "Lessons and first words with audio — more coming",
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
      className={`flex flex-col gap-2 rounded-3xl p-6 text-white shadow-lg transition active:scale-[0.99] ${DOOR_STYLE[code]}`}
    >
      <span className="flex items-center gap-3">
        <span className="text-5xl" aria-hidden>
          {language.flag}
        </span>
        <span>
          <span className="block text-2xl font-bold" lang={language.speechLang}>
            {language.nativeName}
          </span>
          <span className="block text-sm opacity-90">
            Learn {language.name}
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
  );
}

export default function PathChooser() {
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getProgressServerSnapshot
  );

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

      {/* The children's doors — primary, and the only ones showing progress. */}
      <div className="flex flex-col gap-4">
        <p className="text-center text-sm font-semibold text-zinc-500">
          🧒 For kids — tap your language
        </p>
        {LANG_CODES.map((code) => (
          <KidDoor key={code} code={code} progress={progress} />
        ))}
      </div>

      {/* The grown-up doors — clear, but deliberately quieter. The full
          toolkit (tones, CC-CEDICT, stroke order) only exists for
          Mandarin; the Spanish door leads to what exists so far. */}
      {GROWN_UP_DOORS.map((door) => (
        <Link
          key={door.href}
          href={door.href}
          className="flex items-center gap-3 rounded-3xl border-2 border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <span className="text-3xl" aria-hidden>
            🧑
          </span>
          <span className="flex-1">
            <span className="block font-bold">{door.title}</span>
            <span className="block text-sm text-zinc-500">{door.desc}</span>
          </span>
          <span className="text-xl text-zinc-400" aria-hidden>
            →
          </span>
        </Link>
      ))}
    </main>
  );
}
