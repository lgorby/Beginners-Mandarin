// Copies the OpenMoji SVGs the curricula need into public/pics/, naming
// each by the word's `id`. Only the files actually used are vendored —
// the openmoji package itself is a dev dependency and never ships.
// Hand-authored pictures (art.from === "custom") are already committed to
// public/pics/ and are only verified here; art.from === "copy" duplicates
// a committed picture under the new word's id.
//
// Run: npm run pics
//
// The course files are imported directly rather than parsed, so they stay
// the single source of truth. Node 24 strips TypeScript types natively;
// lib/curriculum.ts itself uses extensionless imports Node cannot
// resolve, so the runtime-standalone course files are imported instead.

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

const courseExports = [
  ["zh.ts", "zhCourse"],
  ["es.ts", "esCourse"],
];
const words = [];
for (const [file, name] of courseExports) {
  const mod = await import(
    pathToFileURL(join(root, "lib", "courses", file)).href
  );
  words.push(...mod[name].words);
}

if (words.length === 0) {
  console.error("The course files exported no words.");
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
    else missing.push(`${word.text} — hand-authored ${word.id}.svg not found`);
    continue;
  }

  const src =
    word.art.from === "copy"
      ? join(outDir, `${word.art.of}.svg`)
      : join(srcDir, `${word.art.hex}.svg`);
  if (!existsSync(src)) {
    missing.push(
      word.art.from === "copy"
        ? `${word.text} — no committed picture ${word.art.of}.svg to copy`
        : `${word.text} — no OpenMoji SVG for codepoint ${word.art.hex}`
    );
    continue;
  }
  copyFileSync(src, dest);
  copied++;
}

console.log(
  `Vendored ${copied} SVGs into public/pics/ (${kept} hand-authored kept)`
);

if (missing.length > 0) {
  console.error(`\n${missing.length} picture(s) missing:`);
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}
