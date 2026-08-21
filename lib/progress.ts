// Kid-path progress. Deliberately separate from the grown-up flashcard
// store ("mandarin-srs-v1") so the two never interfere.
//
// SSOT: only `completed` is persisted. The current lesson and the lock
// state are DERIVED from it, so they can never drift out of sync.

import { createClientStore } from "./clientStore";
import { lessonById, lessonIndex, lessonsFor } from "./curriculum";
import type { LangCode } from "./languages";

// One store for every language: lesson ids are globally unique, so a
// Spanish path and a Mandarin path never collide in `completed`. (The
// key predates the second language — renaming it would orphan progress.)
export const PROGRESS_KEY = "mandarin-kid-v1";

export interface Progress {
  completed: Record<string, { stars: number; at: number }>;
}

const EMPTY: Progress = { completed: {} };

/** The child can always reach the first unfinished lesson, and no further. */
export function currentLessonId(p: Progress, lang: LangCode): string {
  const lessons = lessonsFor(lang);
  const next = lessons.find((l) => !p.completed[l.id]);
  return (next ?? lessons[lessons.length - 1]).id;
}

export function isUnlocked(p: Progress, id: string): boolean {
  const lesson = lessonById(id);
  if (!lesson) return false;
  return lessonIndex(id) <= lessonIndex(currentLessonId(p, lesson.lang));
}

/** Finished lessons in one language. Replaying one does not count twice. */
export function completedCount(p: Progress, lang: LangCode): number {
  return lessonsFor(lang).filter((l) => Boolean(p.completed[l.id])).length;
}

/** Stars earned across one language's path. */
export function totalStars(p: Progress, lang: LangCode): number {
  return lessonsFor(lang).reduce((n, l) => n + starsFor(p, l.id), 0);
}

export function starsFor(p: Progress, id: string): number {
  return p.completed[id]?.stars ?? 0;
}

/** Returns new progress; never mutates. Stars only ever go up. */
export function completeLesson(
  p: Progress,
  id: string,
  stars: number,
  at: number = Date.now()
): Progress {
  const best = Math.max(stars, starsFor(p, id));
  return { completed: { ...p.completed, [id]: { stars: best, at } } };
}

/** One star for finishing, one for a clean run, one for speaking throughout. */
export function awardStars(opts: {
  cleanMatches: boolean;
  allSpoken: boolean;
}): number {
  return 1 + (opts.cleanMatches ? 1 : 0) + (opts.allSpoken ? 1 : 0);
}

function isValid(value: unknown): value is Progress {
  if (typeof value !== "object" || value === null) return false;
  const completed = (value as Progress).completed;
  if (typeof completed !== "object" || completed === null) return false;
  return Object.entries(completed).every(
    ([id, entry]) =>
      lessonIndex(id) >= 0 &&
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as { stars: unknown }).stars === "number"
  );
}

/** Never throws. Corrupt or stale storage resolves to a fresh start. */
export function readProgress(): Progress {
  if (typeof localStorage === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function writeProgress(p: Progress): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    // Storage unavailable (private mode, quota) — progress just won't persist.
  }
}

// --- Store layer, so components never setState inside an effect ---------

const store = createClientStore<Progress>(readProgress, EMPTY);

export const subscribeProgress = store.subscribe;
export const getProgressSnapshot = store.getSnapshot;
export const getProgressServerSnapshot = store.getServerSnapshot;

/** Persist progress and tell every subscribed component. */
export function saveProgress(p: Progress): void {
  writeProgress(p);
  store.set(p);
}

/** Drop the cached snapshot so the next read hits storage again. */
export function reloadProgress(): void {
  store.invalidate();
}
