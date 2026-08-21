import { beforeEach, describe, expect, it, vi } from "vitest";
import { lessonsFor } from "@/lib/curriculum";
import {
  RESUME_KEY,
  clearResume,
  getResumeServerSnapshot,
  getResumeSnapshot,
  readResume,
  reloadResume,
  saveResume,
  subscribeResume,
  type ResumePoint,
} from "@/lib/resume";

const ZH = lessonsFor("zh");
const POINT: ResumePoint = {
  lessonId: ZH[1].id,
  step: 4,
  cleanMatches: true,
  allSpoken: false,
};

// Minimal localStorage stand-in — the suite runs without a DOM.
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  reloadResume();
});

describe("readResume", () => {
  it("returns no bookmark when storage is empty", () => {
    expect(readResume()).toBeNull();
  });

  it("round-trips a bookmark", () => {
    saveResume(POINT);
    expect(readResume()).toEqual(POINT);
  });

  it("recovers from corrupt storage instead of throwing", () => {
    localStorage.setItem(RESUME_KEY, "{not json");
    expect(readResume()).toBeNull();
  });

  it("discards a bookmark for a lesson that no longer exists", () => {
    localStorage.setItem(
      RESUME_KEY,
      JSON.stringify({ ...POINT, lessonId: "deleted-lesson" })
    );
    expect(readResume()).toBeNull();
  });

  it("discards a step that is negative or not an integer", () => {
    localStorage.setItem(RESUME_KEY, JSON.stringify({ ...POINT, step: -1 }));
    expect(readResume()).toBeNull();
    localStorage.setItem(RESUME_KEY, JSON.stringify({ ...POINT, step: 1.5 }));
    expect(readResume()).toBeNull();
  });
});

describe("resume store", () => {
  it("clears both storage and the snapshot", () => {
    saveResume(POINT);
    clearResume();
    expect(localStorage.getItem(RESUME_KEY)).toBeNull();
    expect(getResumeSnapshot()).toBeNull();
  });

  it("notifies subscribers when the bookmark moves", () => {
    let notified = 0;
    const unsubscribe = subscribeResume(() => notified++);
    saveResume(POINT);
    expect(notified).toBe(1);
    unsubscribe();
    clearResume();
    expect(notified).toBe(1);
  });

  it("returns the same reference until the bookmark changes", () => {
    saveResume(POINT);
    expect(getResumeSnapshot()).toBe(getResumeSnapshot());
  });

  it("re-reads storage after reloadResume", () => {
    saveResume(POINT);
    localStorage.removeItem(RESUME_KEY);
    reloadResume();
    expect(getResumeSnapshot()).toBeNull();
  });

  it("serves no bookmark to server renders", () => {
    expect(getResumeServerSnapshot()).toBeNull();
  });
});
