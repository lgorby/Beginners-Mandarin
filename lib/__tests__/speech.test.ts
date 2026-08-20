import { describe, expect, it } from "vitest";
import { bestCandidate, scoreMatch } from "@/lib/speech";

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

describe("bestCandidate", () => {
  // A recognition event: each inner array is one result's alternatives.
  const ev = (...results: string[][]) => ({
    results: results.map((alts) => alts.map((transcript) => ({ transcript }))),
  });

  it("prefers a later alternative that matches the target", () => {
    expect(bestCandidate("吃", ev(["持", "吃"]))).toEqual({
      transcript: "吃",
      score: 100,
    });
  });

  it("falls back to the first alternative when none match", () => {
    expect(bestCandidate("吃", ev(["持", "迟"]))).toEqual({
      transcript: "持",
      score: 0,
    });
  });

  it("joins the stream when the final transcript is empty (Edge)", () => {
    expect(bestCandidate("你好", ev(["你"], ["好"], [""]))).toEqual({
      transcript: "你好",
      score: 100,
    });
  });

  it("reports an event with no text as score -1", () => {
    expect(bestCandidate("吃", ev([""]))).toEqual({
      transcript: "",
      score: -1,
    });
  });
});
