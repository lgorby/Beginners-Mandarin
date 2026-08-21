"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRetryKey } from "@/lib/useArrowNav";
import Paged from "@/components/Paged";
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
import {
  clearResume,
  getResumeServerSnapshot,
  getResumeSnapshot,
  saveResume,
  subscribeResume,
} from "@/lib/resume";
import { setKidLang } from "@/lib/langPref";

export default function LessonRunner({ lessonId }: { lessonId: string }) {
  const steps = useMemo(() => buildSteps(lessonId), [lessonId]);
  // The step index and star flags live in the resume bookmark, not in
  // useState, so closing the app mid-lesson comes back to the same step.
  // The server snapshot is null, so the first paint shows step one and
  // useSyncExternalStore moves to the saved step right after hydration.
  const resume = useSyncExternalStore(
    subscribeResume,
    getResumeSnapshot,
    getResumeServerSnapshot,
  );
  // A bookmark for a different lesson is someone else's place, not ours.
  const here = resume?.lessonId === lessonId ? resume : null;
  // Clamp: a curriculum edit can shorten a lesson under a saved bookmark.
  const index = Math.min(here?.step ?? 0, steps.length - 1);
  const cleanMatches = here?.cleanMatches ?? true;
  const allSpoken = here?.allSpoken ?? true;
  const [stars, setStars] = useState<number | null>(null);

  const lesson = lessonById(lessonId)!;
  const next = lessonsFor(lesson.lang)[lessonIndex(lessonId) + 1];

  // On the celebration screen Enter/Space keeps going, same as the red
  // button. Unbound during the lesson itself — SayStep owns the key
  // there (one ACT binding per screen).
  const router = useRouter();
  useRetryKey(
    stars !== null
      ? () => router.push(next ? `/learn/${next.id}` : "/learn")
      : undefined,
  );

  // Deep-linking a lesson pulls the whole path into its language, so
  // "Back to the map" always lands on the map this lesson came from.
  useEffect(() => {
    setKidLang(lesson.lang);
  }, [lesson.lang]);

  const onDone = (r: { correct: boolean; spoken: boolean }) => {
    const step = steps[index];
    const clean = cleanMatches && r.correct;
    const spoken = allSpoken && (step.kind !== "SAY" || r.spoken);

    if (index + 1 < steps.length) {
      saveResume({
        lessonId,
        step: index + 1,
        cleanMatches: clean,
        allSpoken: spoken,
      });
      return;
    }
    const earned = awardStars({ cleanMatches: clean, allSpoken: spoken });
    saveProgress(completeLesson(getProgressSnapshot(), lessonId, earned));
    clearResume(); // finished — nothing left to come back to
    setStars(earned);
  };

  if (stars !== null) {
    return (
      <Paged className="min-h-0 flex-1 px-4">
        <div className="my-auto flex flex-col items-center gap-4 text-center sm:gap-8">
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
      </Paged>
    );
  }

  const step = steps[index];
  const progress = Math.round((index / steps.length) * 100);
  // Going back never rewinds results: cleanMatches/allSpoken keep what
  // already happened, and stars only ever go up anyway.
  const onBack =
    index > 0
      ? () => saveResume({ lessonId, step: index - 1, cleanMatches, allSpoken })
      : undefined;

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
