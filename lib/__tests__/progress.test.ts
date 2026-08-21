import { beforeEach, describe, expect, it, vi } from "vitest";
import { lessonsFor } from "@/lib/curriculum";
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
  totalStars,
  writeProgress,
  type Progress,
} from "@/lib/progress";

const EMPTY: Progress = { completed: {} };
const ZH = lessonsFor("zh");
const ES = lessonsFor("es");

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
  it("is the first lesson on a fresh install, in each language", () => {
    expect(currentLessonId(EMPTY, "zh")).toBe(ZH[0].id);
    expect(currentLessonId(EMPTY, "es")).toBe(ES[0].id);
  });

  it("advances to the first lesson not completed", () => {
    const p = completeLesson(EMPTY, ZH[0].id, 3);
    expect(currentLessonId(p, "zh")).toBe(ZH[1].id);
  });

  it("keeps each language's position independent", () => {
    const p = completeLesson(EMPTY, ZH[0].id, 3);
    expect(currentLessonId(p, "es")).toBe(ES[0].id);
  });

  it("stays on the last lesson once everything is done", () => {
    const p = ZH.reduce((acc, l) => completeLesson(acc, l.id, 3), EMPTY);
    expect(currentLessonId(p, "zh")).toBe(ZH[ZH.length - 1].id);
  });
});

describe("completedCount", () => {
  it("is zero on a fresh install", () => {
    expect(completedCount(EMPTY, "zh")).toBe(0);
    expect(completedCount(EMPTY, "es")).toBe(0);
  });

  it("counts finished lessons in one language only", () => {
    let p = completeLesson(EMPTY, ZH[0].id, 1);
    p = completeLesson(p, ZH[1].id, 3);
    p = completeLesson(p, ES[0].id, 3);
    expect(completedCount(p, "zh")).toBe(2);
    expect(completedCount(p, "es")).toBe(1);
  });

  it("does not double-count a replayed lesson", () => {
    let p = completeLesson(EMPTY, ZH[0].id, 1);
    p = completeLesson(p, ZH[0].id, 3);
    expect(completedCount(p, "zh")).toBe(1);
  });
});

describe("totalStars", () => {
  it("sums stars within one language only", () => {
    let p = completeLesson(EMPTY, ZH[0].id, 2);
    p = completeLesson(p, ES[0].id, 3);
    expect(totalStars(p, "zh")).toBe(2);
    expect(totalStars(p, "es")).toBe(3);
  });
});

describe("isUnlocked", () => {
  it("unlocks only the first lesson on a fresh install", () => {
    expect(isUnlocked(EMPTY, ZH[0].id)).toBe(true);
    expect(isUnlocked(EMPTY, ZH[1].id)).toBe(false);
    expect(isUnlocked(EMPTY, ES[0].id)).toBe(true);
    expect(isUnlocked(EMPTY, ES[1].id)).toBe(false);
  });

  it("keeps completed lessons unlocked so they can be replayed", () => {
    const p = completeLesson(EMPTY, ZH[0].id, 1);
    expect(isUnlocked(p, ZH[0].id)).toBe(true);
    expect(isUnlocked(p, ZH[1].id)).toBe(true);
    expect(isUnlocked(p, ZH[2].id)).toBe(false);
  });

  it("never lets one language's progress unlock the other's lessons", () => {
    const p = ZH.reduce((acc, l) => completeLesson(acc, l.id, 3), EMPTY);
    expect(isUnlocked(p, ES[1].id)).toBe(false);
  });

  it("rejects a lesson that is not in any curriculum", () => {
    expect(isUnlocked(EMPTY, "nope")).toBe(false);
  });
});

describe("completeLesson", () => {
  it("never lowers an existing star count", () => {
    let p = completeLesson(EMPTY, ZH[0].id, 3);
    p = completeLesson(p, ZH[0].id, 1);
    expect(starsFor(p, ZH[0].id)).toBe(3);
  });

  it("does not mutate the progress it is given", () => {
    const before = JSON.stringify(EMPTY);
    completeLesson(EMPTY, ZH[0].id, 2);
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

  it("drops lessons that no longer exist in any curriculum", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ completed: { "deleted-lesson": { stars: 3, at: 1 } } })
    );
    expect(readProgress()).toEqual(EMPTY);
  });

  it("round-trips real progress in both languages", () => {
    let p = completeLesson(EMPTY, ZH[0].id, 2);
    p = completeLesson(p, ES[0].id, 3);
    writeProgress(p);
    expect(starsFor(readProgress(), ZH[0].id)).toBe(2);
    expect(starsFor(readProgress(), ES[0].id)).toBe(3);
  });
});

describe("progress store", () => {
  it("notifies subscribers when progress is saved", () => {
    let notified = 0;
    const unsubscribe = subscribeProgress(() => notified++);
    saveProgress(completeLesson(EMPTY, ZH[0].id, 1));
    expect(notified).toBe(1);
    unsubscribe();
    saveProgress(completeLesson(EMPTY, ZH[1].id, 1));
    expect(notified).toBe(1);
  });

  it("returns the same reference until progress changes", () => {
    // useSyncExternalStore compares by reference — an unstable snapshot
    // would re-render forever.
    expect(getProgressSnapshot()).toBe(getProgressSnapshot());
  });

  it("exposes a saved value through the snapshot", () => {
    saveProgress(completeLesson(EMPTY, ZH[0].id, 2));
    expect(starsFor(getProgressSnapshot(), ZH[0].id)).toBe(2);
  });

  it("re-reads storage after reloadProgress", () => {
    saveProgress(completeLesson(EMPTY, ZH[0].id, 2));
    localStorage.removeItem(PROGRESS_KEY);
    reloadProgress();
    expect(getProgressSnapshot()).toEqual(EMPTY);
  });

  it("serves neutral progress to server renders", () => {
    expect(getProgressServerSnapshot()).toEqual(EMPTY);
  });
});
