# Kid Learning Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's seven equally-weighted feature pages with a single guided path that carries a child aged 5–11 from one pictured word to a spoken sentence, keeping every existing page behind a `/grown-ups` door.

**Architecture:** One data module (`lib/curriculum.ts`) is the single source of truth for every word, lesson, and sentence. Sentences are arrays of word references, never strings, which makes the word-to-sentence ladder expressible and lets a test prove no sentence uses an untaught word. A pure function (`buildSteps`) derives the entire exercise sequence from that data, so adding a lesson is a data edit. Five step components render the five step types inside one shared shell.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript 5, Vitest 4, OpenMoji 15 (dev-only, SVGs vendored into `public/pics/`).

**Spec:** `docs/superpowers/specs/2026-08-20-kid-learning-path-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

**SSOT — single source of truth.** These rules are testable and tested:

- `lib/curriculum.ts` is the **only** place a word, lesson, or sentence is defined. No component hardcodes a Chinese word, pinyin string, or English gloss.
- Pinyin is stored **once**, in CC-CEDICT numbered form (`"ni3 hao3"`). Diacritic form is **always** derived through `lib/pinyin.ts`. Never store `"nǐ hǎo"`.
- Lesson **order is array position** in `LESSONS`. There is no `number` field to disagree with the index.
- Progress persists **only** `completed`. `current` is **derived** as the first lesson not in `completed`. Never persist both.
- A word's picture filename is **derived** from its `id` (`/pics/${id}.svg`). The filename is never written down a second time.
- Instruction copy (icon + English text) lives **once** in `STEP_COPY`, and both the on-screen label and the spoken cue read from it.

**DRY — no duplicated rendering:**

- `PicTile` is the only component that renders picture + character + pinyin + audio. Every step composes it; no step reimplements it.
- `StepShell` is the only component that renders the step frame (instruction, spoken cue, Continue button). All five step components render inside it.
- `SentenceRow` is the only component that renders a row of words as a sentence.

**Other:**

- Vitest is dev-only. Nothing in this plan may add a runtime dependency to the portable Windows build.
- `lib/vocab.ts` and `lib/lessons.ts` are **not modified**. The grown-up section keeps working exactly as today.
- `npx tsc --noEmit` requires a prior `npx next build` (Next 16 generates `LayoutProps`/`PageProps` into `.next/types/`). Always build before typechecking.
- Test files live in `lib/__tests__/*.test.ts`, matching the existing `lib/__tests__/pinyin.test.ts`.
- **Never call `setState` synchronously inside a `useEffect` body.** React 19's `react-hooks/set-state-in-effect` rule rejects it, and `components/MicPractice.tsx:53` already fails on this. To read `localStorage`, use `useSyncExternalStore` via `lib/clientStore.ts`; for one-shot values, use a lazy `useState` initialiser.
- `npx eslint .` must report **no more than the 3 pre-existing errors** in `components/MicPractice.tsx`. Any new error is a regression to fix, not to accept.
- Commit after every task. Branch is `kid-learning-path`.

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `lib/curriculum.ts` | SSOT: `WORDS`, `LESSONS`, lookup + derivation helpers |
| `lib/steps.ts` | `Step` union + `buildSteps()` — pure step generation |
| `lib/progress.ts` | localStorage persistence; derives `current` and lock state |
| `lib/clientStore.ts` | Shared `useSyncExternalStore` adapter with a cached snapshot |
| `lib/pinyinPref.ts` | The pinyin-visible preference, built on `clientStore` |
| `lib/__tests__/curriculum.test.ts` | The guardrail: no untaught words, unique ids |
| `lib/__tests__/steps.test.ts` | Step generation invariants |
| `lib/__tests__/progress.test.ts` | Unlock order, corrupt-storage recovery |
| `lib/__tests__/pics.test.ts` | Every word has a picture file on disk |
| `scripts/fetch-pics.mjs` | Vendors OpenMoji SVGs into `public/pics/` |
| `public/pics/*.svg` | 20 vendored + 6 hand-authored |
| `components/kid/usePinyinVisible.ts` | Hook reading the pinyin preference |
| `components/kid/PicTile.tsx` | The atom: picture + character + pinyin + audio |
| `components/kid/SentenceRow.tsx` | A row of `PicTile`s forming a sentence |
| `components/kid/StepShell.tsx` | Shared frame: instruction, spoken cue, Continue |
| `components/kid/steps/*.tsx` | `MeetStep` `MatchStep` `SayStep` `BuildStep` `SwapStep` |
| `components/kid/LessonRunner.tsx` | Step index state machine + progress bar |
| `components/kid/StarPath.tsx` | The map on `/` |
| `components/kid/ParentSettings.tsx` | Pinyin toggle, voice picker, reset |
| `app/learn/[id]/page.tsx` | Lesson runner route |
| `app/(grown-ups)/layout.tsx` | Renders `NavBar` + `VoicePicker` for adult pages |
| `app/(grown-ups)/grown-ups/page.tsx` | Today's home page, moved |

**Modified:**

| File | Change |
|---|---|
| `app/layout.tsx` | Stop rendering `NavBar`/`VoicePicker`; they move to the grown-up layout |
| `app/page.tsx` | Replaced by `StarPath` |
| `package.json` | Add `openmoji` devDependency + `pics` script |
| `README.md` | OpenMoji attribution |

**Moved** (via `git mv`, URLs unchanged — route groups don't affect paths):
`app/{tones,lessons,dictionary,practice,strokes,characters,flashcards}` → `app/(grown-ups)/…`

---

### Task 1: Curriculum — the single source of truth

**Files:**
- Create: `lib/curriculum.ts`
- Test: `lib/__tests__/curriculum.test.ts`

**Interfaces:**
- Consumes: `lib/pinyin.ts` (`toDiacritics`) — existing.
- Produces: `Word`, `Sentence`, `KidLesson`, `WORDS: Record<string, Word>`, `LESSONS: KidLesson[]`, `getWord(zh): Word`, `lessonIndex(id): number`, `wordsTaughtBefore(index): Set<string>`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/curriculum.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  LESSONS,
  WORDS,
  getWord,
  lessonIndex,
  wordsTaughtBefore,
} from "@/lib/curriculum";

describe("WORDS", () => {
  it("keys every word by its own characters", () => {
    for (const [key, word] of Object.entries(WORDS)) {
      expect(word.zh).toBe(key);
    }
  });

  it("gives every word a unique ascii id for its picture filename", () => {
    const ids = Object.values(WORDS).map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("stores numbered pinyin, never diacritics", () => {
    for (const word of Object.values(WORDS)) {
      expect(word.pinyin).toMatch(/^[a-zA-Z:1-5\s]+$/);
    }
  });
});

describe("LESSONS", () => {
  it("introduces every new word from WORDS", () => {
    for (const lesson of LESSONS) {
      for (const zh of lesson.newWords) expect(WORDS[zh]).toBeDefined();
    }
  });

  it("never teaches the same word twice", () => {
    const seen = new Set<string>();
    for (const lesson of LESSONS) {
      for (const zh of lesson.newWords) {
        expect(seen.has(zh)).toBe(false);
        seen.add(zh);
      }
    }
  });

  // THE GUARDRAIL — the reason the schema uses refs instead of strings.
  it("never uses a word before it is taught", () => {
    LESSONS.forEach((lesson, i) => {
      const known = wordsTaughtBefore(i);
      for (const zh of lesson.newWords) known.add(zh);
      for (const sentence of [lesson.build, ...lesson.swaps]) {
        for (const zh of sentence.words) {
          expect(
            known.has(zh),
            `Lesson ${i + 1} (${lesson.id}) uses "${zh}" before it is taught`
          ).toBe(true);
        }
      }
    });
  });

  it("builds sentences of at least two words", () => {
    for (const lesson of LESSONS) {
      expect(lesson.build.words.length).toBeGreaterThanOrEqual(2);
    }
  });

  // Every swap must differ somewhere, or SWAP has no slot to blank.
  // Note it may differ in MORE than one place: lesson 6's 你喝茶吗
  // differs from 你喜欢猫吗 in two positions. buildSteps blanks the
  // FIRST difference, which is always a valid exercise.
  it("makes every swap differ from the sentence it is built from", () => {
    for (const lesson of LESSONS) {
      for (const swap of lesson.swaps) {
        const base = lesson.build.words;
        const firstDiff = swap.words.findIndex((zh, i) => zh !== base[i]);
        expect(
          firstDiff,
          `${lesson.id}: swap "${swap.en}" is identical to the build sentence`
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("has unique lesson ids", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("helpers", () => {
  it("looks a word up by characters", () => {
    expect(getWord("猫").en).toBe("cat");
  });

  it("throws on an unknown word rather than returning undefined", () => {
    expect(() => getWord("龘")).toThrow();
  });

  it("finds a lesson's position", () => {
    expect(lessonIndex(LESSONS[2].id)).toBe(2);
    expect(lessonIndex("nope")).toBe(-1);
  });

  it("collects everything taught before a lesson", () => {
    expect(wordsTaughtBefore(0).size).toBe(0);
    expect(wordsTaughtBefore(1)).toEqual(new Set(LESSONS[0].newWords));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/__tests__/curriculum.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/curriculum"`.

- [ ] **Step 3: Write the curriculum**

Create `lib/curriculum.ts`:

```ts
// SSOT for the kid learning path: every word, lesson, and sentence.
// Nothing else in the kid path defines a word. See the Global Constraints
// in docs/superpowers/plans/2026-08-20-kid-learning-path.md.
//
// lib/vocab.ts and lib/lessons.ts drive the grown-up section and are
// deliberately left alone.

export interface Word {
  /** Simplified characters. Also the key in WORDS. */
  zh: string;
  /** Unique ASCII slug. Sole source of the picture filename: /pics/{id}.svg */
  id: string;
  /** CC-CEDICT numbered pinyin. Diacritics are derived, never stored. */
  pinyin: string;
  en: string;
  /**
   * Where the picture comes from. Read only by scripts/fetch-pics.mjs;
   * the app never looks at it — it uses /pics/{id}.svg.
   * - openmoji: hex codepoint(s) of the source SVG in the openmoji package
   * - custom:   hand-authored, already committed to public/pics/
   */
  art: { from: "openmoji"; hex: string } | { from: "custom" };
  /** Rendered if the SVG is missing, so a broken asset degrades. */
  emoji: string;
}

