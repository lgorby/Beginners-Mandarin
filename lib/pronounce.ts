// Server-side pronunciation scoring.
//
// The recognizer writes correct speech down as whichever characters it
// guesses — 吃 said perfectly often comes back as 持. Comparing
// characters punishes that, so pronunciation is scored on what the ear
// heard: pinyin syllables (70%) plus tones (30%). Character identity is
// kept as a floor, never a ceiling.

import { pinyinFor } from "./dictionary";
import { normalizeZh, scoreMatch } from "./match";

export interface PronunciationScore {
  /** The candidate transcript that scored best. */
  transcript: string;
  /** 0–100. */
  score: number;
  /** True when every syllable was right but one or more tones were off. */
  toneHint: boolean;
}

interface Syllable {
  base: string;
  tone: string;
}

function syllables(text: string): Syllable[] {
  return pinyinFor(normalizeZh(text)).map((s) => ({
    base: s.toLowerCase().replace(/[0-9\s:']/g, ""),
    tone: /[1-5]/.exec(s)?.[0] ?? "5",
  }));
}

/** LCS over syllable bases, counting how many matched pairs agree on tone. */
function align(
  target: Syllable[],
  heard: Syllable[]
): { matched: number; tonesRight: number } {
  const n = target.length;
  const m = heard.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] =
        target[i - 1].base === heard[j - 1].base
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  // Backtrack one LCS path to count tone agreement on matched syllables.
  let tonesRight = 0;
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (target[i - 1].base === heard[j - 1].base) {
      if (target[i - 1].tone === heard[j - 1].tone) tonesRight++;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return { matched: dp[n][m], tonesRight };
}

/** Score each heard candidate against the target; return the best. */
export function scorePronunciation(
  target: string,
  candidates: string[]
): PronunciationScore {
  const t = syllables(target);
  let best: PronunciationScore = { transcript: "", score: -1, toneHint: false };
  for (const c of candidates) {
    if (!normalizeZh(c)) continue;
    let score = scoreMatch(target, c);
    let toneHint = false;
    if (t.length > 0) {
      const { matched, tonesRight } = align(t, syllables(c));
      const soundScore = Math.round(
        (70 * matched) / t.length + (30 * tonesRight) / t.length
      );
      if (soundScore > score) {
        score = soundScore;
        toneHint = matched === t.length && tonesRight < t.length;
      }
    }
    if (score > best.score) best = { transcript: c, score, toneHint };
  }
  return best.score < 0 ? { transcript: "", score: 0, toneHint: false } : best;
}
