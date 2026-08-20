import { describe, expect, it } from "vitest";
import { markSyllable, toDiacritics, toSyllables } from "@/lib/pinyin";

describe("markSyllable", () => {
  it("places the mark on a/e when present", () => {
    expect(markSyllable("hao3").marked).toBe("hǎo");
    expect(markSyllable("xie4").marked).toBe("xiè");
  });

  it("marks the o in 'ou'", () => {
    expect(markSyllable("you3").marked).toBe("yǒu");
  });

  it("falls back to the last vowel", () => {
    expect(markSyllable("shui3").marked).toBe("shuǐ");
  });

  it("normalises u: and v to ü", () => {
    expect(markSyllable("nu:3").marked).toBe("nǚ");
    expect(markSyllable("lv4").marked).toBe("lǜ");
  });

  it("treats a missing number as the neutral tone", () => {
    expect(markSyllable("ma")).toEqual({ marked: "ma", tone: 5 });
    expect(markSyllable("ma5")).toEqual({ marked: "ma", tone: 5 });
  });

  it("keeps capitalisation for proper nouns", () => {
    expect(markSyllable("Zhong1").marked).toBe("Zhōng");
  });
});

describe("toSyllables", () => {
  it("reports a tone per syllable", () => {
    expect(toSyllables("ni3 hao3").map((s) => s.tone)).toEqual([3, 3]);
  });

  it("ignores the CC-CEDICT middle dot", () => {
    expect(toSyllables("ma1 · ma5")).toHaveLength(2);
  });
});

describe("toDiacritics", () => {
  it("converts a whole string", () => {
    expect(toDiacritics("ni3 hao3")).toBe("nǐ hǎo");
    expect(toDiacritics("Zhong1 guo2")).toBe("Zhōng guó");
  });
});