export interface Sentence {
  /** Refs into WORDS — never a flat string. This is what makes the ladder work. */
  words: string[];
  en: string;
}

export interface KidLesson {
  id: string;
  /** English, shown to the parent on the star path — not to the child. */
  title: string;
  /** Word whose picture represents the lesson on the star path. */
  icon: string;
  /** 1–3 refs, introduced in this order. */
  newWords: string[];
  /** The sentence the ladder assembles. */
  build: Sentence;
  /** Same shape, one word changed (or one word added, for 吗 and 不). */
  swaps: Sentence[];
}

const w = (
  zh: string,
  id: string,
  pinyin: string,
  en: string,
  emoji: string,
  art: Word["art"]
): Word => ({ zh, id, pinyin, en, emoji, art });

const omj = (hex: string): Word["art"] => ({ from: "openmoji", hex });
const custom: Word["art"] = { from: "custom" };

export const WORDS: Record<string, Word> = Object.fromEntries(
  [
    // Lesson 1
    w("你", "ni", "ni3", "you", "👉", custom),
    w("好", "hao", "hao3", "good", "👍", omj("1F44D")),
    w("我", "wo", "wo3", "I / me", "🙋", custom),
    // Lesson 2
    w("是", "shi", "shi4", "to be", "✅", omj("2705")),
    w("学生", "xuesheng", "xue2 sheng5", "student", "🎒", omj("1F392")),
    w("老师", "laoshi", "lao3 shi1", "teacher", "🧑‍🏫", omj("1F9D1-200D-1F3EB")),
    // Lesson 3
    w("喜欢", "xihuan", "xi3 huan5", "to like", "😍", omj("1F60D")),
    w("猫", "mao", "mao1", "cat", "🐱", omj("1F431")),
    w("狗", "gou", "gou3", "dog", "🐶", omj("1F436")),
    // Lesson 4
    w("喝", "he", "he1", "to drink", "🥤", omj("1F964")),
    w("水", "shui", "shui3", "water", "💧", omj("1F4A7")),
    w("茶", "cha", "cha2", "tea", "🍵", omj("1F375")),
    // Lesson 5
    w("吃", "chi", "chi1", "to eat", "😋", custom),
    w("米饭", "mifan", "mi3 fan4", "rice", "🍚", omj("1F35A")),
    w("苹果", "pingguo", "ping2 guo3", "apple", "🍎", omj("1F34E")),
    // Lesson 6
    w("吗", "ma", "ma5", "(makes a question)", "❔", custom),
    // Lesson 7
    w("他", "ta-he", "ta1", "he", "👨", omj("1F468")),
    w("她", "ta-she", "ta1", "she", "👩", omj("1F469")),
    // Lesson 8
    w("大", "da", "da4", "big", "🐘", custom),
    w("小", "xiao", "xiao3", "small", "🐭", custom),
    // Lesson 9
    w("不", "bu", "bu4", "not", "❌", omj("274C")),
    // Lesson 10
    w("去", "qu", "qu4", "to go", "🚶", omj("1F6B6")),
    w("学校", "xuexiao", "xue2 xiao4", "school", "🏫", omj("1F3EB")),
    w("家", "jia", "jia1", "home", "🏠", omj("1F3E0")),
    // Standalone phrases — taught whole, never entering the ladder.
    w("谢谢", "xiexie", "xie4 xie5", "thank you", "🙏", omj("1F64F")),
    w("再见", "zaijian", "zai4 jian4", "goodbye", "👋", omj("1F44B")),
  ].map((word) => [word.zh, word])
);

const s = (words: string[], en: string): Sentence => ({ words, en });

/** Order is array position. There is deliberately no `number` field. */
export const LESSONS: KidLesson[] = [
  {
    id: "hello",
    title: "Hello",
    icon: "好",
    newWords: ["你", "好", "我"],
    build: s(["你", "好"], "Hello!"),
    swaps: [],
  },
  {
    id: "i-am",
    title: "I am",
    icon: "学生",
    newWords: ["是", "学生", "老师"],
    build: s(["我", "是", "学生"], "I am a student."),
    swaps: [
      s(["我", "是", "老师"], "I am a teacher."),
      s(["你", "是", "老师"], "You are a teacher."),
    ],
  },
  {
    id: "i-like",
    title: "I like",
    icon: "猫",
    newWords: ["喜欢", "猫", "狗"],
    build: s(["我", "喜欢", "猫"], "I like cats."),
    swaps: [
      s(["我", "喜欢", "狗"], "I like dogs."),
      s(["你", "喜欢", "猫"], "You like cats."),
    ],
  },
  {
    id: "i-drink",
    title: "I drink",
    icon: "茶",
    newWords: ["喝", "水", "茶"],
    build: s(["我", "喝", "茶"], "I drink tea."),
    swaps: [s(["我", "喝", "水"], "I drink water.")],
  },
  {
    id: "i-eat",
    title: "I eat",
    icon: "苹果",
    newWords: ["吃", "米饭", "苹果"],
    build: s(["我", "吃", "苹果"], "I eat apples."),
    swaps: [s(["我", "吃", "米饭"], "I eat rice.")],
  },
  {
    // Multiplier: turns every sentence already learned into a question.
    id: "asking",
    title: "Asking",
    icon: "吗",
    newWords: ["吗"],
    build: s(["你", "喜欢", "猫", "吗"], "Do you like cats?"),
    swaps: [
      s(["你", "喝", "茶", "吗"], "Do you drink tea?"),
      s(["你", "是", "学生", "吗"], "Are you a student?"),
    ],
  },
  {
    // Multiplier: swaps the subject on everything already learned.
    id: "he-she",
    title: "He & she",
    icon: "她",
    newWords: ["他", "她"],
    build: s(["她", "是", "老师"], "She is a teacher."),
    swaps: [
      s(["他", "喜欢", "狗"], "He likes dogs."),
      s(["他", "吃", "苹果"], "He eats apples."),
    ],
  },
  {
    id: "big-small",
    title: "Big & small",
    icon: "大",
    newWords: ["大", "小"],
    build: s(["大", "猫"], "a big cat"),
    swaps: [s(["小", "猫"], "a small cat"), s(["小", "狗"], "a small dog")],
  },
  {
    // Multiplier: negates everything already learned.
    id: "saying-no",
    title: "Saying no",
    icon: "不",
    newWords: ["不"],
    build: s(["我", "不", "喜欢", "猫"], "I don't like cats."),
    swaps: [
      s(["他", "不", "是", "老师"], "He is not a teacher."),
      s(["我", "不", "吃", "苹果"], "I don't eat apples."),
    ],
  },
  {
    id: "going",
    title: "Going",
    icon: "学校",
    newWords: ["去", "学校", "家"],
    build: s(["我", "去", "学校"], "I go to school."),
    swaps: [
      s(["他", "去", "学校"], "He goes to school."),
      s(["我", "不", "去", "学校"], "I don't go to school."),
      s(["你", "去", "学校", "吗"], "Do you go to school?"),
    ],
  },
];

export function getWord(zh: string): Word {
  const word = WORDS[zh];
  if (!word) throw new Error(`No word in the curriculum for "${zh}"`);
  return word;
}

export function lessonIndex(id: string): number {
  return LESSONS.findIndex((l) => l.id === id);
}

