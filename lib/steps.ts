// Derives the entire exercise sequence for a lesson from curriculum data.
// Pure and deterministic: no randomness, no Date, no storage. Adding a
// lesson is a data edit in lib/curriculum.ts — never a change here.

import {
  getWord,
  lessonById,
  lessonIndex,
  wordsTaughtBefore,
  type KidLesson,
} from "./curriculum";

export type Step =
  /** See a new word: big picture, characters, audio plays automatically. */
  | { kind: "MEET"; word: string }
  /** Hear a word, tap its picture out of `choices`. */
  | { kind: "MATCH"; answer: string; choices: string[] }
  /** Say a word or the whole sentence into the microphone. */
  | { kind: "SAY"; words: string[]; en: string }
  /**
   * Tap picture-tiles into order to assemble `answer`. `fromEnglish`
   * flips the direction: the prompt is the English meaning and the
   * child produces the sentence, instead of echoing what they heard.
   */
  | { kind: "BUILD"; answer: string[]; en: string; fromEnglish: boolean }
  /** One slot of `sentence` is blank; pick the word that fills it. */
  | {
      kind: "SWAP";
      sentence: string[];
      blankAt: number;
      answer: string;
      choices: string[];
      en: string;
    };

/**
 * SSOT for instruction copy. Both the on-screen label and the spoken
 * English cue read from here, so they can never drift apart.
 */
export const STEP_COPY: Record<Step["kind"], { icon: string; text: string }> = {
  MEET: { icon: "👂", text: "Listen" },
  MATCH: { icon: "👆", text: "Tap the right picture" },
  SAY: { icon: "🎤", text: "Now you say it" },
  BUILD: { icon: "🧩", text: "Put them in order" },
  SWAP: { icon: "🔄", text: "Which one fits?" },
};

/** How many pictures a MATCH offers, including the answer. */
const MATCH_CHOICES = 3;
/** A MATCH appears after every Nth new word. */
const MATCH_EVERY = 2;

/**
 * Pick wrong answers the child already knows. Deterministic.
 *
 * Order matters pedagogically: taking the *earliest* known words would
 * offer 你 and 好 as the distractors in every single exercise, and the
 * child would learn "never pick the first two" instead of learning the
 * word. Callers pass the pool most-relevant-first.
 */
function pickDistractors(
  answer: string,
  pool: string[],
  count: number
): string[] {
  const seen = new Set<string>([answer]);
  const picked: string[] = [];
  for (const zh of pool) {
    if (seen.has(zh)) continue;
    seen.add(zh);
    picked.push(zh);
    if (picked.length === count) break;
  }
  return picked;
}

/**
 * Answer + distractors, with the answer's position rotating by `seed`.
 * `[answer, ...distractors]` put the right tile first in every exercise,
 * and a child learns "tap the first picture" in about three lessons.
 * Deterministic, so the server and client render the same tiles.
 */
function spreadChoices(
  answer: string,
  distractors: string[],
  seed: number
): string[] {
  const choices = [...distractors];
  choices.splice(seed % (distractors.length + 1), 0, answer);
  return choices;
}

/**
 * Warm-up review: earlier words come back for real use — one to
 * recognise (MATCH), one to say (SAY) — not only as wrong answers.
 *
 * The MATCH word walks forward one taught word per lesson while the
 * course adds two or three, so each word's revisits arrive at growing
 * intervals — cheap spaced repetition with no stored schedule, which
 * keeps buildSteps pure. The SAY word is the newest earlier word: the
 * one taught most recently is the one still settling.
 */
function reviewSteps(
  lessonIdx: number,
  taught: string[],
  recent: string[]
): Step[] {
  if (taught.length === 0) return [];
  const steps: Step[] = [];
  const matchWord = taught[(lessonIdx - 1) % taught.length];
  const distractors = pickDistractors(matchWord, recent, MATCH_CHOICES - 1);
  if (distractors.length > 0) {
    steps.push({
      kind: "MATCH",
      answer: matchWord,
      choices: spreadChoices(matchWord, distractors, lessonIdx),
    });
  }
  const sayWord = recent.find((zh) => zh !== matchWord) ?? matchWord;
  steps.push({ kind: "SAY", words: [sayWord], en: getWord(sayWord).en });
  return steps;
}

/**
 * The words this lesson's own sentences put in a given slot. These make
 * the best distractors for a SWAP: they genuinely fit the sentence
 * shape, so choosing between them is a real decision rather than a
 * process of elimination.
 */
