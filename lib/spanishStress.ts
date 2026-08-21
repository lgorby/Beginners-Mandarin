// The "Find the Stress" quiz pool and the rules behind it. Pure and
// separate from the page so the answer key can be tested against the
// three rules the page teaches.

export interface StressWord {
  /** The word split into syllables, accents intact. */
  syllables: string[];
  /** Index of the stressed syllable. */
  stress: number;
}

export const QUIZ: StressWord[] = [
  { syllables: ["ca", "sa"], stress: 0 },
  { syllables: ["co", "mer"], stress: 1 },
  { syllables: ["es", "cue", "la"], stress: 1 },
  { syllables: ["te", "lé", "fo", "no"], stress: 1 },
  { syllables: ["co", "ra", "zón"], stress: 2 },
  { syllables: ["mú", "si", "ca"], stress: 0 },
  { syllables: ["ven", "ta", "na"], stress: 1 },
  { syllables: ["fá", "cil"], stress: 0 },
  { syllables: ["ciu", "dad"], stress: 1 },
  { syllables: ["pa", "pá"], stress: 1 },
  { syllables: ["ár", "bol"], stress: 0 },
  { syllables: ["fe", "liz"], stress: 1 },
];

export const wordOf = (q: StressWord): string => q.syllables.join("");

const ACCENTED = "áéíóú";

/**
 * The syllable as it appears on a quiz button. The accent mark IS the
 * answer, so printing it turned a listening exercise into a reading one
 * — half the pool was solvable without ever playing the audio. Only the
 * five accented vowels are folded; ñ is a letter, not a stress mark, and
 * has to survive.
 */
export const bare = (syllable: string): string =>
  syllable.replace(/[áéíóú]/g, (c) => "aeiou"[ACCENTED.indexOf(c)]);

/**
 * Where the three rules put the stress, derived rather than looked up.
 * The quiz's own answer key is tested against this.
 */
export function stressByRule(syllables: string[]): number {
  const accented = syllables.findIndex((s) => /[áéíóú]/.test(s));
  if (accented >= 0) return accented; // rule 3: the accent mark wins
  const last = syllables[syllables.length - 1];
  // rule 1 (vowel, n or s) vs rule 2 (any other consonant)
  return /[aeiouns]$/i.test(last) ? syllables.length - 2 : syllables.length - 1;
}