/** Every word introduced strictly before the lesson at `index`. */
export function wordsTaughtBefore(index: number): Set<string> {
  const known = new Set<string>();
  for (const lesson of LESSONS.slice(0, index)) {
    for (const zh of lesson.newWords) known.add(zh);
  }
  return known;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/__tests__/curriculum.test.ts`
Expected: PASS, 12 tests.

If the guardrail test fails, a sentence uses an untaught word — the failure message names the lesson and the word. Fix the curriculum, not the test.

- [ ] **Step 5: Commit**

```bash
git add lib/curriculum.ts lib/__tests__/curriculum.test.ts
git commit -m "Add kid curriculum as the single source of truth

Sentences are arrays of word refs rather than strings, so the
word-to-sentence ladder is expressible and a test can prove no sentence
uses a word the child has not met. Lesson order is array position; there
is no number field that could disagree with it."
```

---

### Task 2: Step generation

**Files:**
- Create: `lib/steps.ts`
- Test: `lib/__tests__/steps.test.ts`

**Interfaces:**
- Consumes: `lib/curriculum.ts` (`KidLesson`, `Sentence`, `LESSONS`, `wordsTaughtBefore`, `lessonIndex`).
- Produces: `Step` union, `STEP_COPY: Record<Step["kind"], {icon: string; text: string}>`, `buildSteps(lessonId: string): Step[]`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/steps.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LESSONS } from "@/lib/curriculum";
import { STEP_COPY, buildSteps, type Step } from "@/lib/steps";

const stepsFor = (id: string) => buildSteps(id);
const kinds = (steps: Step[]) => steps.map((s) => s.kind);

describe("buildSteps", () => {
  it("throws on an unknown lesson", () => {
    expect(() => buildSteps("nope")).toThrow();
  });

  it("starts every lesson by meeting a word", () => {
    for (const lesson of LESSONS) {
      expect(stepsFor(lesson.id)[0].kind).toBe("MEET");
    }
  });

  it("meets then says each new word, in curriculum order", () => {
    const steps = stepsFor("i-drink"); // 喝 水 茶
    const met = steps.filter((s) => s.kind === "MEET").map((s) => s.zh);
    expect(met).toEqual(["喝", "水", "茶"]);
  });

  it("meets a word before it appears in any BUILD", () => {
    for (const lesson of LESSONS) {
      const steps = stepsFor(lesson.id);
      steps.forEach((step, i) => {
        if (step.kind !== "BUILD") return;
        for (const zh of step.answer) {
          if (!lesson.newWords.includes(zh)) continue;
          const metAt = steps.findIndex(
            (s, j) => j < i && s.kind === "MEET" && s.zh === zh
          );
          expect(metAt, `${zh} used in BUILD before MEET`).toBeGreaterThanOrEqual(0);
        }
      });
    }
  });

  it("ladders BUILD one prefix at a time, from two words up", () => {
    const builds = stepsFor("i-drink").filter((s) => s.kind === "BUILD");
    expect(builds.map((b) => b.answer)).toEqual([
      ["我", "喝"],
      ["我", "喝", "茶"],
    ]);
  });

  it("emits a single BUILD for a two-word sentence", () => {
    const builds = stepsFor("hello").filter((s) => s.kind === "BUILD");
    expect(builds.map((b) => b.answer)).toEqual([["你", "好"]]);
  });

  it("emits one SWAP per swap sentence", () => {
    const lesson = LESSONS.find((l) => l.id === "i-am")!;
    const swaps = stepsFor("i-am").filter((s) => s.kind === "SWAP");
    expect(swaps).toHaveLength(lesson.swaps.length);
  });

  it("blanks exactly one slot in a SWAP", () => {
    for (const lesson of LESSONS) {
      for (const step of stepsFor(lesson.id)) {
        if (step.kind !== "SWAP") continue;
        expect(step.answer).toBe(step.sentence[step.blankAt]);
        expect(step.choices).toContain(step.answer);
        expect(new Set(step.choices).size).toBe(step.choices.length);
      }
    }
  });

  it("ends every lesson by saying the whole sentence", () => {
    for (const lesson of LESSONS) {
      const steps = stepsFor(lesson.id);
      const last = steps[steps.length - 1];
      expect(last.kind).toBe("SAY");
      expect(last.kind === "SAY" && last.words).toEqual(lesson.build.words);
    }
  });

  it("only ever offers words the child already knows as MATCH distractors", () => {
    LESSONS.forEach((lesson, i) => {
      const known = new Set([
        ...Array.from({ length: i }, (_, j) => LESSONS[j].newWords).flat(),
        ...lesson.newWords,
      ]);
      for (const step of stepsFor(lesson.id)) {
        if (step.kind !== "MATCH") continue;
        for (const choice of step.choices) expect(known.has(choice)).toBe(true);
      }
    });
  });

  it("emits no MATCH when a lesson teaches fewer than two words", () => {
    expect(kinds(stepsFor("asking"))).not.toContain("MATCH"); // 吗 only
    expect(kinds(stepsFor("saying-no"))).not.toContain("MATCH"); // 不 only
  });

  it("is deterministic — the same lesson yields the same steps", () => {
    expect(stepsFor("i-like")).toEqual(stepsFor("i-like"));
  });
});

describe("STEP_COPY", () => {
  it("covers every step kind exactly once", () => {
    expect(Object.keys(STEP_COPY).sort()).toEqual(
      ["BUILD", "MATCH", "MEET", "SAY", "SWAP"].sort()
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/__tests__/steps.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/steps"`.

- [ ] **Step 3: Write the step generator**

Create `lib/steps.ts`:

```ts
// Derives the entire exercise sequence for a lesson from curriculum data.
// Pure and deterministic: no randomness, no Date, no storage. Adding a
// lesson is a data edit in lib/curriculum.ts — never a change here.

import {
  LESSONS,
  lessonIndex,
  wordsTaughtBefore,
  type KidLesson,
} from "./curriculum";

export type Step =
  /** See a new word: big picture, characters, audio plays automatically. */
  | { kind: "MEET"; zh: string }
  /** Hear a word, tap its picture out of `choices`. */
  | { kind: "MATCH"; answer: string; choices: string[] }
  /** Say a word or the whole sentence into the microphone. */
  | { kind: "SAY"; words: string[]; en: string }
  /** Tap picture-tiles into order to assemble `answer`. */
  | { kind: "BUILD"; answer: string[]; en: string }
  /** One slot of `sentence` is blank; pick the word that fills it. */
  | { kind: "SWAP"; sentence: string[]; blankAt: number; answer: string; choices: string[]; en: string };

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
 * Pick distractors the child already knows: earlier lessons first, then
 * other words met in this lesson. Deterministic — takes them in order.
 */
function pickDistractors(
  answer: string,
  known: string[],
  count: number
): string[] {
  return known.filter((zh) => zh !== answer).slice(0, count);
}

export function buildSteps(lessonId: string): Step[] {
  const index = lessonIndex(lessonId);
  if (index < 0) throw new Error(`No lesson with id "${lessonId}"`);
  const lesson: KidLesson = LESSONS[index];

  const earlier = [...wordsTaughtBefore(index)];
  const steps: Step[] = [];
  const metThisLesson: string[] = [];

  // 1 & 2. Meet each new word, say it, and MATCH after every second one.
  lesson.newWords.forEach((zh, i) => {
    steps.push({ kind: "MEET", zh });
    steps.push({ kind: "SAY", words: [zh], en: "" });
    metThisLesson.push(zh);

    const isCheckpoint = (i + 1) % MATCH_EVERY === 0;
    // A lesson teaching one word (吗, 不) never reaches a checkpoint.
    if (!isCheckpoint) return;

    // Earlier lessons first; fall back to this lesson's own words (lesson 1).
    const pool = [...earlier, ...metThisLesson.filter((m) => m !== zh)];
    const distractors = pickDistractors(zh, pool, MATCH_CHOICES - 1);
    if (distractors.length < MATCH_CHOICES - 1) return; // too early to test
    steps.push({ kind: "MATCH", answer: zh, choices: [zh, ...distractors] });
  });

  // 3. Ladder the build sentence: one BUILD per prefix of length 2..N.
  const target = lesson.build.words;
  for (let n = 2; n <= target.length; n++) {
    steps.push({
      kind: "BUILD",
      answer: target.slice(0, n),
      // Only the full sentence has a meaningful translation.
      en: n === target.length ? lesson.build.en : "",
    });
  }

  // 4. One SWAP per swap sentence, blanking the slot that differs.
  for (const swap of lesson.swaps) {
    const blankAt = swap.words.findIndex((zh, i) => zh !== target[i]);
    // A swap identical to the build teaches nothing; skip it.
    if (blankAt < 0) continue;
    const answer = swap.words[blankAt];
    const pool = [...earlier, ...lesson.newWords];
    const distractors = pickDistractors(answer, pool, MATCH_CHOICES - 1);
    steps.push({
      kind: "SWAP",
      sentence: swap.words,
      blankAt,
      answer,
      choices: [answer, ...distractors],
      en: swap.en,
    });
  }

  // 5. Say the whole thing.
  steps.push({ kind: "SAY", words: target, en: lesson.build.en });

  return steps;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/__tests__/steps.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS — 3 files (pinyin, curriculum, steps).

- [ ] **Step 6: Commit**

```bash
git add lib/steps.ts lib/__tests__/steps.test.ts
git commit -m "Derive lesson steps from curriculum data

buildSteps is pure and deterministic: a lesson goes in, the full ordered
exercise sequence comes out. Adding a lesson is a data edit. Instruction
copy lives once in STEP_COPY so the on-screen label and the spoken cue
cannot drift apart."
```

---

### Task 3: Progress

**Files:**
- Create: `lib/progress.ts`
- Test: `lib/__tests__/progress.test.ts`

**Interfaces:**
- Consumes: `lib/curriculum.ts` (`LESSONS`, `lessonIndex`).
- Produces: `PROGRESS_KEY`, `Progress`, `readProgress()`, `writeProgress(p)`, `completeLesson(p, id, stars)`, `currentLessonId(p)`, `isUnlocked(p, id)`, `starsFor(p, id)`, `awardStars(opts)`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/progress.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LESSONS } from "@/lib/curriculum";
import {
  PROGRESS_KEY,
  awardStars,
  completeLesson,
  currentLessonId,
  isUnlocked,
  readProgress,
  starsFor,
  writeProgress,
  type Progress,
} from "@/lib/progress";

const EMPTY: Progress = { completed: {} };

// Minimal localStorage stand-in — the suite runs without a DOM.
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

describe("currentLessonId", () => {
  it("is the first lesson on a fresh install", () => {
    expect(currentLessonId(EMPTY)).toBe(LESSONS[0].id);
  });

  it("advances to the first lesson not completed", () => {
    const p = completeLesson(EMPTY, LESSONS[0].id, 3);
    expect(currentLessonId(p)).toBe(LESSONS[1].id);
  });

  it("stays on the last lesson once everything is done", () => {
    const p = LESSONS.reduce((acc, l) => completeLesson(acc, l.id, 3), EMPTY);
    expect(currentLessonId(p)).toBe(LESSONS[LESSONS.length - 1].id);
  });
});

describe("isUnlocked", () => {
  it("unlocks only the first lesson on a fresh install", () => {
    expect(isUnlocked(EMPTY, LESSONS[0].id)).toBe(true);
    expect(isUnlocked(EMPTY, LESSONS[1].id)).toBe(false);
  });

  it("keeps completed lessons unlocked so they can be replayed", () => {
    const p = completeLesson(EMPTY, LESSONS[0].id, 1);
    expect(isUnlocked(p, LESSONS[0].id)).toBe(true);
    expect(isUnlocked(p, LESSONS[1].id)).toBe(true);
    expect(isUnlocked(p, LESSONS[2].id)).toBe(false);
  });
});

describe("completeLesson", () => {
  it("never lowers an existing star count", () => {
    let p = completeLesson(EMPTY, LESSONS[0].id, 3);
    p = completeLesson(p, LESSONS[0].id, 1);
    expect(starsFor(p, LESSONS[0].id)).toBe(3);
  });

  it("does not mutate the progress it is given", () => {
    const before = JSON.stringify(EMPTY);
    completeLesson(EMPTY, LESSONS[0].id, 2);
    expect(JSON.stringify(EMPTY)).toBe(before);
  });
});

describe("awardStars", () => {
  it("gives one star just for finishing", () => {
    expect(awardStars({ cleanMatches: false, allSpoken: false })).toBe(1);
  });

  it("adds a star for a clean run and for speaking every prompt", () => {
    expect(awardStars({ cleanMatches: true, allSpoken: true })).toBe(3);
  });
});

describe("readProgress", () => {
  it("returns empty progress when storage is empty", () => {
    expect(readProgress()).toEqual(EMPTY);
  });

  it("recovers from corrupt storage instead of throwing", () => {
    localStorage.setItem(PROGRESS_KEY, "{not json");
    expect(readProgress()).toEqual(EMPTY);
  });

  it("discards a stored shape that is not progress", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ completed: 42 }));
    expect(readProgress()).toEqual(EMPTY);
  });

  it("drops lessons that no longer exist in the curriculum", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ completed: { "deleted-lesson": { stars: 3, at: 1 } } })
    );
    expect(readProgress()).toEqual(EMPTY);
  });

  it("round-trips real progress", () => {
    writeProgress(completeLesson(EMPTY, LESSONS[0].id, 2));
    expect(starsFor(readProgress(), LESSONS[0].id)).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/__tests__/progress.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/progress"`.

- [ ] **Step 3: Write the progress module**

Create `lib/progress.ts`:

```ts
// Kid-path progress. Deliberately separate from the grown-up flashcard
// store ("mandarin-srs-v1") so the two never interfere.
//
// SSOT: only `completed` is persisted. The current lesson and the lock
// state are DERIVED from it, so they can never drift out of sync.

import { LESSONS, lessonIndex } from "./curriculum";

export const PROGRESS_KEY = "mandarin-kid-v1";

export interface Progress {
  completed: Record<string, { stars: number; at: number }>;
}

const EMPTY: Progress = { completed: {} };

/** The child can always reach the first unfinished lesson, and no further. */
export function currentLessonId(p: Progress): string {
  const next = LESSONS.find((l) => !p.completed[l.id]);
  return (next ?? LESSONS[LESSONS.length - 1]).id;
}

export function isUnlocked(p: Progress, id: string): boolean {
  const index = lessonIndex(id);
  if (index < 0) return false;
  return index <= lessonIndex(currentLessonId(p));
}

export function starsFor(p: Progress, id: string): number {
  return p.completed[id]?.stars ?? 0;
}

/** Returns new progress; never mutates. Stars only ever go up. */
export function completeLesson(
  p: Progress,
  id: string,
  stars: number,
  at: number = Date.now()
): Progress {
  const best = Math.max(stars, starsFor(p, id));
  return { completed: { ...p.completed, [id]: { stars: best, at } } };
}

/** One star for finishing, one for a clean run, one for speaking throughout. */
export function awardStars(opts: {
  cleanMatches: boolean;
  allSpoken: boolean;
}): number {
  return 1 + (opts.cleanMatches ? 1 : 0) + (opts.allSpoken ? 1 : 0);
}

function isValid(value: unknown): value is Progress {
  if (typeof value !== "object" || value === null) return false;
  const completed = (value as Progress).completed;
  if (typeof completed !== "object" || completed === null) return false;
  return Object.entries(completed).every(
    ([id, entry]) =>
      lessonIndex(id) >= 0 &&
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as { stars: unknown }).stars === "number"
  );
}

/** Never throws. Corrupt or stale storage resolves to a fresh start. */
export function readProgress(): Progress {
  if (typeof localStorage === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function writeProgress(p: Progress): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    // Storage unavailable (private mode, quota) — progress just won't persist.
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/__tests__/progress.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Add the client store helper**

React components cannot read `localStorage` during a server render, and
reading it in a `useEffect` that calls `setState` is exactly the pattern
eslint rejects at `components/MicPractice.tsx:53`. `useSyncExternalStore`
is the correct answer, but it requires a **cached** snapshot — returning
a fresh object each call makes it loop forever.

This helper is written once and used by both progress and the pinyin
preference, so neither reimplements the caching.

Create `lib/clientStore.ts`:

```ts
"use client";

/**
 * A localStorage-backed store shaped for useSyncExternalStore.
 *
 * The snapshot is cached because useSyncExternalStore compares snapshots
 * by reference — returning a freshly-parsed object on every call would
 * re-render forever. `set` and `invalidate` are the only ways it changes.
 */
export function createClientStore<T>(read: () => T, serverValue: T) {
  let snapshot: T | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot(): T {
      if (snapshot === null) snapshot = read();
      return snapshot;
    },
    /** Server renders never touch storage; they get the neutral value. */
    getServerSnapshot(): T {
      return serverValue;
    },
    /** Record a value already written to storage. */
    set(value: T) {
      snapshot = value;
      emit();
    },
    /** Force the next read to hit storage again (used after a reset). */
    invalidate() {
      snapshot = null;
      emit();
    },
  };
}
```

- [ ] **Step 6: Expose progress through the store**

Append to `lib/progress.ts`:

```ts
import { createClientStore } from "./clientStore";

