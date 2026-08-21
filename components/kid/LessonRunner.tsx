"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BuildStep from "./steps/BuildStep";
import MatchStep from "./steps/MatchStep";
import MeetStep from "./steps/MeetStep";
import SayStep from "./steps/SayStep";
import SwapStep from "./steps/SwapStep";
import { lessonById, lessonIndex, lessonsFor } from "@/lib/curriculum";
import { buildSteps } from "@/lib/steps";
import {
  awardStars,
  completeLesson,
  getProgressSnapshot,
  saveProgress,
} from "@/lib/progress";
import { setKidLang } from "@/lib/langPref";

export default function LessonRunner({ lessonId }: { lessonId: string }) {
  const steps = useMemo(() => buildSteps(lessonId), [lessonId]);
  const [index, setIndex] = useState(0);
  const [cleanMatches, setCleanMatches] = useState(true);
  const [allSpoken, setAllSpoken] = useState(true);
  const [stars, setStars] = useState<number | null>(null);

  const lesson = lessonById(lessonId)!;
  const next = lessonsFor(lesson.lang)[lessonIndex(lessonId) + 1];

  // Deep-linking a lesson pulls the whole path into its language, so
  // "Back to the map" always lands on the map this lesson came from.
  useEffect(() => {
    setKidLang(lesson.lang);
  }, [lesson.lang]);

  const onDone = (r: { correct: boolean; spoken: boolean }) => {
    const step = steps[index];
    if (!r.correct) setCleanMatches(false);
    if (step.kind === "SAY" && !r.spoken) setAllSpoken(false);

    if (index + 1 < steps.length) {
      setIndex(index + 1);
      return;
    }
    // This is the last step, so fold its result in directly — the state
    // updates above will not have applied yet.
    const earned = awardStars({
      cleanMatches: r.correct && cleanMatches,
      allSpoken: (step.kind !== "SAY" || r.spoken) && allSpoken,
    });
    saveProgress(completeLesson(getProgressSnapshot(), lessonId, earned));
    setStars(earned);
  };

  if (stars !== null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-4 text-center sm:gap-8">
        <p className="text-4xl sm:text-6xl">🎉</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
        <p
          className="text-3xl sm:text-5xl"
          aria-label={`${stars} out of 3 stars`}
        >
          {"⭐".repeat(stars)}
          <span className="opacity-20">{"⭐".repeat(3 - stars)}</span>
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          {next && (
            <Link
              href={`/learn/${next.id}`}
              className="rounded-full bg-red-600 px-8 py-3 text-lg font-bold text-white sm:py-5 sm:text-xl"
            >
              Keep going →
            </Link>
          )}
          <Link
            href="/learn"
            className="rounded-full border-4 border-zinc-200 px-8 py-2.5 font-semibold sm:py-4 sm:text-lg dark:border-zinc-700"
          >
            Back to the map
          </Link>
        </div>
      </div>
    );
  }

  const step = steps[index];
  const progress = Math.round((index / steps.length) * 100);
  // Going back never rewinds results: cleanMatches/allSpoken keep what
  // already happened, and stars only ever go up anyway.
  const onBack = index > 0 ? () => setIndex(index - 1) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 px-3 py-2 sm:px-4 sm:py-3">
        <Link
          href="/learn"
          aria-label="Back to the map"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-zinc-200 bg-white text-xl font-bold shadow-sm sm:h-12 sm:w-12 sm:text-2xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          ←
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200 sm:h-4 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* key={index} resets each step's internal state on advance. */}
      {step.kind === "MEET" && (
        <MeetStep key={index} step={step} onDone={onDone} onBack={onBack} />
      )}
      {step.kind === "MATCH" && (
        <MatchStep key={index} step={step} onDone={onDone} onBack={onBack} />
      )}
      {step.kind === "SAY" && (
        <SayStep key={index} step={step} onDone={onDone} onBack={onBack} />
      )}
      {step.kind === "BUILD" && (
        <BuildStep key={index} step={step} onDone={onDone} onBack={onBack} />
      )}
      {step.kind === "SWAP" && (
        <SwapStep key={index} step={step} onDone={onDone} onBack={onBack} />
      )}
    </div>
  );
}
