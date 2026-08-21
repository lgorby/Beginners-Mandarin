// Server-side Spanish dictionary engine, the CC-CEDICT engine's twin.
// Parses data/wikdict_es_en.tsv (~25k entries, built by
// scripts/build-es-dict.mjs from WikDict, CC BY-SA) once per process and
// serves English → Spanish and Spanish → English searches.

import fs from "fs";
import path from "path";

export interface EsDictEntry {
  /** The Spanish word or phrase. */
  word: string;
  /** nm/nf/nmf (noun by gender), n, prop, adj, v, adv, loc, interj, saying, or "". */
  pos: string;
  /** WikDict relative importance — a frequency-ish ranking signal. */
  importance: number;
  /** English translations, best first. */
  translations: string[];
}

interface LoadedEntry extends EsDictEntry {
  /** Lowercased word with accents folded away, for accent-blind matching. */
  folded: string;
}

let entries: LoadedEntry[] | null = null;

/**
 * Lowercase and strip diacritics (está → esta, niño → nino). Folding ñ
 * to n is deliberate: English keyboards can't type ñ, and a dictionary
 * that hides "niño" from "nino" teaches nothing.
 */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Parse the TSV's text into entries. Exported (and pure) so a test can
 * feed it a literal CRLF fixture directly: .gitattributes now pins
 * data/*.tsv to LF, so the file on disk never contains a \r and a test
 * that only reads it from disk could never catch a CRLF regression.
 */
export function parseEntries(text: string): LoadedEntry[] {
  const out: LoadedEntry[] = [];
  // Split on either line ending: Windows clones used to check this file
  // out with CRLF before .gitattributes pinned it to LF, and a trailing
  // \r would ride along on every entry's last translation.
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const [word, pos, importance, trans] = line.split("\t");
    if (!word || !trans) continue;
    out.push({
      word,
      pos,
      importance: Number(importance) || 0,
      translations: trans.split(" | "),
      folded: fold(word),
    });
  }
  return out;
}

function load(): LoadedEntry[] {
  if (entries) return entries;
  const file = path.join(process.cwd(), "data", "wikdict_es_en.tsv");
  const text = fs.readFileSync(file, "utf8");
  entries = parseEntries(text);
  return entries;
}

export interface EsSearchResult extends EsDictEntry {
  score: number;
}

/**
 * Search the dictionary. Both directions run on every query — English
 * and Spanish share an alphabet, so unlike the Mandarin engine there is
 * no script to detect. Exact Spanish headwords and exact English
 * translations rank highest; WikDict importance breaks ties, so "agua"
 * beats an obscure word that also translates as "water".
 */
export function searchSpanish(query: string, limit = 30): EsSearchResult[] {
  const dict = load();
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const qf = fold(q);
  const wordRe = new RegExp(
    `\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i"
  );

  const results: EsSearchResult[] = [];
  for (const e of dict) {
    let score = 0;

    // Spanish headword matching (accent-blind).
    if (e.word.toLowerCase() === q) score = 100;
    else if (e.folded === qf) score = 96;
    else if (qf.length >= 2 && e.folded.startsWith(qf))
      score = 50 - Math.min(20, e.word.length);
    else if (qf.length >= 3 && e.folded.includes(qf))
      score = 30 - Math.min(20, e.word.length);

    // English translation matching.
    for (const t of e.translations) {
      const d = t.toLowerCase();
      if (d === q) {
        score = Math.max(score, 95);
      } else if (
        d === `to ${q}` ||
        d === `a ${q}` ||
        d === `the ${q}` ||
        d.replace(/\s*\([^)]*\)\s*/g, "").trim() === q
      ) {
        score = Math.max(score, 88);
      } else if (score < 88 && wordRe.test(t)) {
        // Word appears in the translation; shorter ones rank higher.
        score = Math.max(score, 40 - Math.min(30, d.length / 2));
      }
    }

    if (score > 0) {
      // Common words first: importance dominates within a score tier
      // without letting an obscure exact match lose to a fuzzy one.
      results.push({ ...e, score: score + Math.min(10, e.importance) });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