const store = createClientStore<Progress>(readProgress, EMPTY);

export const subscribeProgress = store.subscribe;
export const getProgressSnapshot = store.getSnapshot;
export const getProgressServerSnapshot = store.getServerSnapshot;

/** Persist progress and tell every subscribed component. */
export function saveProgress(p: Progress): void {
  writeProgress(p);
  store.set(p);
}

/** Used by the reset button after clearing storage. */
export function reloadProgress(): void {
  store.invalidate();
}
```

Move the `import { createClientStore }` line up to join the existing
imports at the top of the file.

- [ ] **Step 7: Test the store layer**

Append to `lib/__tests__/progress.test.ts`:

```ts
describe("progress store", () => {
  it("notifies subscribers when progress is saved", () => {
    let notified = 0;
    const unsubscribe = subscribeProgress(() => notified++);
    saveProgress(completeLesson(EMPTY, LESSONS[0].id, 1));
    expect(notified).toBe(1);
    unsubscribe();
    saveProgress(completeLesson(EMPTY, LESSONS[1].id, 1));
    expect(notified).toBe(1);
  });

  it("returns the same reference until progress changes", () => {
    // useSyncExternalStore compares by reference — an unstable snapshot
    // would re-render forever.
    expect(getProgressSnapshot()).toBe(getProgressSnapshot());
  });

  it("serves neutral progress to server renders", () => {
    expect(getProgressServerSnapshot()).toEqual(EMPTY);
  });
});
```

Add `getProgressServerSnapshot`, `getProgressSnapshot`, `saveProgress`,
and `subscribeProgress` to the import list at the top of the file.

- [ ] **Step 8: Run the tests**

Run: `npx vitest run lib/__tests__/progress.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 9: Commit**

```bash
git add lib/progress.ts lib/clientStore.ts lib/__tests__/progress.test.ts
git commit -m "Add kid-path progress with a derived current lesson

Only `completed` is persisted; the current lesson and lock state are
derived from it, so the two cannot drift. Corrupt, absent, or stale
storage resolves to a fresh start rather than throwing.

Components read it through useSyncExternalStore over a cached snapshot,
so no component calls setState inside an effect to reach localStorage."
```

---

### Task 4: Pictures

**Files:**
- Create: `scripts/fetch-pics.mjs`, `public/pics/{ni,wo,chi,ma,da,xiao}.svg`
- Test: `lib/__tests__/pics.test.ts`
- Modify: `package.json` (add `openmoji` devDependency and a `pics` script)

**Interfaces:**
- Consumes: `lib/curriculum.ts` (`WORDS`, `Word.art`, `Word.id`).
- Produces: `public/pics/{id}.svg` for every word. Nothing imports the script.

- [ ] **Step 1: Install OpenMoji as a dev dependency**

```bash
npm install -D openmoji
```

- [ ] **Step 2: Write the failing test**

Create `lib/__tests__/pics.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WORDS } from "@/lib/curriculum";

describe("picture coverage", () => {
  it("has an SVG on disk for every word", () => {
    const missing = Object.values(WORDS)
      .filter((w) => !existsSync(`public/pics/${w.id}.svg`))
      .map((w) => `${w.zh} (${w.id}.svg)`);
    expect(missing, "run `npm run pics`").toEqual([]);
  });

  it("ships real SVG, not an empty or stub file", () => {
    for (const word of Object.values(WORDS)) {
      const svg = readFileSync(`public/pics/${word.id}.svg`, "utf8");
      expect(svg, word.zh).toContain("<svg");
      expect(svg.length, word.zh).toBeGreaterThan(100);
    }
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run lib/__tests__/pics.test.ts`
Expected: FAIL — every word listed as missing.

- [ ] **Step 4: Author the six hand-drawn SVGs**

These are the words no emoji set expresses. Each is a 100×100 viewBox.

