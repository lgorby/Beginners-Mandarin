import { describe, expect, it } from "vitest";
import { bestMatch, scoreMatch } from "@/lib/speech";

describe("scoreMatch", () => {
  it("gives 100 for an exact match", () => {
    expect(scoreMatch("你好", "你好")).toBe(100);
  });

  it("ignores punctuation and spacing", () => {
    expect(scoreMatch("我喝茶。", "我 喝 茶")).toBe(100);
  });

  it("gives partial credit for a partial sentence", () => {
    expect(scoreMatch("我喝茶", "我茶")).toBe(67);
  });

  it("gives 0 when nothing matches", () => {
    expect(scoreMatch("吃", "持")).toBe(0);
  });
});

describe("bestMatch", () => {
  it("prefers a later alternative that matches the target", () => {
    expect(
      bestMatch("吃", [{ transcript: "持" }, { transcript: "吃" }])
    ).toEqual({ transcript: "吃", score: 100 });
  });

  it("falls back to the first alternative when none match", () => {
    expect(
      bestMatch("吃", [{ transcript: "持" }, { transcript: "迟" }])
    ).toEqual({ transcript: "持", score: 0 });
  });

  it("handles a missing result", () => {
    expect(bestMatch("吃", undefined)).toEqual({ transcript: "", score: 0 });
  });
});
