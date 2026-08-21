"use client";

// The child's place inside a lesson, so closing the app mid-lesson
// resumes at the same step instead of starting the lesson over. One
// bookmark, not one per lesson — "the lesson in progress" is the only
// place worth returning to. Deliberately NOT part of lib/progress.ts:
// `completed` stays the SSOT for the path, and this record is erased
// the moment a lesson finishes, so the two can never disagree about
// where the child is.

import { createClientStore } from "./clientStore";
import { lessonIndex } from "./curriculum";

// "mandarin-" prefix matches the other kid keys (see PROGRESS_KEY).
export const RESUME_KEY = "mandarin-kid-resume-v1";

export interface ResumePoint {
  lessonId: string;
  /** Index into buildSteps(lessonId) — the step to land on. */
  step: number;
  /** Star flags carried across the interruption (see awardStars). */
  cleanMatches: boolean;
  allSpoken: boolean;
}

function isValid(value: unknown): value is ResumePoint {
  if (typeof value !== "object" || value === null) return false;
  const p = value as ResumePoint;
  return (
    typeof p.lessonId === "string" &&
    lessonIndex(p.lessonId) >= 0 &&
    Number.isInteger(p.step) &&
    p.step >= 0 &&
    typeof p.cleanMatches === "boolean" &&
    typeof p.allSpoken === "boolean"
  );
}

/** Never throws. Corrupt or stale storage resolves to no bookmark. */
export function readResume(): ResumePoint | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const store = createClientStore<ResumePoint | null>(readResume, null);

export const subscribeResume = store.subscribe;
export const getResumeSnapshot = store.getSnapshot;
export const getResumeServerSnapshot = store.getServerSnapshot;

/** Persist the bookmark and tell every subscribed component. */
export function saveResume(p: ResumePoint): void {
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(p));
  } catch {
    // Storage unavailable — the place just won't survive a reload.
  }
  store.set(p);
}

/** Forget the bookmark (lesson finished, or a full reset). */
export function clearResume(): void {
  try {
    localStorage.removeItem(RESUME_KEY);
  } catch {
    // nothing to clear
  }
  store.set(null);
}

/** Drop the cached snapshot so the next read hits storage again. */
export function reloadResume(): void {
  store.invalidate();
}
