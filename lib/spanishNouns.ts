// How a dictionary entry's part-of-speech tag becomes the article and
// label shown beside the word. Pure and separate from the page so the
// gender rules can be tested — the page cannot be, this repo's vitest
// setup has no DOM.

/**
 * Feminine nouns that begin with a STRESSED a-/ha- take "el" in the
 * singular (el agua, el águila) — "la agua" is wrong Spanish. Detecting
 * the stress needs syllabification, so the common cases are listed.
 */
const EL_FEMININE = new Set([
  "agua", "águila", "ala", "alba", "alga", "alma", "ama", "ancla", "ansia",
  "area", "área", "arma", "arpa", "asma", "asta", "aula", "ave", "aya",
  "haba", "habla", "hacha", "hada", "hambre", "haya",
]);

const ARTICLE: Record<string, string> = { nm: "el", nf: "la" };

const POS_LABEL: Record<string, string> = {
  nm: "noun (m.)",
  nf: "noun (f.)",
  n: "noun",
  prop: "name",
  adj: "adjective",
  v: "verb",
  adv: "adverb",
  loc: "phrase",
  interj: "interjection",
  saying: "saying",
};

/**
 * WikDict's nmf tag covers two different things, and only one of them is
 * common-gender. "activista" and "gimnasta" really do take either article
 * on the same spelling; "perro", "actor" and "abuelo" are masculine
 * headwords whose feminine is a different word (perra, actriz, abuela).
 * The invariable ones all end in -a, which is what this tests — 43 of the
 * 460 nmf entries. The other 417 were being shown as "el/la perro".
 */
const isCommonGender = (word: string) => /a$/.test(word);

/** The article to show beside a headword, or undefined for non-nouns. */
export function articleFor(word: string, pos: string): string | undefined {
  if (pos === "nf" && EL_FEMININE.has(word)) return "el";
  if (pos === "nmf") return isCommonGender(word) ? "el/la" : "el";
  return ARTICLE[pos];
}

/** What the 🔊 button says: "el perro", "la casa", or just the word. */
export function spokenForm(word: string, pos: string): string {
  const article = articleFor(word, pos);
  // el/la is a written shorthand, not sayable — speak those bare.
  return article && article !== "el/la" ? `${article} ${word}` : word;
}

/** The grey tag beside the headword, or undefined if there is none. */
export function posLabel(word: string, pos: string): string | undefined {
  // Matches articleFor: an nmf headword shown as "el perro" must not
  // then be labelled "noun (m./f.)".
  if (pos === "nmf") return isCommonGender(word) ? "noun (m./f.)" : "noun (m.)";
  return POS_LABEL[pos];
}
