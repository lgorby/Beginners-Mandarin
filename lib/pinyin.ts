// Pinyin utilities: convert CC-CEDICT numbered pinyin (e.g. "ni3 hao3")
// into diacritic pinyin ("nǐ hǎo") and expose per-syllable tone numbers
// so the UI can color-code tones.

const TONE_MARKS: Record<string, string[]> = {
  a: ["a", "ā", "á", "ǎ", "à"],
  e: ["e", "ē", "é", "ě", "è"],
  i: ["i", "ī", "í", "ǐ", "ì"],
  o: ["o", "ō", "ó", "ǒ", "ò"],
  u: ["u", "ū", "ú", "ǔ", "ù"],
  ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
};

export interface PinyinSyllable {
  /** Diacritic form, e.g. "hǎo" */
  marked: string;
  /** Tone 1-4, or 5 for neutral tone */
  tone: number;
}

/** Convert one numbered syllable ("hao3", "lu:4", "ma5") to diacritic form. */
export function markSyllable(raw: string): PinyinSyllable {
  const m = raw.match(/^([A-Za-zü:]+?)([1-5])?$/);
  if (!m) return { marked: raw, tone: 5 };
  let body = m[1].replace(/u:/gi, "ü").replace(/v/g, "ü");
  const tone = m[2] ? parseInt(m[2], 10) : 5;
  if (tone >= 1 && tone <= 4) {
    const lower = body.toLowerCase();
    // Tone mark placement: a/e take it; in "ou" the o takes it;
    // otherwise the last vowel takes it.
    let idx = -1;
    if (lower.includes("a")) idx = lower.indexOf("a");
    else if (lower.includes("e")) idx = lower.indexOf("e");
    else if (lower.includes("ou")) idx = lower.indexOf("o");
    else {
      for (let i = lower.length - 1; i >= 0; i--) {
        if ("iouü".includes(lower[i])) {
          idx = i;
          break;
        }
      }
    }
    if (idx >= 0) {
      const ch = lower[idx];
      const marked = TONE_MARKS[ch]?.[tone];
      if (marked) {
        const replacement =
          body[idx] === body[idx].toUpperCase() && ch !== "ü"
            ? marked.toUpperCase()
            : marked;
        body = body.slice(0, idx) + replacement + body.slice(idx + 1);
      }
    }
  }
  return { marked: body, tone };
}

/** Convert a whole numbered-pinyin string to syllables with tones. */
export function toSyllables(numbered: string): PinyinSyllable[] {
  return numbered
    .trim()
    .split(/\s+/)
    .filter((s) => s && s !== "·")
    .map(markSyllable);
}

/** Convert a whole numbered-pinyin string to a plain diacritic string. */
export function toDiacritics(numbered: string): string {
  return toSyllables(numbered)
    .map((s) => s.marked)
    .join(" ");
}

/** Tone colors follow the common Pleco-style convention. */
export const TONE_COLORS: Record<number, string> = {
  1: "#e02424", // tone 1: red
  2: "#0e9f6e", // tone 2: green
  3: "#1c64f2", // tone 3: blue
  4: "#7e3af2", // tone 4: purple
  5: "#6b7280", // neutral: gray
};

export const TONE_DESCRIPTIONS: Record<number, { name: string; hint: string }> =
  {
    1: { name: "1st tone — high & flat", hint: "Sing it: hold a high, level pitch, like saying 'ahhh' for a doctor." },
    2: { name: "2nd tone — rising", hint: "Like asking a question in English: 'what?'" },
    3: { name: "3rd tone — dip", hint: "Falls low then rises, like a skeptical 'well...'" },
    4: { name: "4th tone — falling", hint: "Sharp and firm, like a command: 'No!'" },
    5: { name: "neutral tone", hint: "Short and light, no emphasis." },
  };
