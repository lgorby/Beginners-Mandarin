// Pure text-matching helpers, shared by the browser (lib/speech.ts) and
// the server-side pronunciation scorer (lib/pronounce.ts).

/** Strip punctuation/whitespace for comparing recognized speech to a target. */
export function normalizeZh(s: string): string {
  return s.replace(/[\s。，！？、．.,!?'"“”‘’]/g, "");
}

/**
 * Score recognized speech against the target phrase: percentage of target
 * characters matched in order (longest common subsequence).
 */
export function scoreMatch(target: string, heard: string): number {
  const a = normalizeZh(target);
  const b = normalizeZh(heard);
  if (!a.length) return 0;
  if (a === b) return 100;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return Math.round((dp[a.length][b.length] / a.length) * 100);
}
