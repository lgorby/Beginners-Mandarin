// Server-side CC-CEDICT dictionary engine.
// Parses data/cedict_ts.u8 (~120k entries) once per process and serves
// English → Mandarin, Mandarin → English, and pinyin searches.

import fs from "fs";
import path from "path";
import { toDiacritics } from "./pinyin";

export interface DictEntry {
  traditional: string;
  simplified: string;
  /** Numbered pinyin as stored in CEDICT, e.g. "ni3 hao3" */
  pinyin: string;
  /** Diacritic pinyin, e.g. "nǐ hǎo" */
  pinyinMarked: string;
  definitions: string[];
}

let entries: DictEntry[] | null = null;

const LINE_RE = /^(\S+)\s(\S+)\s\[([^\]]+)\]\s\/(.+)\/\s*$/;

function load(): DictEntry[] {
  if (entries) return entries;
  const file = path.join(process.cwd(), "data", "cedict_ts.u8");
  const text = fs.readFileSync(file, "utf8");
  const out: DictEntry[] = [];
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const m = line.match(LINE_RE);
    if (!m) continue;
    out.push({
      traditional: m[1],
      simplified: m[2],
      pinyin: m[3],
      pinyinMarked: toDiacritics(m[3]),
      definitions: m[4].split("/").filter(Boolean),
    });
  }
  entries = out;
  return out;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Strip tone numbers / spaces for loose pinyin matching. */
function loosePinyin(s: string): string {
  return s.toLowerCase().replace(/[1-5\s':]/g, "");
}

export interface SearchResult extends DictEntry {
  score: number;
}

const hasCJK = (s: string) => /[㐀-鿿]/.test(s);

/**
 * Search the dictionary. Detects query type:
 *  - Chinese characters → match simplified/traditional
 *  - otherwise → match English definitions, and also try pinyin
 */
export function search(query: string, limit = 30): SearchResult[] {
  const dict = load();
  const q = normalize(query);
  if (!q) return [];
  const results: SearchResult[] = [];

  if (hasCJK(q)) {
    for (const e of dict) {
      let score = 0;
      if (e.simplified === q || e.traditional === q) score = 100;
      else if (e.simplified.includes(q) || e.traditional.includes(q))
        score = 50 - e.simplified.length;
      if (score > 0) results.push({ ...e, score });
    }
  } else {
    const qLoose = loosePinyin(q);
    const wordRe = new RegExp(
      `\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    for (const e of dict) {
      let score = 0;
      // English definition matching. CEDICT packs synonyms into one
      // definition separated by semicolons ("hello; hi"), so check each part.
      for (const def of e.definitions) {
        const d = normalize(def);
        for (const part of d.split(";").map((p) => p.trim())) {
          if (part === q) {
            score = Math.max(score, 100);
          } else if (
            part === `to ${q}` ||
            part === `a ${q}` ||
            part === `the ${q}` ||
            part.replace(/\s*\([^)]*\)\s*/g, "").trim() === q
          ) {
            score = Math.max(score, 90);
          }
        }
        if (score < 90 && wordRe.test(def)) {
          // Word appears in the definition; shorter definitions rank higher.
          score = Math.max(score, 40 - Math.min(30, d.length / 4));
        }
      }
      // Pinyin matching (with or without tone numbers)
      if (loosePinyin(e.pinyin) === qLoose) score = Math.max(score, 85);
      if (score > 0) {
        // Prefer common, short words over long obscure compounds.
        score -= e.simplified.length * 0.5;
        results.push({ ...e, score });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/** Exact lookup of one Chinese word (simplified or traditional). */
export function lookup(word: string): DictEntry | undefined {
  const dict = load();
  return dict.find((e) => e.simplified === word || e.traditional === word);
}

let pinyinMap: Map<string, string> | null = null;

function getPinyinMap(): Map<string, string> {
  if (pinyinMap) return pinyinMap;
  const m = new Map<string, string>();
  for (const e of load()) {
    // First entry wins: CEDICT lists the common reading first.
    if (e.simplified.length <= 8 && !m.has(e.simplified)) {
      m.set(e.simplified, e.pinyin);
    }
  }
  pinyinMap = m;
  return m;
}

/**
 * Numbered-pinyin syllables for a Chinese string, by greedy longest-word
 * match against the dictionary (so 学生 reads as one word, not two
 * guessed characters). Unknown characters contribute nothing.
 */
export function pinyinFor(text: string): string[] {
  const m = getPinyinMap();
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    let advanced = 1;
    for (let len = Math.min(8, text.length - i); len >= 1; len--) {
      const p = m.get(text.slice(i, i + len));
      if (p) {
        out.push(...p.split(/\s+/));
        advanced = len;
        break;
      }
    }
    i += advanced;
  }
  return out;
}
