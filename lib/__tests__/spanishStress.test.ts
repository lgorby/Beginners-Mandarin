import { describe, expect, it } from "vitest";
import { bare, QUIZ, stressByRule, wordOf } from "../spanishStress";

describe("bare", () => {
  it("strips the accent that would give the answer away", () => {
    expect(bare("lé")).toBe("le");
    expect(bare("zón")).toBe("zon");
    expect(bare("mú")).toBe("mu");
    expect(bare("fá")).toBe("fa");
    expect(bare("ár")).toBe("ar");
  });

  it("leaves an unaccented syllable alone", () => {
    expect(bare("ca")).toBe("ca");
    expect(bare("cue")).toBe("cue");
  });

  it("leaves ñ alone — it is a letter, not an accent", () => {
    expect(bare("ño")).toBe("ño");
    expect(bare("ñá")).toBe("ña");
  });
});

describe("stressByRule", () => {
  it("stresses the second-to-last syllable when the word ends in a vowel, n or s", () => {
    expect(stressByRule(["ca", "sa"])).toBe(0);
    expect(stressByRule(["ven", "ta", "na"])).toBe(1);
    expect(stressByRule(["e", "xa", "men"])).toBe(1);
  });

  it("stresses the last syllable when the word ends in any other consonant", () => {
    expect(stressByRule(["co", "mer"])).toBe(1);
    expect(stressByRule(["ciu", "dad"])).toBe(1);
    expect(stressByRule(["fe", "liz"])).toBe(1);
  });

  it("lets an accent mark override both rules", () => {
    expect(stressByRule(["te", "lé", "fo", "no"])).toBe(1);
    expect(stressByRule(["co", "ra", "zón"])).toBe(2);
    expect(stressByRule(["ár", "bol"])).toBe(0);
  });
});

describe("QUIZ", () => {
  it("annotates every word the way the three rules say", () => {
    // The quiz teaches the rules, so its answer key had better be the
    // rules. This catches a typo'd stress index that no amount of
    // playing the quiz by hand would reliably surface.
    for (const q of QUIZ) {
      expect({ word: wordOf(q), stress: q.stress }).toEqual({
        word: wordOf(q),
        stress: stressByRule(q.syllables),
      });
    }
  });

  it("has no one-syllable words, which have nothing to choose between", () => {
    for (const q of QUIZ) {
      expect(q.syllables.length).toBeGreaterThan(1);
    }
  });

  it("still contains the accented words the quiz depends on", () => {
    const words = QUIZ.map(wordOf);
    for (const w of ["teléfono", "corazón", "música", "fácil", "papá", "árbol"]) {
      expect(words).toContain(w);
    }
  });
});
