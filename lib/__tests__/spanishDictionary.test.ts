import { describe, expect, it } from "vitest";
import { fold, searchSpanish } from "../spanishDictionary";

describe("fold", () => {
  it("strips accents and lowercases", () => {
    expect(fold("ESTÁ")).toBe("esta");
    expect(fold("niño")).toBe("nino");
    expect(fold("güero")).toBe("guero");
  });
});

describe("searchSpanish", () => {
  it("returns nothing for an empty query", () => {
    expect(searchSpanish("")).toEqual([]);
    expect(searchSpanish("   ")).toEqual([]);
  });

  it("finds a Spanish word for an English query, common word first", () => {
    const results = searchSpanish("water");
    expect(results[0].word).toBe("agua");
    expect(results[0].translations).toContain("water");
  });

  it("finds English for an exact Spanish headword", () => {
    const results = searchSpanish("perro");
    expect(results[0].word).toBe("perro");
    expect(results[0].translations).toContain("dog");
  });

  it("matches Spanish headwords accent-blind", () => {
    const results = searchSpanish("nino");
    expect(results.some((r) => r.word === "niño")).toBe(true);
  });

  it("ranks the common exact translation above fuzzy matches", () => {
    const results = searchSpanish("hello");
    expect(results[0].word).toBe("hola");
  });

  it("keeps noun gender on entries", () => {
    const agua = searchSpanish("agua")[0];
    expect(agua.pos).toBe("nf");
  });

  it("respects the result limit", () => {
    expect(searchSpanish("a", 5).length).toBeLessThanOrEqual(5);
  });
});
