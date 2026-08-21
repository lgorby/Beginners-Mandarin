import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WORDS } from "@/lib/curriculum";

describe("picture coverage", () => {
  it("has an SVG on disk for every word, in every language", () => {
    const missing = Object.values(WORDS)
      .filter((w) => !existsSync(`public/pics/${w.id}.svg`))
      .map((w) => `${w.text} (${w.id}.svg)`);
    expect(missing, "run `npm run pics`").toEqual([]);
  });

  it("ships real SVG, not an empty or stub file", () => {
    for (const word of Object.values(WORDS)) {
      const svg = readFileSync(`public/pics/${word.id}.svg`, "utf8");
      expect(svg, word.text).toContain("<svg");
      expect(svg.length, word.text).toBeGreaterThan(100);
    }
  });
});