`public/pics/wo.svg` — 我 (me): a figure pointing at its own chest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="me">
  <circle cx="50" cy="26" r="15" fill="#fcd34d" stroke="#92400e" stroke-width="3"/>
  <path d="M50 41 v34" stroke="#92400e" stroke-width="6" stroke-linecap="round"/>
  <path d="M50 82 l-13 15 M50 82 l13 15" stroke="#92400e" stroke-width="6" stroke-linecap="round"/>
  <path d="M22 60 q14 12 24 -6" fill="none" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>
  <circle cx="47" cy="55" r="5" fill="#dc2626"/>
</svg>
```

`public/pics/ni.svg` — 你 (you): a figure pointing outward, at the viewer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="you">
  <circle cx="34" cy="26" r="15" fill="#a5b4fc" stroke="#3730a3" stroke-width="3"/>
  <path d="M34 41 v34" stroke="#3730a3" stroke-width="6" stroke-linecap="round"/>
  <path d="M34 82 l-12 15 M34 82 l12 15" stroke="#3730a3" stroke-width="6" stroke-linecap="round"/>
  <path d="M40 56 h38" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>
  <path d="M70 47 l12 9 -12 9" fill="none" stroke="#dc2626" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

`public/pics/chi.svg` — 吃 (to eat): an open mouth taking food.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="to eat">
  <path d="M12 46 a38 38 0 0 0 76 0 z" fill="#ef4444" stroke="#7f1d1d" stroke-width="3"/>
  <path d="M12 46 h76" stroke="#7f1d1d" stroke-width="4" stroke-linecap="round"/>
  <path d="M24 60 a26 12 0 0 0 52 0 z" fill="#fca5a5"/>
  <circle cx="50" cy="24" r="12" fill="#84cc16" stroke="#3f6212" stroke-width="3"/>
  <path d="M50 12 v-6" stroke="#3f6212" stroke-width="3" stroke-linecap="round"/>
</svg>
```

`public/pics/ma.svg` — 吗 (question particle): a speech bubble asking.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="question">
  <path d="M14 18 h72 a8 8 0 0 1 8 8 v40 a8 8 0 0 1 -8 8 h-38 l-20 18 v-18 h-14 a8 8 0 0 1 -8 -8 v-40 a8 8 0 0 1 8 -8 z" fill="#bfdbfe" stroke="#1e40af" stroke-width="3"/>
  <path d="M38 38 a12 12 0 1 1 12 12 v6" fill="none" stroke="#1e40af" stroke-width="7" stroke-linecap="round"/>
  <circle cx="50" cy="65" r="4.5" fill="#1e40af"/>
</svg>
```

`public/pics/da.svg` — 大 (big): the contrast *is* the picture, so both
sizes appear and the big one is highlighted.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="big">
  <circle cx="72" cy="72" r="12" fill="#e5e7eb" stroke="#9ca3af" stroke-width="3"/>
  <circle cx="40" cy="46" r="34" fill="#f97316" stroke="#7c2d12" stroke-width="4"/>
  <path d="M40 6 v-0.5 M6 46 h-0.5" stroke="#7c2d12" stroke-width="3"/>
  <path d="M14 20 l-8 -8 M66 20 l8 -8" stroke="#7c2d12" stroke-width="4" stroke-linecap="round"/>
</svg>
```

`public/pics/xiao.svg` — 小 (small): the same pair, small one highlighted.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="small">
  <circle cx="40" cy="46" r="34" fill="#e5e7eb" stroke="#9ca3af" stroke-width="3"/>
  <circle cx="72" cy="72" r="12" fill="#f97316" stroke="#7c2d12" stroke-width="4"/>
  <path d="M84 60 l7 -7 M60 60 l-7 -7" stroke="#7c2d12" stroke-width="4" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 5: Write the vendoring script**

Create `scripts/fetch-pics.mjs`:

```js
// Copies the OpenMoji SVGs the curriculum needs into public/pics/,
// naming each by the word's `id`. Only the ~20 files actually used are
// vendored — the openmoji package itself is a dev dependency and never
// ships. Hand-authored pictures (art.from === "custom") are already in
// public/pics/ and are only verified here.
//
// Run: npm run pics

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "pics");
const srcDir = join(root, "node_modules", "openmoji", "color", "svg");

// Read the curriculum without a TS toolchain: pull the literals out of
// the source. Keeps lib/curriculum.ts the single source of truth.
const source = await import("node:fs").then((fs) =>
  fs.readFileSync(join(root, "lib", "curriculum.ts"), "utf8")
);

const words = [...source.matchAll(
  /w\(\s*"([^"]+)",\s*"([^"]+)",\s*"[^"]*",\s*"[^"]*",\s*"[^"]*",\s*(omj\("([^"]+)"\)|custom)\s*\)/g
)].map((m) => ({ zh: m[1], id: m[2], hex: m[4] ?? null }));

if (words.length === 0) {
  console.error("Parsed no words from lib/curriculum.ts — has `w(...)` changed?");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const missing = [];
let copied = 0;

for (const { zh, id, hex } of words) {
  const dest = join(outDir, `${id}.svg`);
  if (hex === null) {
    if (!existsSync(dest)) missing.push(`${zh} — hand-authored ${id}.svg not found`);
    continue;
  }
  const src = join(srcDir, `${hex}.svg`);
  if (!existsSync(src)) {
    missing.push(`${zh} — no OpenMoji SVG for codepoint ${hex}`);
    continue;
  }
  copyFileSync(src, dest);
  copied++;
}

console.log(`Vendored ${copied} OpenMoji SVGs into public/pics/`);

if (missing.length > 0) {
  console.error(`\n${missing.length} picture(s) missing:`);
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}
```

- [ ] **Step 6: Add the script to package.json**

Add to `"scripts"`:

```json
"pics": "node scripts/fetch-pics.mjs"
```

- [ ] **Step 7: Run it**

Run: `npm run pics`
Expected: `Vendored 20 OpenMoji SVGs into public/pics/` and exit 0.

If a codepoint is reported missing, find the correct hex in
`node_modules/openmoji/data/openmoji.json` and fix the `omj(...)` value in
`lib/curriculum.ts`. Do not delete the word.

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run lib/__tests__/pics.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 9: Commit**

```bash
git add scripts/fetch-pics.mjs public/pics lib/__tests__/pics.test.ts package.json package-lock.json
git commit -m "Vendor curriculum pictures from OpenMoji

Only the SVGs the curriculum actually needs are copied into public/pics,
named by each word's id so the filename is derived rather than written
down twice. OpenMoji is a dev dependency and never ships. Six pictures
are hand-authored: the me/you and big/small pairs, where the contrast is
the lesson, plus 'to eat' and the question particle."
```

---

### Task 5: Route restructure

Moves the seven existing pages behind a `/grown-ups` door **without
changing their URLs or their behaviour**. Route groups (parenthesised
directories) do not appear in the URL.

**Files:**
- Create: `app/(grown-ups)/layout.tsx`, `app/(grown-ups)/grown-ups/page.tsx`
- Modify: `app/layout.tsx`, `app/page.tsx`
- Move: seven page directories

- [ ] **Step 1: Move the grown-up pages**

```bash
mkdir -p "app/(grown-ups)"
git mv app/tones app/lessons app/dictionary app/practice app/strokes app/characters app/flashcards "app/(grown-ups)/"
mkdir -p "app/(grown-ups)/grown-ups"
git mv app/page.tsx "app/(grown-ups)/grown-ups/page.tsx"
```

`app/api/search` stays where it is — API routes do not use layouts.

- [ ] **Step 2: Give the grown-up pages their own layout**

Create `app/(grown-ups)/layout.tsx`. This is the only place `NavBar`
renders, so the kid path can never show it:

```tsx
import Link from "next/link";
import NavBar from "@/components/NavBar";
import VoicePicker from "@/components/VoicePicker";

export default function GrownUpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
        <Link href="/" className="hover:underline">
          ← Back to the kids&apos; path
        </Link>
        <span className="mx-2">·</span>
        Dictionary data: CC-CEDICT (CC BY-SA 4.0) · Stroke data: Hanzi Writer ·
        Pictures: OpenMoji (CC BY-SA 4.0)
      </footer>
      <VoicePicker />
    </>
  );
}
```

- [ ] **Step 3: Strip the grown-up chrome out of the root layout**

In `app/layout.tsx`, remove the `NavBar` and `VoicePicker` imports and
replace the `<body>` contents so the kid path renders bare:

```tsx
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
```

The `<main>` wrapper and footer move into the grown-up layout (Step 2);
the kid pages supply their own, because the runner is full-bleed.

- [ ] **Step 4: Add a temporary kid home**

Create `app/page.tsx` — replaced properly in Task 9, but the app must
build and run after every task:

```tsx
import Link from "next/link";
import { LESSONS } from "@/lib/curriculum";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-3xl font-bold">🐉 Learn Mandarin</h1>
      <ul className="mt-6 space-y-2">
        {LESSONS.map((l) => (
          <li key={l.id}>
            <Link href={`/learn/${l.id}`} className="hover:underline">
              {l.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/grown-ups" className="mt-8 inline-block text-sm text-zinc-500 hover:underline">
        For grown-ups →
      </Link>
    </main>
  );
}
```

- [ ] **Step 5: Verify every old URL still works**

```bash
npx next build
```

Expected: the route list still shows `/tones`, `/dictionary`,
`/practice`, `/strokes`, `/characters`, `/flashcards`, `/lessons`,
`/lessons/[id]` (10 static paths), plus the new `/grown-ups`. No
`/(grown-ups)` segment appears in any URL.

- [ ] **Step 6: Typecheck and test**

```bash
npx tsc --noEmit && npm test
```

Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Move the existing pages behind a grown-ups door

