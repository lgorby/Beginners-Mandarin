import { describe, expect, it } from "vitest";
import { LESSONS, lessonsFor } from "@/lib/curriculum";
import { LANG_CODES } from "@/lib/languages";
import { STEP_COPY, buildSteps, type Step } from "@/lib/steps";

const stepsFor = (id: string) => buildSteps(id);
const kinds = (steps: Step[]) => steps.map((s) => s.kind);

describe("buildSteps", () => {
  it("throws on an unknown lesson", () => {
    expect(() => buildSteps("nope")).toThrow();
  });

  it("starts every lesson by meeting a word", () => {
    for (const lesson of LESSONS) {
      expect(stepsFor(lesson.id)[0].kind).toBe("MEET");
    }
  });

  it("meets then says each new word, in curriculum order", () => {
    const met = (id: string) =>
      stepsFor(id)
        .filter((s) => s.kind === "MEET")
        .map((s) => (s.kind === "MEET" ? s.word : ""));
    expect(met("i-drink")).toEqual(["喝", "水", "茶"]);
    expect(met("bebo")).toEqual(["bebo", "agua", "té"]);
  });

  it("meets a word before it appears in any BUILD", () => {
    for (const lesson of LESSONS) {
      const steps = stepsFor(lesson.id);
      steps.forEach((step, i) => {
        if (step.kind !== "BUILD") return;
        for (const word of step.answer) {
          if (!lesson.newWords.includes(word)) continue;
          const metAt = steps.findIndex(
            (s, j) => j < i && s.kind === "MEET" && s.word === word
          );
          expect(
            metAt,
            `${word} used in BUILD before MEET`
          ).toBeGreaterThanOrEqual(0);
        }
      });
    }
  });

  it("ladders BUILD one prefix at a time, from two words up", () => {
    const builds = (id: string) =>
      stepsFor(id)
        .filter((s) => s.kind === "BUILD")
        .map((b) => (b.kind === "BUILD" ? b.answer : []));
    expect(builds("i-drink")).toEqual([
      ["我", "喝"],
      ["我", "喝", "茶"],
    ]);
    expect(builds("bebo")).toEqual([
      ["yo", "bebo"],
      ["yo", "bebo", "té"],
    ]);
  });

  it("emits a single BUILD for a two-word sentence", () => {
    const builds = stepsFor("hello").filter((s) => s.kind === "BUILD");
    expect(builds.map((b) => (b.kind === "BUILD" ? b.answer : []))).toEqual([
      ["你", "好"],
    ]);
  });

  it("emits one SWAP per swap sentence", () => {
    const lesson = LESSONS.find((l) => l.id === "i-am")!;
    const swaps = stepsFor("i-am").filter((s) => s.kind === "SWAP");
    expect(swaps).toHaveLength(lesson.swaps.length);
  });

  it("blanks exactly one slot in a SWAP", () => {
    for (const lesson of LESSONS) {
      for (const step of stepsFor(lesson.id)) {
        if (step.kind !== "SWAP") continue;
        expect(step.answer).toBe(step.sentence[step.blankAt]);
        expect(step.choices).toContain(step.answer);
        expect(new Set(step.choices).size).toBe(step.choices.length);
      }
    }
  });

  it("ends every lesson by saying the whole sentence", () => {
    for (const lesson of LESSONS) {
      const steps = stepsFor(lesson.id);
      const last = steps[steps.length - 1];
      expect(last.kind).toBe("SAY");
      expect(last.kind === "SAY" && last.words).toEqual(lesson.build.words);
    }
  });

  it("only ever offers words the child already knows as MATCH distractors", () => {
    for (const lang of LANG_CODES) {
      const lessons = lessonsFor(lang);
      lessons.forEach((lesson, i) => {
        const known = new Set([
          ...Array.from({ length: i }, (_, j) => lessons[j].newWords).flat(),
          ...lesson.newWords,
        ]);
        for (const step of stepsFor(lesson.id)) {
          if (step.kind !== "MATCH") continue;
          for (const choice of step.choices)
            expect(known.has(choice), `${lesson.id}: ${choice}`).toBe(true);
        }
      });
    }
  });

  it("never mixes languages within one lesson's steps", () => {
    for (const lesson of LESSONS) {
      const own = new Set(
        lessonsFor(lesson.lang).flatMap((l) => l.newWords)
      );
      for (const step of stepsFor(lesson.id)) {
        const words =
          step.kind === "MEET"
            ? [step.word]
            : step.kind === "MATCH"
              ? step.choices
              : step.kind === "SAY"
                ? step.words
                : step.kind === "BUILD"
                  ? step.answer
                  : [...step.sentence, ...step.choices];
        for (const word of words)
          expect(own.has(word), `${lesson.id}: ${word}`).toBe(true);
      }
    }
  });

  it("emits no MATCH when a lesson teaches fewer than two words", () => {
    expect(kinds(stepsFor("asking"))).not.toContain("MATCH"); // 吗 only
    expect(kinds(stepsFor("saying-no"))).not.toContain("MATCH"); // 不 only
    expect(kinds(stepsFor("no"))).not.toContain("MATCH"); // Spanish "no" only
  });

  it("is deterministic — the same lesson yields the same steps", () => {
    expect(stepsFor("i-like")).toEqual(stepsFor("i-like"));
    expect(stepsFor("quiero")).toEqual(stepsFor("quiero"));
  });

  // A lesson that teaches one word exists to drill that word. Blanking the
  // first difference instead made lesson 6 ask about 喝 and 是 and never
  // once about 吗 — green tests, wrong teaching.
  it("drills the taught word when a lesson teaches only one", () => {
    for (const id of ["asking", "saying-no", "no"]) {
      const lesson = LESSONS.find((l) => l.id === id)!;
      const drilled = lesson.newWords[0];
      const swaps = stepsFor(id).filter((s) => s.kind === "SWAP");
      expect(swaps.length).toBeGreaterThan(0);
      for (const step of swaps) {
        if (step.kind !== "SWAP") continue;
        expect(step.answer, `${id} should blank ${drilled}`).toBe(drilled);
      }
    }
  });

  // Taking the earliest-taught words offered 你 and 好 in every single
  // exercise, teaching "never pick the first two" instead of the word.
  it("does not reuse the same two distractors everywhere", () => {
    for (const lang of LANG_CODES) {
      const distractors = new Set<string>();
      for (const lesson of lessonsFor(lang)) {
        for (const step of stepsFor(lesson.id)) {
          if (step.kind !== "MATCH" && step.kind !== "SWAP") continue;
          for (const choice of step.choices) {
            if (choice !== step.answer) distractors.add(choice);
          }
        }
      }
      expect(distractors.size, lang).toBeGreaterThan(6);
    }
  });

  it("offers distractors that fit the blank's slot where it can", () => {
    // Lesson 10 swaps the subject; the alternatives should be subjects
    // drawn from the lesson's own sentences, not arbitrary vocabulary.
    const swap = stepsFor("going").find(
      (s) => s.kind === "SWAP" && s.blankAt === 0
    );
    expect(swap?.kind).toBe("SWAP");
    if (swap?.kind !== "SWAP") return;
    expect(swap.choices).toContain("我");
  });
});

describe("STEP_COPY", () => {
  it("covers every step kind exactly once", () => {
    expect(Object.keys(STEP_COPY).sort()).toEqual(
      ["BUILD", "MATCH", "MEET", "SAY", "SWAP"].sort()
    );
  });
});
