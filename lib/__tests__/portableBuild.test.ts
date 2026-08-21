import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// Next's standalone output traces *imports*. A data file opened at
// runtime through fs.readFileSync(path.join(process.cwd(), "data", …))
// is invisible to it, so it only reaches the portable app if
// build-portable.ps1 copies it by name. Nothing else notices when it
// doesn't: the app builds, starts, and 500s on the first search. This
// test is what notices — including for the next data file someone adds.

const root = process.cwd();

/** Every data file the server reads at runtime, found in lib/*.ts. */
function runtimeDataFiles(): string[] {
  const dir = path.join(root, "lib");
  const found = new Set<string>();
  const re = /path\.join\(\s*process\.cwd\(\)\s*,\s*"data"\s*,\s*"([^"]+)"\s*\)/g;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(dir, name), "utf8");
    for (const m of src.matchAll(re)) found.add(m[1]);
  }
  return [...found].sort();
}

describe("portable build", () => {
  const script = fs.readFileSync(
    path.join(root, "scripts", "build-portable.ps1"),
    "utf8"
  );

  it("still recognises how the loaders open their data files", () => {
    // Guards the guard: if someone changes the readFileSync idiom, the
    // test below would silently pass over an empty list.
    expect(runtimeDataFiles()).toEqual(["cedict_ts.u8", "wikdict_es_en.tsv"]);
  });

  it("copies every runtime-read data file into the package", () => {
    for (const file of runtimeDataFiles()) {
      expect(script).toContain(file);
    }
  });
});