A route group gives the seven adult pages their own layout carrying the
NavBar, so the kid path can never render it. URLs are unchanged — route
groups do not appear in the path. The old home page becomes /grown-ups;
/ gets a placeholder replaced by the star path in a later commit."
```

---

### Task 6: Shared components

The three pieces every step is built from. Writing these first is what
keeps the five step components thin.

**Files:**
- Create: `components/kid/PicTile.tsx`, `components/kid/SentenceRow.tsx`, `components/kid/StepShell.tsx`, `components/kid/usePinyinVisible.ts`, `lib/pinyinPref.ts`
- Modify: `lib/speech.ts` (add English narration)

**Interfaces:**
- Consumes: `lib/curriculum.ts` (`getWord`), `lib/pinyin.ts`, `lib/speech.ts` (`speak`), `components/PinyinText`.
- Produces: `<PicTile zh size onClick selected disabled showText />`, `<SentenceRow words blankAt />`, `<StepShell kind onContinue continueLabel canContinue>`, `usePinyinVisible()`, `speakEnglish(text)`.

- [ ] **Step 1: Add English narration to the speech library**

Append to `lib/speech.ts`:

```ts
/**
 * Speak an English instruction aloud, so the kid path is usable by a
 * child who cannot yet read. Separate from speak(), which is zh-CN.
 */
export function speakEnglish(text: string, opts?: { rate?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = opts?.rate ?? 0.95;
  const english = window.speechSynthesis
    .getVoices()
    .find((v) => /^en([-_]|$)/i.test(v.lang));
  if (english) u.voice = english;
  window.speechSynthesis.speak(u);
}
```

- [ ] **Step 2: Add the pinyin preference**

Pinyin is off by default — a six-year-old can no more read `xǐhuan` than
喜欢. This reuses `createClientStore` from Task 3 rather than a React
context: no provider to wrap two routes in, and no `setState` inside an
effect.

Create `lib/pinyinPref.ts`:

```ts
"use client";

import { createClientStore } from "./clientStore";

const KEY = "mandarin-kid-pinyin-v1";

/** Off by default: a young child reads the picture, not the spelling. */
function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

const store = createClientStore<boolean>(read, false);

export const subscribePinyin = store.subscribe;
export const getPinyinSnapshot = store.getSnapshot;
export const getPinyinServerSnapshot = store.getServerSnapshot;

export function setPinyinVisible(visible: boolean): void {
  try {
    localStorage.setItem(KEY, visible ? "1" : "0");
  } catch {
    // preference just won't persist
  }
  store.set(visible);
}
```

Create `components/kid/usePinyinVisible.ts`:

```ts
"use client";

import { useSyncExternalStore } from "react";
import {
  getPinyinServerSnapshot,
  getPinyinSnapshot,
  subscribePinyin,
} from "@/lib/pinyinPref";

export function usePinyinVisible(): boolean {
  return useSyncExternalStore(
    subscribePinyin,
    getPinyinSnapshot,
    getPinyinServerSnapshot
  );
}
```

- [ ] **Step 3: Write PicTile — the atom**

Create `components/kid/PicTile.tsx`. This is the **only** component that
renders picture + character + pinyin + audio. Every step composes it:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import PinyinText from "@/components/PinyinText";
import { getWord } from "@/lib/curriculum";
import { speak } from "@/lib/speech";
import { usePinyinVisible } from "./usePinyinVisible";

const SIZES = {
  sm: { box: "h-20 w-20", pic: 48, zh: "text-xl" },
  md: { box: "h-28 w-28", pic: 64, zh: "text-2xl" },
  lg: { box: "h-56 w-56", pic: 144, zh: "text-6xl" },
} as const;

export default function PicTile({
  zh,
  size = "md",
  onClick,
  selected = false,
  disabled = false,
  showText = true,
  speakOnClick = true,
}: {
  zh: string;
  size?: keyof typeof SIZES;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showText?: boolean;
  speakOnClick?: boolean;
}) {
  const word = getWord(zh);
  const pinyinVisible = usePinyinVisible();
  const [broken, setBroken] = useState(false);
  const s = SIZES[size];

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={word.en}
      onClick={() => {
        if (speakOnClick) speak(word.zh);
        onClick?.();
      }}
      className={`flex flex-col items-center justify-center gap-1 rounded-3xl border-4 bg-white p-2 transition active:scale-95 disabled:opacity-40 dark:bg-zinc-900 ${
        selected
          ? "border-red-500 shadow-lg"
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
      }`}
    >
      <span className={`flex ${s.box} items-center justify-center`}>
        {broken ? (
          <span style={{ fontSize: s.pic }}>{word.emoji}</span>
        ) : (
          <Image
            src={`/pics/${word.id}.svg`}
            alt=""
            width={s.pic}
            height={s.pic}
            onError={() => setBroken(true)}
            unoptimized
          />
        )}
      </span>
      {showText && (
        <>
          <span className={`${s.zh} font-semibold`} lang="zh-CN">
            {word.zh}
          </span>
          {pinyinVisible && (
            <PinyinText pinyin={word.pinyin} className="text-sm font-medium" />
          )}
        </>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Write SentenceRow**

Create `components/kid/SentenceRow.tsx`. The **only** component that
renders a sentence as a row of words:

```tsx
"use client";

import PicTile from "./PicTile";

/** A sentence as tiles. `blankAt` leaves one slot empty for SWAP. */
export default function SentenceRow({
  words,
  blankAt,
  size = "md",
}: {
  words: string[];
  blankAt?: number;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {words.map((zh, i) =>
        i === blankAt ? (
          <span
            key={`blank-${i}`}
            className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-dashed border-red-400 text-4xl text-red-400"
          >
            ?
          </span>
        ) : (
          <PicTile key={`${zh}-${i}`} zh={zh} size={size} />
        )
      )}
    </div>
  );
}
```

- [ ] **Step 5: Write StepShell**

Create `components/kid/StepShell.tsx`. The **only** component rendering
the step frame, so the five step components never rebuild this chrome:

```tsx
"use client";

import { useEffect } from "react";
import { STEP_COPY, type Step } from "@/lib/steps";
import { speakEnglish } from "@/lib/speech";

export default function StepShell({
  kind,
  children,
  onContinue,
  canContinue = true,
  continueLabel = "Next",
  narrate = true,
}: {
  kind: Step["kind"];
  children: React.ReactNode;
  onContinue: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  narrate?: boolean;
}) {
  const copy = STEP_COPY[kind];

  // Speak the instruction so a pre-reader can follow the app.
  useEffect(() => {
    if (narrate) speakEnglish(copy.text);
  }, [copy.text, narrate]);

  return (
    <div className="flex flex-1 flex-col items-center justify-between gap-6 px-4 py-6">
      <button
        type="button"
        onClick={() => speakEnglish(copy.text)}
        className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-lg font-semibold dark:bg-zinc-800"
      >
        <span aria-hidden>{copy.icon}</span>
        {copy.text}
        <span aria-hidden>🔊</span>
      </button>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
        {children}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full max-w-sm rounded-full bg-red-600 px-8 py-5 text-xl font-bold text-white transition active:scale-95 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        {continueLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Verify it compiles**

```bash
npx next build && npx tsc --noEmit && npm test && npx eslint .
```

Expected: build, typecheck and tests clean; eslint reports only the 3
pre-existing `MicPractice.tsx` errors. Any new error is a regression.

- [ ] **Step 7: Commit**

```bash
git add lib/speech.ts components/kid
git commit -m "Add the shared kid-path components

PicTile is the only component rendering picture, character, pinyin and
audio; SentenceRow the only one rendering a sentence; StepShell the only
one rendering the step frame. The five step components compose these
rather than reimplementing them. Instructions are spoken in English so a
child who cannot read can still use the app."
```

---

### Task 7: The five step components

**Files:**
- Create: `components/kid/steps/{MeetStep,MatchStep,SayStep,BuildStep,SwapStep}.tsx`

**Interfaces:**
- Consumes: `PicTile`, `SentenceRow`, `StepShell`, `lib/steps.ts` (`Step`), `lib/speech.ts`.
- Produces: each exports a default component taking `{ step, onDone }` where `onDone(result: { correct: boolean; spoken: boolean }) => void`.

Every step reports the same result shape so `LessonRunner` can tally
stars without knowing which step it ran.

- [ ] **Step 1: MeetStep**

Create `components/kid/steps/MeetStep.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import PicTile from "../PicTile";
import StepShell from "../StepShell";
import { getWord } from "@/lib/curriculum";
import { speak } from "@/lib/speech";
import type { Step } from "@/lib/steps";

export default function MeetStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "MEET" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  // Play the word once on arrival, after the English instruction.
  useEffect(() => {
    const t = setTimeout(() => speak(step.zh), 900);
    return () => clearTimeout(t);
  }, [step.zh]);

  return (
    <StepShell kind="MEET" onContinue={() => onDone({ correct: true, spoken: false })}>
      <PicTile zh={step.zh} size="lg" />
      <p className="text-2xl font-semibold text-zinc-500">{getWord(step.zh).en}</p>
    </StepShell>
  );
}
```

- [ ] **Step 2: MatchStep**

Create `components/kid/steps/MatchStep.tsx`. A wrong answer shakes and
reveals — it never blocks:

```tsx
"use client";

import { useEffect, useState } from "react";
import PicTile from "../PicTile";
import StepShell from "../StepShell";
import { speak } from "@/lib/speech";
import type { Step } from "@/lib/steps";

export default function MatchStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "MATCH" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => speak(step.answer), 900);
    return () => clearTimeout(t);
  }, [step.answer]);

  const solved = picked === step.answer;

  return (
    <StepShell
      kind="MATCH"
      canContinue={solved}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
    >
      <button
        type="button"
        onClick={() => speak(step.answer)}
        className="rounded-full bg-red-50 px-8 py-6 text-5xl dark:bg-red-950"
        aria-label="Play the word again"
      >
        🔊
      </button>

      <div className="flex flex-wrap justify-center gap-3">
        {step.choices.map((zh) => {
          const wrong = picked === zh && zh !== step.answer;
          return (
            <span key={zh} className={wrong ? "animate-pulse" : ""}>
              <PicTile
                zh={zh}
                size="md"
                showText={false}
                selected={solved && zh === step.answer}
                disabled={solved}
                speakOnClick={false}
                onClick={() => {
                  setPicked(zh);
                  speak(zh);
                  if (zh !== step.answer) setMissed(true);
                }}
              />
            </span>
          );
        })}
      </div>

      {picked && !solved && (
        <p className="text-lg font-semibold text-amber-600">Try again 🙂</p>
      )}
    </StepShell>
  );
}
```

- [ ] **Step 3: SayStep**

Create `components/kid/steps/SayStep.tsx`. Support is detected in a
**lazy initialiser, not an effect** — `components/MicPractice.tsx:53`
does the latter and eslint flags it:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import SentenceRow from "../SentenceRow";
import StepShell from "../StepShell";
import { getRecognizer, scoreMatch, speak } from "@/lib/speech";
import type { Step } from "@/lib/steps";

export default function SayStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "SAY" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  const target = step.words.join("");
  // Lazy initialiser — never setState synchronously inside an effect.
  const [supported] = useState(() => getRecognizer() !== null);
  const [listening, setListening] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const t = setTimeout(() => speak(target), 900);
    return () => {
      clearTimeout(t);
      recRef.current?.abort();
    };
  }, [target]);

  const listen = () => {
    const rec = getRecognizer();
    if (!rec) return;
    recRef.current = rec;
    setListening(true);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const heard = e.results[0]?.[0]?.transcript ?? "";
      setScore(scoreMatch(target, heard));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  };

  return (
    <StepShell
      kind="SAY"
      continueLabel={score !== null || !supported ? "Next" : "Skip"}
      onContinue={() => onDone({ correct: true, spoken: score !== null })}
    >
      <SentenceRow words={step.words} size={step.words.length > 2 ? "sm" : "lg"} />
      {step.en && <p className="text-xl text-zinc-500">{step.en}</p>}

      <button
        type="button"
        onClick={() => speak(target)}
        className="rounded-full bg-red-50 px-6 py-4 text-3xl dark:bg-red-950"
        aria-label="Hear it again"
      >
        🔊
      </button>

      {supported ? (
        <button
          type="button"
          onClick={listen}
          disabled={listening}
          className={`rounded-full px-10 py-6 text-4xl transition ${
            listening ? "animate-pulse bg-red-600" : "bg-red-100 dark:bg-red-900"
          }`}
          aria-label="Say it into the microphone"
        >
          🎤
        </button>
      ) : (
        // Recognition is Chrome/Edge-only and needs internet. The child
        // must never hit a wall because of their browser.
        <p className="max-w-xs text-center text-lg text-zinc-500">
          Say it out loud, then tap Next.
        </p>
      )}

      {score !== null && (
        <p className="text-2xl font-bold">
          {score >= 60 ? `🎉 ${score}%` : `🙂 Nearly — ${score}%`}
        </p>
      )}
    </StepShell>
  );
}
```

- [ ] **Step 4: BuildStep**

Create `components/kid/steps/BuildStep.tsx`. Tap-to-place, not drag —
far more forgiving on a tablet:

```tsx
"use client";

import { useState } from "react";
import PicTile from "../PicTile";
import StepShell from "../StepShell";
import { speak } from "@/lib/speech";
import type { Step } from "@/lib/steps";

/** Deterministic shuffle: reverse. Keeps the component pure and testable. */
const scramble = (words: string[]) => [...words].reverse();

export default function BuildStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "BUILD" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [missed, setMissed] = useState(false);
  const tray = scramble(step.answer);

  const solved = placed.length === step.answer.length;
  const usedCount = (zh: string) => placed.filter((p) => p === zh).length;

  const place = (zh: string) => {
    const next = [...placed, zh];
    if (zh !== step.answer[placed.length]) {
      setMissed(true);
      speak(zh);
      return; // wrong slot — the tile simply doesn't stick
    }
    setPlaced(next);
    speak(next.join(""));
  };

  return (
    <StepShell
      kind="BUILD"
      canContinue={solved}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
    >
      <div className="flex min-h-32 flex-wrap items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        {placed.length === 0 ? (
          <span className="text-lg text-zinc-400">Tap the pictures in order</span>
        ) : (
          placed.map((zh, i) => <PicTile key={`${zh}-${i}`} zh={zh} size="sm" />)
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {tray.map((zh, i) => (
          <PicTile
            key={`${zh}-${i}`}
            zh={zh}
            size="md"
            disabled={usedCount(zh) > tray.filter((t) => t === zh).length - 1}
            speakOnClick={false}
            onClick={() => place(zh)}
          />
        ))}
      </div>

      {solved && step.en && (
        <p className="text-2xl font-bold text-green-600">🎉 {step.en}</p>
      )}
    </StepShell>
  );
}
```

- [ ] **Step 5: SwapStep**

Create `components/kid/steps/SwapStep.tsx`:

```tsx
"use client";

