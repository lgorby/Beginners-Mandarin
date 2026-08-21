// SSOT for the kid learning path: every word, lesson, and sentence, in
// every language the path teaches. Nothing else in the kid path defines
// a word. See the Global Constraints in
// docs/superpowers/plans/2026-08-20-kid-learning-path.md.
//
// Course content lives in lib/courses/{zh,es}.ts; this module stamps each
// course with its language and merges them. Word text is the key in
// WORDS — hanzi and Latin script can never collide, and a test guards
// uniqueness so a future language cannot silently shadow a word.
//
// lib/vocab.ts and lib/lessons.ts drive the grown-up section and are
// deliberately left alone.

import { LANGUAGES, LANG_CODES, type LangCode } from "./languages";
import { zhCourse } from "./courses/zh";
import { esCourse } from "./courses/es";

/** A word as a course file writes it — the language is stamped on merge. */
export interface CourseWord {
  /** The word in its own script. Also the key in WORDS. */
  text: string;
  /** Unique ASCII slug. Sole source of the picture filename: /pics/{id}.svg */
  id: string;
  /**
   * CC-CEDICT numbered pinyin. Diacritics are derived, never stored.
   * Mandarin only — a Spanish word is already its own pronunciation.
   */
  pinyin?: string;
  en: string;
  /**
   * Where the picture comes from. Read only by scripts/fetch-pics.mjs;
   * the app never looks at it — it uses /pics/{id}.svg.
   * - openmoji: hex codepoint(s) of the source SVG in the openmoji package
   * - custom:   hand-authored, already committed to public/pics/
   * - copy:     duplicate of another word's committed picture, by id
   */
  art:
    | { from: "openmoji"; hex: string }
    | { from: "custom" }
    | { from: "copy"; of: string };
  /** Rendered if the SVG is missing, so a broken asset degrades. */
  emoji: string;
}

export interface Word extends CourseWord {
  lang: LangCode;
}

export interface Sentence {
  /** Refs into WORDS — never a flat string. This is what makes the ladder work. */
  words: string[];
  en: string;
}

/** A lesson as a course file writes it — the language is stamped on merge. */
export interface CourseLesson {
  id: string;
  /** English, shown to the parent on the star path — not to the child. */
  title: string;
  /** Word (by text ref) whose picture represents the lesson on the star path. */
  icon: string;
  /** Refs, introduced in this order. */
  newWords: string[];
  /** The sentence the ladder assembles. */
  build: Sentence;
  /**
   * English for each ladder prefix of `build` (lengths 2..N-1, in
   * order), shown when the child assembles it — "yo soy" put together
   * means "I am…". Authored, not derived: word glosses ("I / me" +
   * "to be") do not join into English. Required whenever `build` is
   * longer than two words; a test enforces the exact count.
   */
  ladderEn?: string[];
  /** Same shape, one word changed (or one word added, for 吗 and no). */
  swaps: Sentence[];
}

export interface KidLesson extends CourseLesson {
  lang: LangCode;
}

export interface Course {
  words: CourseWord[];
  lessons: CourseLesson[];
}

const COURSES: Record<LangCode, Course> = { zh: zhCourse, es: esCourse };

export const WORDS: Record<string, Word> = {};
const LESSONS_BY_LANG = {} as Record<LangCode, KidLesson[]>;
for (const lang of LANG_CODES) {
  const course = COURSES[lang];
  for (const word of course.words) WORDS[word.text] = { ...word, lang };
  LESSONS_BY_LANG[lang] = course.lessons.map((l) => ({ ...l, lang }));
}

/** Every lesson in every language, for static params and generic tests. */
export const LESSONS: KidLesson[] = LANG_CODES.flatMap(
  (lang) => LESSONS_BY_LANG[lang]
);

export function lessonsFor(lang: LangCode): KidLesson[] {
  return LESSONS_BY_LANG[lang];
}

export function getWord(text: string): Word {
  const word = WORDS[text];
  if (!word) throw new Error(`No word in any curriculum for "${text}"`);
  return word;
}

export function lessonById(id: string): KidLesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** A lesson's position within ITS OWN language's path. -1 if unknown. */
export function lessonIndex(id: string): number {
  const lesson = lessonById(id);
  if (!lesson) return -1;
  return LESSONS_BY_LANG[lesson.lang].findIndex((l) => l.id === id);
}

/** Every word introduced strictly before the lesson at `index` in `lang`. */
export function wordsTaughtBefore(lang: LangCode, index: number): Set<string> {
  const known = new Set<string>();
  for (const lesson of LESSONS_BY_LANG[lang].slice(0, index)) {
    for (const text of lesson.newWords) known.add(text);
  }
  return known;
}

/**
 * A sentence's word refs as one speakable, scoreable string, joined the
 * way the words' language joins (Mandarin runs together, Spanish takes
 * spaces). `question` applies the language's question wrap, if it has
 * one — the caller derives it from the sentence's English gloss ending
 * in "?", the SSOT for questionness.
 */
export function sentenceText(
  words: string[],
  opts?: { question?: boolean }
): string {
  const language = LANGUAGES[getWord(words[0]).lang];
  const text = words.join(language.joiner);
  return opts?.question && language.wrapQuestion
    ? language.wrapQuestion(text)
    : text;
}

/** The Language of a sentence's words (a sentence never mixes languages). */
export function languageOf(words: string[]) {
  return LANGUAGES[getWord(words[0]).lang];
}
