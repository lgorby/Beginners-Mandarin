// Builds data/wikdict_es_en.tsv — the Spanish talking dictionary's data —
// from WikDict's es-en SQLite export (Wiktionary data, CC BY-SA).
//
//   node scripts/build-es-dict.mjs [path-to-es-en.sqlite3]
//
// Without an argument the SQLite file is downloaded to the OS temp dir
// from https://download.wikdict.com/dictionaries/sqlite/2/es-en.sqlite3.
//
// Output columns (tab-separated, one Spanish entry per line):
//   word <TAB> pos <TAB> importance <TAB> translations (" | "-separated)
//
// pos codes: nm/nf/nmf (noun by gender), n, prop, adj, v, adv, loc
// (multi-word phrase), interj, saying, or empty when WikDict has none.

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const URL = "https://download.wikdict.com/dictionaries/sqlite/2/es-en.sqlite3";
const OUT = path.join(import.meta.dirname, "..", "data", "wikdict_es_en.tsv");

async function sqlitePath() {
  if (process.argv[2]) return process.argv[2];
  const tmp = path.join(os.tmpdir(), "wikdict-es-en.sqlite3");
  if (!fs.existsSync(tmp)) {
    console.log(`Downloading ${URL} …`);
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  }
  return tmp;
}

/** WikDict POS (from the lexentry URI) → our compact code. null = skip. */
function posCode(pos) {
  if (pos.startsWith("prefijo") || pos.startsWith("sufijo")) return null;
  if (/sustantivo_(masculino_y_femenino|femenino_y_masculino|ambiguo)/.test(pos))
    return "nmf";
  if (pos.startsWith("sustantivo_masculino")) return "nm";
  if (pos.startsWith("sustantivo_femenino")) return "nf";
  if (pos.startsWith("sustantivo_propio")) return "prop";
  if (pos.startsWith("sustantivo")) return "n";
  if (pos.startsWith("adjetivo")) return "adj";
  if (pos.startsWith("verbo")) return "v";
  if (pos.startsWith("adverbio")) return "adv";
  if (pos.startsWith("locución")) return "loc";
  if (pos.startsWith("interjección")) return "interj";
  if (pos.startsWith("refrán")) return "saying";
  return "";
}

// Wiktionary markup or editorial alternates ("perro / can") make bad
// display text and bad matches — such strings are dropped, not repaired.
const messy = (s) => /[[\]"|/]/.test(s) || s.length === 0 || s.length > 40;

const db = new DatabaseSync(await sqlitePath(), { readOnly: true });
const rows = db
  .prepare(
    `SELECT lexentry, written_rep, trans_list, importance
     FROM translation
     WHERE lexentry LIKE 'spa/%'
     ORDER BY score DESC, importance DESC`
  )
  .all();

const entries = new Map(); // "wordpos" -> { word, pos, imp, trans: Set }
let skipped = 0;
for (const r of rows) {
  const word = r.written_rep.trim();
  // "spa/perro__sustantivo_masculino__1" — the word URI itself may hold
  // single underscores (phrases), so split on the double ones.
  const pos = posCode(r.lexentry.split("__")[1] ?? "");
  if (pos === null || messy(word)) {
    skipped++;
    continue;
  }
  const key = `${word}${pos}`;
  let e = entries.get(key);
  if (!e) {
    e = { word, pos, imp: 0, trans: new Set() };
    entries.set(key, e);
  }
  e.imp = Math.max(e.imp, r.importance ?? 0);
  for (const t of r.trans_list.split("|").map((t) => t.trim())) {
    if (!messy(t) && e.trans.size < 8) e.trans.add(t);
  }
}

const lines = [...entries.values()]
  .filter((e) => e.trans.size > 0)
  .sort((a, b) => a.word.localeCompare(b.word, "es"))
  .map(
    (e) =>
      `${e.word}\t${e.pos}\t${e.imp.toFixed(4)}\t${[...e.trans].join(" | ")}`
  );

fs.writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
console.log(
  `Wrote ${lines.length} entries to ${OUT} (${skipped} rows skipped as markup/affixes).`
);