import { useState } from "react";
import PicTile from "../PicTile";
import SentenceRow from "../SentenceRow";
import StepShell from "../StepShell";
import { speak } from "@/lib/speech";
import type { Step } from "@/lib/steps";

export default function SwapStep({
  step,
  onDone,
}: {
  step: Extract<Step, { kind: "SWAP" }>;
  onDone: (r: { correct: boolean; spoken: boolean }) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const solved = picked === step.answer;

  return (
    <StepShell
      kind="SWAP"
      canContinue={solved}
      onContinue={() => onDone({ correct: !missed, spoken: false })}
    >
      <SentenceRow
        words={step.sentence}
        blankAt={solved ? undefined : step.blankAt}
      />

      <div className="flex flex-wrap justify-center gap-3">
        {step.choices.map((zh) => (
          <PicTile
            key={zh}
            zh={zh}
            size="md"
            disabled={solved}
            selected={solved && zh === step.answer}
            speakOnClick={false}
            onClick={() => {
              setPicked(zh);
              if (zh === step.answer) {
                speak(step.sentence.join(""));
              } else {
                setMissed(true);
                speak(zh);
              }
            }}
          />
        ))}
      </div>

      {solved ? (
        <p className="text-2xl font-bold text-green-600">🎉 {step.en}</p>
      ) : (
        picked && <p className="text-lg font-semibold text-amber-600">Try again 🙂</p>
      )}
    </StepShell>
  );
}
```

- [ ] **Step 6: Verify**

```bash
npx next build && npx tsc --noEmit && npm test && npx eslint .
```

Expected: build, typecheck and tests clean; eslint reports only the 3
pre-existing `MicPractice.tsx` errors. Any new error is a regression.

- [ ] **Step 7: Commit**

```bash
git add components/kid/steps
git commit -m "Add the five kid-path step components

Each renders inside StepShell and reports the same result shape, so the
runner can tally stars without knowing which step ran. BUILD uses
tap-to-place rather than drag, which is far more forgiving on a tablet.
SAY detects recogniser support in a lazy initialiser and degrades to
listen-and-repeat where speech recognition is unavailable, so a browser
without it never blocks a child."
```

---

### Task 8: LessonRunner

**Files:**
- Create: `components/kid/LessonRunner.tsx`, `app/learn/[id]/page.tsx`

**Interfaces:**
- Consumes: all five step components, `lib/steps.ts` (`buildSteps`), `lib/progress.ts`, `lib/curriculum.ts`.
- Produces: `<LessonRunner lessonId />`, route `/learn/[id]`.

- [ ] **Step 1: Write the runner**

Create `components/kid/LessonRunner.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BuildStep from "./steps/BuildStep";
import MatchStep from "./steps/MatchStep";
import MeetStep from "./steps/MeetStep";
import SayStep from "./steps/SayStep";
import SwapStep from "./steps/SwapStep";
import { LESSONS, lessonIndex } from "@/lib/curriculum";
import { buildSteps } from "@/lib/steps";
import {
  awardStars,
  completeLesson,
  getProgressSnapshot,
  saveProgress,
} from "@/lib/progress";

export default function LessonRunner({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const steps = useMemo(() => buildSteps(lessonId), [lessonId]);
  const [index, setIndex] = useState(0);
  const [cleanMatches, setCleanMatches] = useState(true);
  const [allSpoken, setAllSpoken] = useState(true);
  const [stars, setStars] = useState<number | null>(null);

  const lesson = LESSONS[lessonIndex(lessonId)];
  const next = LESSONS[lessonIndex(lessonId) + 1];

  const onDone = (r: { correct: boolean; spoken: boolean }) => {
    const step = steps[index];
    if (!r.correct) setCleanMatches(false);
    if (step.kind === "SAY" && !r.spoken) setAllSpoken(false);

    if (index + 1 < steps.length) {
      setIndex(index + 1);
      return;
    }
    const earned = awardStars({
      cleanMatches: r.correct && cleanMatches,
      allSpoken: (step.kind !== "SAY" || r.spoken) && allSpoken,
    });
    saveProgress(completeLesson(getProgressSnapshot(), lessonId, earned));
    setStars(earned);
  };

  if (stars !== null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 text-center">
        <p className="text-6xl">🎉</p>
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <p className="text-5xl" aria-label={`${stars} out of 3 stars`}>
          {"⭐".repeat(stars)}
          <span className="opacity-20">{"⭐".repeat(3 - stars)}</span>
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          {next && (
            <Link
              href={`/learn/${next.id}`}
              className="rounded-full bg-red-600 px-8 py-5 text-xl font-bold text-white"
            >
              Keep going →
            </Link>
          )}
          <Link href="/" className="rounded-full border-4 border-zinc-200 px-8 py-4 text-lg font-semibold dark:border-zinc-700">
            Back to the map
          </Link>
        </div>
      </div>
    );
  }

  const step = steps[index];
  const progress = Math.round((index / steps.length) * 100);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Close the lesson"
          className="text-2xl text-zinc-400"
        >
          ✕
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* key={index} resets each step's internal state on advance. */}
      {step.kind === "MEET" && <MeetStep key={index} step={step} onDone={onDone} />}
      {step.kind === "MATCH" && <MatchStep key={index} step={step} onDone={onDone} />}
      {step.kind === "SAY" && <SayStep key={index} step={step} onDone={onDone} />}
      {step.kind === "BUILD" && <BuildStep key={index} step={step} onDone={onDone} />}
      {step.kind === "SWAP" && <SwapStep key={index} step={step} onDone={onDone} />}
    </div>
  );
}
```

- [ ] **Step 2: Write the route**

Create `app/learn/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import LessonRunner from "@/components/kid/LessonRunner";
import { LESSONS, lessonIndex } from "@/lib/curriculum";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }));
}

