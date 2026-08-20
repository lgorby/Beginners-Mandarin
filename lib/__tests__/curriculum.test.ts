import { describe, expect, it } from "vitest";
import {
  LESSONS,
  WORDS,
  getWord,
  lessonIndex,
  wordsTaughtBefore,
} from "@/lib/curriculum";

describe("WORDS", () => {
  it("keys every word by its own characters", () => {
    for (const [key, word] of Object.entries(WORDS)) {
      expect(word.zh).toBe(key);
    }
  });

  it("gives every word a unique ascii id for its picture filename", () => {
    const ids = Object.values(WORDS).map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("stores numbered pinyin, never diacritics", () => {
    for (const word of Object.values(WORDS)) {
      expect(word.pinyin).toMatch(/^[a-zA-Z:1-5\s]+$/);
    }
  });
});

describe("LESSONS", () => {
  it("introduces every new word from WORDS", () => {
    for (const lesson of LESSONS) {
      for (const zh of lesson.newWords) expect(WORDS[zh]).toBeDefined();
    }
  });

  it("never teaches the same word twice", () => {
    const seen = new Set<string>();
    for (const lesson of LESSONS) {
      for (const zh of lesson.newWords) {
        expect(seen.has(zh)).toBe(false);
        seen.add(zh);
      }
    }
  });

  // THE GUARDRAIL — the reason the schema uses refs instead of strings.
  it("never uses a word before it is taught", () => {
    LESSONS.forEach((lesson, i) => {
      const known = wordsTaughtBefore(i);
      for (const zh of lesson.newWords) known.add(zh);
      for (const sentence of [lesson.build, ...lesson.swaps]) {
        for (const zh of sentence.words) {
          expect(
            known.has(zh),
            `Lesson ${i + 1} (${lesson.id}) uses "${zh}" before it is taught`
          ).toBe(true);
        }
      }
    });
  });

  it("builds sentences of at least two words", () => {
    for (const lesson of LESSONS) {
      expect(lesson.build.words.length).toBeGreaterThanOrEqual(2);
    }
  });

  // Every swap must differ somewhere, or SWAP has no slot to blank.
  // Note it may differ in MORE than one place: lesson 6's 你喝茶吗
  // differs from 你喜欢猫吗 in two positions. buildSteps blanks the
  // FIRST difference, which is always a valid exercise.
  it("makes every swap differ from the sentence it is built from", () => {
    for (const lesson of LESSONS) {
      for (const swap of lesson.swaps) {
        const base = lesson.build.words;
        const firstDiff = swap.words.findIndex((zh, i) => zh !== base[i]);
        expect(
          firstDiff,
          `${lesson.id}: swap "${swap.en}" is identical to the build sentence`
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("has unique lesson ids", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("helpers", () => {
  it("looks a word up by characters", () => {
    expect(getWord("猫").en).toBe("cat");
  });

  it("throws on an unknown word rather than returning undefined", () => {
    expect(() => getWord("龘")).toThrow();
  });

  it("finds a lesson's position", () => {
    expect(lessonIndex(LESSONS[2].id)).toBe(2);
    expect(lessonIndex("nope")).toBe(-1);
  });

  it("collects everything taught before a lesson", () => {
    expect(wordsTaughtBefore(0).size).toBe(0);
    expect(wordsTaughtBefore(1)).toEqual(new Set(LESSONS[0].newWords));
  });
});
