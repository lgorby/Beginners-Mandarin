import { beforeEach, describe, expect, it, vi } from "vitest";
import { LESSONS } from "@/lib/curriculum";
import {
  PROGRESS_KEY,
  awardStars,
  completeLesson,
  completedCount,
  currentLessonId,
  getProgressServerSnapshot,
  getProgressSnapshot,
  isUnlocked,
  readProgress,
  reloadProgress,
  saveProgress,
  starsFor,
  subscribeProgress,
  writeProgress,
  type Progress,
} from "@/lib/progress";

const EMPTY: Progress = { completed: {} };

// Minimal localStorage stand-in — the suite runs without a DOM.
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  reloadProgress();
});

describe("currentLessonId", () => {
  it("is the first lesson on a fresh install", () => {
    expect(currentLessonId(EMPTY)).toBe(LESSONS[0].id);
  });

  it("advances to the first lesson not completed", () => {
    const p = completeLesson(EMPTY, LESSONS[0].id, 3);
    expect(currentLessonId(p)).toBe(LESSONS[1].id);
  });

  it("stays on the last lesson once everything is done", () => {
    const p = LESSONS.reduce((acc, l) => completeLesson(acc, l.id, 3), EMPTY);
    expect(currentLessonId(p)).toBe(LESSONS[LESSONS.length - 1].id);
  });
});

describe("completedCount", () => {
  it("is zero on a fresh install", () => {
    expect(completedCount(EMPTY)).toBe(0);
  });

  it("counts finished lessons", () => {
    let p = completeLesson(EMPTY, LESSONS[0].id, 1);
    p = completeLesson(p, LESSONS[1].id, 3);
    expect(completedCount(p)).toBe(2);
  });

  it("does not double-count a replayed lesson", () => {
    let p = completeLesson(EMPTY, LESSONS[0].id, 1);
    p = completeLesson(p, LESSONS[0].id, 3);
    expect(completedCount(p)).toBe(1);
  });
});

describe("isUnlocked", () => {
  it("unlocks only the first lesson on a fresh install", () => {
    expect(isUnlocked(EMPTY, LESSONS[0].id)).toBe(true);
    expect(isUnlocked(EMPTY, LESSONS[1].id)).toBe(false);
  });

  it("keeps completed lessons unlocked so they can be replayed", () => {
    const p = completeLesson(EMPTY, LESSONS[0].id, 1);
    expect(isUnlocked(p, LESSONS[0].id)).toBe(true);
    expect(isUnlocked(p, LESSONS[1].id)).toBe(true);
    expect(isUnlocked(p, LESSONS[2].id)).toBe(false);
  });

  it("rejects a lesson that is not in the curriculum", () => {
    expect(isUnlocked(EMPTY, "nope")).toBe(false);
  });
});

describe("completeLesson", () => {
  it("never lowers an existing star count", () => {
    let p = completeLesson(EMPTY, LESSONS[0].id, 3);
    p = completeLesson(p, LESSONS[0].id, 1);
    expect(starsFor(p, LESSONS[0].id)).toBe(3);
  });

  it("does not mutate the progress it is given", () => {
    const before = JSON.stringify(EMPTY);
    completeLesson(EMPTY, LESSONS[0].id, 2);
    expect(JSON.stringify(EMPTY)).toBe(before);
  });
});

describe("awardStars", () => {
  it("gives one star just for finishing", () => {
    expect(awardStars({ cleanMatches: false, allSpoken: false })).toBe(1);
  });

  it("adds a star for a clean run and for speaking every prompt", () => {
    expect(awardStars({ cleanMatches: true, allSpoken: true })).toBe(3);
  });
});

describe("readProgress", () => {
  it("returns empty progress when storage is empty", () => {
    expect(readProgress()).toEqual(EMPTY);
  });

  it("recovers from corrupt storage instead of throwing", () => {
    localStorage.setItem(PROGRESS_KEY, "{not json");
    expect(readProgress()).toEqual(EMPTY);
  });

  it("discards a stored shape that is not progress", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ completed: 42 }));
    expect(readProgress()).toEqual(EMPTY);
  });

  it("drops lessons that no longer exist in the curriculum", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ completed: { "deleted-lesson": { stars: 3, at: 1 } } })
    );
    expect(readProgress()).toEqual(EMPTY);
  });

  it("round-trips real progress", () => {
    writeProgress(completeLesson(EMPTY, LESSONS[0].id, 2));
    expect(starsFor(readProgress(), LESSONS[0].id)).toBe(2);
  });
});

describe("progress store", () => {
  it("notifies subscribers when progress is saved", () => {
    let notified = 0;
    const unsubscribe = subscribeProgress(() => notified++);
    saveProgress(completeLesson(EMPTY, LESSONS[0].id, 1));
    expect(notified).toBe(1);
    unsubscribe();
    saveProgress(completeLesson(EMPTY, LESSONS[1].id, 1));
    expect(notified).toBe(1);
  });

  it("returns the same reference until progress changes", () => {
    // useSyncExternalStore compares by reference — an unstable snapshot
    // would re-render forever.
    expect(getProgressSnapshot()).toBe(getProgressSnapshot());
  });

  it("exposes a saved value through the snapshot", () => {
    saveProgress(completeLesson(EMPTY, LESSONS[0].id, 2));
    expect(starsFor(getProgressSnapshot(), LESSONS[0].id)).toBe(2);
  });

  it("re-reads storage after reloadProgress", () => {
    saveProgress(completeLesson(EMPTY, LESSONS[0].id, 2));
    localStorage.removeItem(PROGRESS_KEY);
    reloadProgress();
    expect(getProgressSnapshot()).toEqual(EMPTY);
  });

  it("serves neutral progress to server renders", () => {
    expect(getProgressServerSnapshot()).toEqual(EMPTY);
  });
});