function siblingWordsAt(lesson: KidLesson, slot: number): string[] {
  return [lesson.build, ...lesson.swaps]
    .map((sentence) => sentence.words[slot])
    .filter((zh): zh is string => Boolean(zh));
}

/**
 * Which slot of a swap sentence to blank.
 *
 * A lesson teaching exactly one word (吗 in lesson 6, 不 in lesson 9)
 * exists to drill that word, so it is always the blank — otherwise
 * lesson 6's swaps would ask about 喝 and 是 and never once about 吗,
 * which is the entire point of the lesson. Everything else blanks the
 * first slot that differs from the sentence just built.
 */
function chooseBlank(lesson: KidLesson, swap: string[], target: string[]): number {
  if (lesson.newWords.length === 1) {
    const drilled = swap.indexOf(lesson.newWords[0]);
    if (drilled >= 0) return drilled;
  }
  return swap.findIndex((zh, i) => zh !== target[i]);
}

export function buildSteps(lessonId: string): Step[] {
  const lesson: KidLesson | undefined = lessonById(lessonId);
  if (!lesson) throw new Error(`No lesson with id "${lessonId}"`);
  const index = lessonIndex(lessonId);

  const taught = [...wordsTaughtBefore(lesson.lang, index)];
  // Most recently taught first: recent words are the ones worth confusing
  // the answer with, and it stops lesson 1's words being the distractor in
  // every exercise for the rest of the course.
  const recent = [...taught].reverse();

  // 0. Warm up on earlier lessons' words before anything new.
  const steps: Step[] = reviewSteps(index, taught, recent);
  const metThisLesson: string[] = [];

  // 1 & 2. Meet each new word, say it, and MATCH after every second one.
  lesson.newWords.forEach((word, i) => {
    steps.push({ kind: "MEET", word });
    // A single-word SAY shows the word's own gloss — "soy" with nothing
    // under it left the learner saying sounds they couldn't place.
    steps.push({ kind: "SAY", words: [word], en: getWord(word).en });
    metThisLesson.push(word);

    const isCheckpoint = (i + 1) % MATCH_EVERY === 0;
    // A lesson teaching one word (吗, 不) never reaches a checkpoint.
    if (!isCheckpoint) return;

    // This lesson's other new words first — they are the ones actually at
    // risk of being confused — then recent lessons. Lesson 1 has no
    // earlier material, so it leans entirely on its own words.
    const pool = [...metThisLesson, ...recent];
    const distractors = pickDistractors(word, pool, MATCH_CHOICES - 1);
    if (distractors.length < MATCH_CHOICES - 1) return; // too early to test
    steps.push({
      kind: "MATCH",
      answer: word,
      choices: spreadChoices(word, distractors, index + steps.length),
    });
  });

  // 3. Ladder the build sentence: one BUILD per prefix of length 2..N.
  // Prefixes are built by ear, revealing their authored gloss once
  // assembled; the full sentence is built from its English meaning —
  // the child produces it rather than echoing it, the way translation
  // apps mix listening and translating exercises.
  const target = lesson.build.words;
  for (let n = 2; n <= target.length; n++) {
    const isFull = n === target.length;
    steps.push({
      kind: "BUILD",
      answer: target.slice(0, n),
      en: isFull ? lesson.build.en : (lesson.ladderEn?.[n - 2] ?? ""),
      fromEnglish: isFull,
    });
  }

  // 4. One SWAP per swap sentence.
  for (const swap of lesson.swaps) {
    const blankAt = chooseBlank(lesson, swap.words, target);
    // A swap identical to the build teaches nothing; skip it.
    if (blankAt < 0) continue;
    const answer = swap.words[blankAt];
    // Words that fit this slot in the lesson's other sentences make the
    // best wrong answers; top up from recent lessons if there are too few.
    const pool = [
      ...siblingWordsAt(lesson, blankAt),
      ...lesson.newWords,
      ...recent,
    ];
    const distractors = pickDistractors(answer, pool, MATCH_CHOICES - 1);
    steps.push({
      kind: "SWAP",
      sentence: swap.words,
      blankAt,
      answer,
      choices: spreadChoices(answer, distractors, index + steps.length),
      en: swap.en,
    });
  }

  // 5. Say the whole thing.
  steps.push({ kind: "SAY", words: target, en: lesson.build.en });

  return steps;
}