export default async function LearnPage({ params }: PageProps<"/learn/[id]">) {
  const { id } = await params;
  if (lessonIndex(id) < 0) notFound();
  return <LessonRunner lessonId={id} />;
}
```

- [ ] **Step 3: Verify the build produces all ten lessons**

```bash
npx next build
```

Expected: `/learn/[id]` with 10 static paths.

- [ ] **Step 4: Play lesson 1 by hand**

```bash
npm run dev
```

Open `http://localhost:3000/learn/hello` and complete it. Confirm:
the instruction is spoken in English; 你 plays automatically; a wrong
`MATCH` shakes rather than blocking; `BUILD` accepts 你 then 好; the
lesson ends on the star screen; reloading `/` shows lesson 2 reachable.

- [ ] **Step 5: Commit**

```bash
git add components/kid/LessonRunner.tsx app/learn
git commit -m "Add the lesson runner

Walks the generated step list one screen at a time behind a progress bar,
tallies stars, and writes progress on completion. Each step is keyed by
index so its internal state resets on advance."
```

---

### Task 9: Star path and parent settings

**Files:**
- Create: `components/kid/StarPath.tsx`, `components/kid/ParentSettings.tsx`
- Modify: `app/page.tsx` (replace the Task 5 placeholder)

**Interfaces:**
- Consumes: `lib/progress.ts`, `lib/pinyinPref.ts`, `lib/curriculum.ts`, `PicTile`, `usePinyinVisible`.

- [ ] **Step 1: Write ParentSettings**

Create `components/kid/ParentSettings.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { PROGRESS_KEY, reloadProgress } from "@/lib/progress";
import { setPinyinVisible } from "@/lib/pinyinPref";
import { usePinyinVisible } from "./usePinyinVisible";

export default function ParentSettings() {
  const [open, setOpen] = useState(false);
  const visible = usePinyinVisible();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Settings for grown-ups"
        className="fixed bottom-4 right-4 rounded-full bg-white/90 p-3 text-xl shadow-lg dark:bg-zinc-800/90"
      >
        ⚙️
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-zinc-900">
            <h2 className="text-xl font-bold">For grown-ups</h2>

            <label className="mt-4 flex items-center justify-between gap-4">
              <span>
                Show pinyin
                <span className="block text-sm text-zinc-500">
                  Off by default — young children read the picture, not the spelling.
                </span>
              </span>
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setPinyinVisible(e.target.checked)}
                className="h-6 w-6"
              />
            </label>

            <Link
              href="/grown-ups"
              className="mt-4 block rounded-2xl bg-zinc-100 px-4 py-3 text-center font-semibold dark:bg-zinc-800"
            >
              Tones, dictionary, writing &amp; more →
            </Link>

            <button
              type="button"
              onClick={() => {
                if (!confirm("Erase all stars and start over?")) return;
                localStorage.removeItem(PROGRESS_KEY);
                reloadProgress(); // drop the cached snapshot; the map re-renders
                setOpen(false);
              }}
              className="mt-3 w-full rounded-2xl px-4 py-3 text-sm text-red-600"
            >
              Reset progress
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded-2xl bg-red-600 px-4 py-3 font-bold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Write StarPath**

Create `components/kid/StarPath.tsx`:

```tsx
"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import PicTile from "./PicTile";
import ParentSettings from "./ParentSettings";
import { LESSONS } from "@/lib/curriculum";
import {
  currentLessonId,
  getProgressServerSnapshot,
  getProgressSnapshot,
  isUnlocked,
  starsFor,
  subscribeProgress,
} from "@/lib/progress";

export default function StarPath() {
  // Progress lives in localStorage. useSyncExternalStore reads it without
  // calling setState inside an effect (see MicPractice.tsx:53) and serves
  // server renders a neutral snapshot, so hydration matches.
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getProgressServerSnapshot
  );

  const current = currentLessonId(progress);
  const currentLesson = LESSONS.find((l) => l.id === current)!;
  const done = Object.keys(progress.completed).length;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Link
        href={`/learn/${current}`}
        className="flex items-center gap-4 rounded-3xl bg-red-600 p-5 text-white shadow-lg"
      >
        <span className="text-5xl" aria-hidden>
          {done === LESSONS.length ? "🔁" : "▶️"}
        </span>
        <span>
          <span className="block text-sm opacity-80">
            {done === LESSONS.length ? "Play again" : "Keep going"}
          </span>
          <span className="block text-2xl font-bold">{currentLesson.title}</span>
        </span>
      </Link>

      <ol className="mt-6 space-y-3">
        {LESSONS.map((lesson, i) => {
          const unlocked = isUnlocked(progress, lesson.id);
          const stars = starsFor(progress, lesson.id);
          const row = (
            <span className="flex w-full items-center gap-4 rounded-3xl border-4 border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
              <PicTile zh={lesson.icon} size="sm" showText={false} speakOnClick={false} />
              <span className="flex-1 text-left">
                <span className="block text-lg font-bold">{lesson.title}</span>
                <span className="text-lg" aria-label={`${stars} of 3 stars`}>
                  {"⭐".repeat(stars)}
                  <span className="opacity-20">{"⭐".repeat(3 - stars)}</span>
                </span>
              </span>
              {!unlocked && <span className="pr-2 text-2xl opacity-40" aria-hidden>🔒</span>}
            </span>
          );
          return (
            <li key={lesson.id}>
              {unlocked ? (
                <Link href={`/learn/${lesson.id}`} className="block">
                  {row}
                </Link>
              ) : (
                <span className="block opacity-50" aria-disabled>
                  {row}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <ParentSettings />
    </main>
  );
}
```

- [ ] **Step 3: Replace the placeholder home**

Replace `app/page.tsx` entirely:

```tsx
import StarPath from "@/components/kid/StarPath";

export default function Home() {
  return <StarPath />;
}
```

- [ ] **Step 4: Verify by hand**

```bash
npm run dev
```

At `http://localhost:3000`: lesson 1 is tappable, lessons 2–10 show 🔒.
Complete lesson 1 — lesson 2 unlocks and "Keep going" moves to it. The
⚙️ button toggles pinyin and reveals the grown-ups link.

- [ ] **Step 5: Verify the build**

```bash
npx next build && npx tsc --noEmit && npm test && npx eslint .
```

Expected: build, typecheck and tests clean; eslint reports only the 3
pre-existing `MicPractice.tsx` errors. Any new error is a regression.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/kid/StarPath.tsx components/kid/ParentSettings.tsx
git commit -m "Add the star path home and parent settings

The home page becomes a single Keep going card over a map of ten
lessons, locked in order. Settings behind a corner button hold the pinyin
toggle (off by default), the reset, and the door to the grown-up pages."
```

---

### Task 10: Attribution and README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the kid path and credit OpenMoji**

Replace the opening description in `README.md` with:

```markdown
# 你好 Mandarin — Beginners Mandarin

Two ways in:

- **The kids' path** (`/`) — a guided route for a child aged 5–11. Ten
  lessons carry one pictured word forward into a spoken sentence. Every
  instruction is spoken aloud, so a child who cannot read yet can still
  use it. Pinyin is off by default.
- **The grown-up section** (`/grown-ups`) — the full toolkit: tone
  trainer, ten written lessons, a 120,000-entry talking dictionary,
  microphone practice, stroke and radical reference, character writing,
  and spaced-repetition flashcards.
```

Add to the Credits section:

```markdown
- Pictures: [OpenMoji](https://openmoji.org/) (CC BY-SA 4.0) — vendored
  into `public/pics/` by `npm run pics`. Six pictures are original work.
```

Add under "How it's built":

```markdown
- `lib/curriculum.ts` — the single source of truth for the kids' path.
  Sentences are arrays of word references, so `lib/steps.ts` can derive
  every exercise and a test can prove no sentence uses an untaught word.
- `npm test` — Vitest. Run `npm run pics` after adding a word.
```

- [ ] **Step 2: Final verification**

```bash
npm run pics && npx next build && npx tsc --noEmit && npm test
```

Expected: pictures vendored, build clean, typecheck clean, all suites pass.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Document the kids' path and credit OpenMoji"
```

---

## After the plan

Put lessons 1–3 in front of the child before trusting the rest. The step
engine is generic, so three lessons exercise every step type; the other
seven are only data. Discovering that `SWAP` confuses a five-year-old is
cheap now and expensive later.

Watch for: whether the child understands that a blank slot wants a word;
whether tap-to-place reads as tappable; whether the spoken English
instruction is heard or talked over; and whether three tiles is too many
choices for a `MATCH`.
