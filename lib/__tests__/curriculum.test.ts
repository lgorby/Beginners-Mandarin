import { describe, expect, it } from "vitest";
import {
  LESSONS,
  WORDS,
  getWord,
  lessonById,
  lessonIndex,
  lessonsFor,
  sentenceText,
  wordsTaughtBefore,
} from "@/lib/curriculum";
import { LANG_CODES } from "@/lib/languages";

describe("WORDS", () => {
  it("keys every word by its own text", () => {
    for (const [key, word] of Object.entries(WORDS)) {
      expect(word.text).toBe(key);
    }
  });

  // The merge relies on this: hanzi and Latin script cannot collide, and
  // a future language must not silently shadow an existing word.
  it("never lets two courses share a word text", () => {
    const perCourse = LANG_CODES.map(
      (lang) => Object.values(WORDS).filter((w) => w.lang === lang).length
    );
    expect(perCourse.reduce((a, b) => a + b, 0)).toBe(
      Object.keys(WORDS).length
    );
  });

  it("gives every word a unique ascii id for its picture filename", () => {
    const ids = Object.values(WORDS).map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("stores numbered pinyin on Mandarin words, never diacritics", () => {
    for (const word of Object.values(WORDS)) {
      if (word.lang === "zh") {
        expect(word.pinyin, word.text).toMatch(/^[a-zA-Z:1-5\s]+$/);
      } else {
        // A Spanish word is already its own pronunciation.
        expect(word.pinyin, word.text).toBeUndefined();
      }
    }
  });
});

describe("LESSONS", () => {
  it("covers every language and stamps each lesson with its own", () => {
    for (const lang of LANG_CODES) {
      const lessons = lessonsFor(lang);
      expect(lessons.length).toBeGreaterThan(0);
      for (const lesson of lessons) expect(lesson.lang).toBe(lang);
    }
    expect(LESSONS.length).toBe(
      LANG_CODES.reduce((n, lang) => n + lessonsFor(lang).length, 0)
    );
  });

  it("has globally unique lesson ids — progress storage relies on it", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("introduces every new word from WORDS, in the lesson's own language", () => {
    for (const lesson of LESSONS) {
      for (const text of lesson.newWords) {
        expect(WORDS[text], `${lesson.id}: ${text}`).toBeDefined();
        expect(WORDS[text].lang, `${lesson.id}: ${text}`).toBe(lesson.lang);
      }
    }
  });

  it("shows a taught word of its own language as each lesson's icon", () => {
    for (const lesson of LESSONS) {
      expect(WORDS[lesson.icon], `${lesson.id}: ${lesson.icon}`).toBeDefined();
      expect(WORDS[lesson.icon].lang).toBe(lesson.lang);
    }
  });

  it("never teaches the same word twice within a language", () => {
    for (const lang of LANG_CODES) {
      const seen = new Set<string>();
      for (const lesson of lessonsFor(lang)) {
        for (const text of lesson.newWords) {
          expect(seen.has(text), `${lesson.id}: ${text}`).toBe(false);
          seen.add(text);
        }
      }
    }
  });

  // THE GUARDRAIL — the reason the schema uses refs instead of strings.
  it("never uses a word before it is taught", () => {
    for (const lang of LANG_CODES) {
      lessonsFor(lang).forEach((lesson, i) => {
        const known = wordsTaughtBefore(lang, i);
        for (const text of lesson.newWords) known.add(text);
        for (const sentence of [lesson.build, ...lesson.swaps]) {
          for (const text of sentence.words) {
            expect(
              known.has(text),
              `Lesson ${i + 1} (${lesson.id}) uses "${text}" before it is taught`
            ).toBe(true);
          }
        }
      });
    }
  });

  it("builds sentences of at least two words", () => {
    for (const lesson of LESSONS) {
      expect(lesson.build.words.length, lesson.id).toBeGreaterThanOrEqual(2);
    }
  });

  // The 🎉 reveal after a partial build reads from ladderEn — a missing
  // gloss would leave "yo soy" assembled and unexplained.
  it("glosses every ladder prefix of a longer build sentence", () => {
    for (const lesson of LESSONS) {
      expect((lesson.ladderEn ?? []).length, lesson.id).toBe(
        Math.max(0, lesson.build.words.length - 2)
      );
      for (const en of lesson.ladderEn ?? []) {
        expect(en, lesson.id).not.toBe("");
      }
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
        const firstDiff = swap.words.findIndex((text, i) => text !== base[i]);
        expect(
          firstDiff,
          `${lesson.id}: swap "${swap.en}" is identical to the build sentence`
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("sentenceText", () => {
  it("runs Mandarin words together", () => {
    expect(sentenceText(["我", "喝", "茶"])).toBe("我喝茶");
  });

  it("separates Spanish words with spaces", () => {
    expect(sentenceText(["yo", "bebo", "té"])).toBe("yo bebo té");
  });

  it("wraps a Spanish question in ¿…? so the TTS intonation rises", () => {
    expect(sentenceText(["tú", "quieres", "té"], { question: true })).toBe(
      "¿tú quieres té?"
    );
  });

  it("leaves a Mandarin question alone — 吗 already asks it", () => {
    expect(sentenceText(["你", "喝", "茶", "吗"], { question: true })).toBe(
      "你喝茶吗"
    );
  });
});

describe("helpers", () => {
  it("looks a word up by its text in either language", () => {
    expect(getWord("猫").en).toBe("cat");
    expect(getWord("gato").en).toBe("cat");
    expect(getWord("gato").lang).toBe("es");
  });

  it("throws on an unknown word rather than returning undefined", () => {
    expect(() => getWord("龘")).toThrow();
  });

  it("finds a lesson's position within its own language", () => {
    expect(lessonIndex(lessonsFor("zh")[2].id)).toBe(2);
    expect(lessonIndex(lessonsFor("es")[2].id)).toBe(2);
    expect(lessonIndex("nope")).toBe(-1);
  });

  it("finds a lesson by id across languages", () => {
    expect(lessonById("i-drink")?.lang).toBe("zh");
    expect(lessonById("bebo")?.lang).toBe("es");
    expect(lessonById("nope")).toBeUndefined();
  });

  it("collects everything taught before a lesson, per language", () => {
    expect(wordsTaughtBefore("zh", 0).size).toBe(0);
    expect(wordsTaughtBefore("zh", 1)).toEqual(
      new Set(lessonsFor("zh")[0].newWords)
    );
    expect(wordsTaughtBefore("es", 1)).toEqual(
      new Set(lessonsFor("es")[0].newWords)
    );
  });
});
