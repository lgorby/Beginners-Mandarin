"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BuildStep from "./steps/BuildStep";
import MatchStep from "./steps/MatchStep";
import MeetStep from "./steps/MeetStep";
import SayStep from "./steps/SayStep";
import SwapStep from "./steps/SwapStep";
import { LESSONS, lessonIndex } from "@/lib/curriculum";
import { buildSteps } from "@/lib/steps";
import {
  awardStars,
  completeLesson,
  getProgressSnapshot,
  saveProgress,
} from "@/lib/progress";

export default function LessonRunner({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const steps = useMemo(() => buildSteps(lessonId), [lessonId]);
  const [index, setIndex] = useState(0);
  const [cleanMatches, setCleanMatches] = useState(true);
  const [allSpoken, setAllSpoken] = useState(true);
  const [stars, setStars] = useState<number | null>(null);

  const lesson = LESSONS[lessonIndex(lessonId)];
  const next = LESSONS[lessonIndex(lessonId) + 1];

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
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 text-center">
        <p className="text-6xl">🎉</p>
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <p className="text-5xl" aria-label={`${stars} out of 3 stars`}>
          {"⭐".repeat(stars)}
          <span className="opacity-20">{"⭐".repeat(3 - stars)}</span>
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          {next && (
            <Link
              href={`/learn/${next.id}`}
              className="rounded-full bg-red-600 px-8 py-5 text-xl font-bold text-white"
            >
              Keep going →
            </Link>
          )}
          <Link
            href="/learn"
            className="rounded-full border-4 border-zinc-200 px-8 py-4 text-lg font-semibold dark:border-zinc-700"
          >
            Back to the map
          </Link>
        </div>
      </div>
    );
  }

  const step = steps[index];
  const progress = Math.round((index / steps.length) * 100);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/learn")}
          aria-label="Close the lesson"
          className="text-2xl text-zinc-400"
        >
          ✕
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* key={index} resets each step's internal state on advance. */}
      {step.kind === "MEET" && (
        <MeetStep key={index} step={step} onDone={onDone} />
      )}
      {step.kind === "MATCH" && (
        <MatchStep key={index} step={step} onDone={onDone} />
      )}
      {step.kind === "SAY" && (
        <SayStep key={index} step={step} onDone={onDone} />
      )}
      {step.kind === "BUILD" && (
        <BuildStep key={index} step={step} onDone={onDone} />
      )}
      {step.kind === "SWAP" && (
        <SwapStep key={index} step={step} onDone={onDone} />
      )}
    </div>
  );
}
