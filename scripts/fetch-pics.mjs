// Copies the OpenMoji SVGs the curriculum needs into public/pics/, naming
// each by the word's `id`. Only the ~20 files actually used are vendored —
// the openmoji package itself is a dev dependency and never ships.
// Hand-authored pictures (art.from === "custom") are already committed to
// public/pics/ and are only verified here.
//
// Run: npm run pics
//
// lib/curriculum.ts is imported directly rather than parsed, so it stays
// the single source of truth. Node 24 strips TypeScript types natively.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "pics");
const srcDir = join(root, "node_modules", "openmoji", "color", "svg");

if (!existsSync(srcDir)) {
  console.error(
    "openmoji is not installed. Run: npm install -D openmoji"
  );
  process.exit(1);
}

const { WORDS } = await import(
  pathToFileURL(join(root, "lib", "curriculum.ts")).href
);

const words = Object.values(WORDS);
if (words.length === 0) {
  console.error("lib/curriculum.ts exported no words.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const missing = [];
let copied = 0;
let kept = 0;

for (const word of words) {
  const dest = join(outDir, `${word.id}.svg`);

  if (word.art.from === "custom") {
    if (existsSync(dest)) kept++;
    else missing.push(`${word.zh} — hand-authored ${word.id}.svg not found`);
    continue;
  }

  const src = join(srcDir, `${word.art.hex}.svg`);
  if (!existsSync(src)) {
    missing.push(`${word.zh} — no OpenMoji SVG for codepoint ${word.art.hex}`);
    continue;
  }
  copyFileSync(src, dest);
  copied++;
}

console.log(
  `Vendored ${copied} OpenMoji SVGs into public/pics/ (${kept} hand-authored kept)`
);

if (missing.length > 0) {
  console.error(`\n${missing.length} picture(s) missing:`);
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}
