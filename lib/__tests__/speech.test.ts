import { describe, expect, it } from "vitest";
import { bestCandidate, rankVoices, scoreMatch } from "@/lib/speech";

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

  it("ignores case and accents so Spanish transcripts never lose points to spelling", () => {
    expect(scoreMatch("¿tú quieres té?", "Tu quieres te")).toBe(100);
  });

  it("scores a partial Spanish sentence partially", () => {
    expect(scoreMatch("yo bebo agua", "yo agua")).toBeLessThan(100);
    expect(scoreMatch("yo bebo agua", "yo agua")).toBeGreaterThan(40);
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

describe("rankVoices", () => {
  // The Spanish course's real configuration: es-MX first, then other
  // Latin American tags, Castilian dead last.
  const PREFER = ["es-MX", "es-US", "es-419"];
  const AVOID = ["es-ES"];
  const v = (lang: string) => ({ lang });
  const langs = (voices: { lang: string }[]) => voices.map((x) => x.lang);

  it("puts a Latin American voice above a Castilian one", () => {
    expect(langs(rankVoices([v("es-ES"), v("es-US")], PREFER, AVOID))).toEqual([
      "es-US",
      "es-ES",
    ]);
  });

  it("prefers the exact requested region above all", () => {
    expect(
      langs(rankVoices([v("es-ES"), v("es-US"), v("es-MX")], PREFER, AVOID))
    ).toEqual(["es-MX", "es-US", "es-ES"]);
  });

  it("ranks an unlisted region above an avoided one", () => {
    expect(langs(rankVoices([v("es-ES"), v("es-AR")], PREFER, AVOID))).toEqual([
      "es-AR",
      "es-ES",
    ]);
  });

  it("still returns an avoided voice when it is all there is", () => {
    expect(langs(rankVoices([v("es-ES")], PREFER, AVOID))).toEqual(["es-ES"]);
  });

  it("compares tags case-insensitively and across _ vs -", () => {
    expect(langs(rankVoices([v("es_es"), v("ES-us")], PREFER, AVOID))).toEqual([
      "ES-us",
      "es_es",
    ]);
  });
});
