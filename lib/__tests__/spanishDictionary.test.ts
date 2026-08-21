import { describe, expect, it } from "vitest";
import { fold, parseEntries, searchSpanish } from "../spanishDictionary";

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

  it("leaves no stray carriage return on the last translation", () => {
    for (const r of searchSpanish("water", 10)) {
      for (const t of r.translations) {
        expect(t).toBe(t.trim());
      }
    }
  });
});

describe("parseEntries", () => {
  // The TSV on disk is LF-only now that .gitattributes pins data/*.tsv
  // to LF, so a test reading the real file could never exercise the
  // CRLF branch again. Feed literal CRLF text instead — this is what
  // regressed when the parser briefly split on "\n" alone: a \r rode
  // along on every entry's last translation.
  it("strips a trailing \\r from the last field on CRLF input", () => {
    const text = "agua\tnf\t10\twater\r\nperro\tnm\t8\tdog | hound\r\n";
    const parsed = parseEntries(text);
    expect(parsed).toHaveLength(2);
    for (const e of parsed) {
      for (const t of e.translations) {
        expect(t).toBe(t.trim());
      }
    }
    expect(parsed[1].translations).toEqual(["dog", "hound"]);
  });

  it("parses LF input the same way", () => {
    const text = "agua\tnf\t10\twater\nperro\tnm\t8\tdog | hound\n";
    const parsed = parseEntries(text);
    expect(parsed).toHaveLength(2);
    for (const e of parsed) {
      for (const t of e.translations) {
        expect(t).toBe(t.trim());
      }
    }
    expect(parsed[1].translations).toEqual(["dog", "hound"]);
  });
});
