# Kid Learning Path — Design

**Date:** 2026-08-20
**Status:** Approved for planning
**Repo:** Beginners-Mandarin

## Problem

The app teaches good material but presents it as seven equal doors
(`components/NavBar.tsx`) with no sequence, no progress, and no
enforcement of order. A beginner must self-direct, which is the one
thing a beginner cannot do.

Three specific failures:

1. **No path.** The home page numbers five features 1–5, but nothing
   makes the child follow them. `NavBar` lists eight destinations as
   peers.
2. **No progress model.** The only persisted state in the app is the
   Leitner box store in `app/flashcards/page.tsx`. Nothing knows which
   lesson the learner finished, so nothing can offer "continue".
3. **No word-to-sentence bridge.** `lib/lessons.ts` stores sentences as
   flat strings (`zh: "我喝茶。"`). Nothing links a sentence to the words
   that compose it, so a build-up exercise is impossible to express.

Two further problems make the app unsuitable for a child:

- **Lessons are documents.** `app/lessons/[id]/page.tsx` renders every
  word, the grammar note, every sentence, and the mic practice on one
  scrolling page. Lesson 3 introduces eleven words at once.
- **"Pictures" is one emoji per word** (`components/WordCard.tsx`).
  Several teach nothing: 一 is `1️⃣` (the digit the child already knows),
  and 多 and 书 are both `📚`.

## Audience

A child aged roughly 5–11 with no Mandarin exposure.

Two constraints follow, and they govern every decision below:

- **Operable without reading English.** A five-year-old cannot read
  instructions. Every instruction is an icon plus a spoken English
  cue.
- **Not babyish at the top of the range.** An eleven-year-old must not
  feel patronised. Clean and generous, not cartoonish.

Pinyin is **off by default**. A six-year-old can no more read `xǐhuan`
than 喜欢, and pinyin's `q`/`x`/`zh`/`ü` actively mislead an English
reader. Tone colours stay everywhere, because colour works for a
non-reader.

This mirrors how Chinese children actually acquire literacy: years of
oral Mandarin first, no reading instruction in kindergarten at all
(picture books, songs, activities), then Pinyin in isolation at the
start of Grade 1, then characters, then texts. Sound and picture come
first; the written form follows.

## Scope

The kid path becomes the app. Nothing is deleted.

| Route | Change |
|---|---|
| `/` | **Replaced** — becomes the star path |
| `/learn/[id]` | **New** — the lesson runner |
| `/grown-ups` | **New** — today's home page, all seven feature cards |
| `/tones` `/dictionary` `/practice` `/strokes` `/characters` `/flashcards` `/lessons` | Unchanged, reached from `/grown-ups` |

`lib/vocab.ts` and `lib/lessons.ts` are **not modified**. The grown-up
section keeps working exactly as it does today. The kid path gets its
own curriculum in a new file.

`NavBar` is not rendered on the kid path at all. The runner shows only
a progress bar and a close button. A small "For grown-ups →" link in
the footer is the door to everything already built.

## Data model

New file `lib/curriculum.ts`.

```ts
export interface Word {
  zh: string;      // 茶
  pinyin: string;  // "cha2" — numbered, same convention as lib/vocab.ts
  en: string;      // "tea"
  pic: string;     // "cha.svg" in /public/pics
  emoji: string;   // fallback if the file is missing
}

export interface Sentence {
  words: string[]; // ["我","喝","茶"] — refs into WORDS, never a flat string
  en: string;
}

export interface KidLesson {
  id: string;
  number: number;
  title: string;      // English — for the parent, not the child
  pic: string;
  newWords: string[]; // 1–3 refs, introduced in this order
  build: Sentence;    // the sentence the ladder assembles
  swaps: Sentence[];  // same shape, one tile changed
}
```

`build` and `swaps` holding **refs rather than strings** is the whole
design. The tiles, audio, pictures, and drop targets all fall out of
it, because a tile *is* a `Word` and already knows its own picture and
sound.

### The guardrail

A test asserts that every ref in every `build` and `swaps` is either a
`newWord` of that lesson or was introduced in an earlier one. Violating
it fails the suite.

This makes "the child never meets an unexplained word" a property of
the codebase rather than an intention. The current `lib/lessons.ts`
silently breaks it: lesson 3 uses 本 and 个, lesson 4 uses 这, and
lesson 10 uses 很 — none of which appear in `VOCAB`.

## Curriculum

Ten lessons, 24 core words. Sentences are given in the order the ladder
assembles them.

| # | Lesson | New words | Builds | Swaps to |
|---|---|---|---|---|
| 1 | Hello | 你 好 我 | 你好 | — |
| 2 | I am | 是 学生 老师 | 我是学生 | 我是老师 · 你是老师 |
| 3 | I like | 喜欢 猫 狗 | 我喜欢猫 | 我喜欢狗 · 你喜欢猫 |
| 4 | I drink | 喝 水 茶 | 我喝茶 | 我喝水 |
| 5 | I eat | 吃 米饭 苹果 | 我吃苹果 | 我吃米饭 |
| 6 | **Asking** | 吗 | 你喜欢猫吗？ | 你喝茶吗？ · 你是学生吗？ |
| 7 | **He & she** | 他 她 | 她是老师。 | 他喜欢狗。 · 他吃苹果。 |
| 8 | Big & small | 大 小 | 大猫 | 小狗 · 小猫 |
| 9 | **Saying no** | 不 | 我不喜欢猫。 | 他不是老师。 · 我不吃苹果。 |
| 10 | Going | 去 学校 家 | 我去学校。 | 他去学校。 · 我不去学校。 · 你去学校吗？ |

Lessons 6, 7, and 9 are the point of the design. Each teaches one or
two words and multiplies every sentence the child already owns: 吗
turns any statement into a question, 他/她 swaps the subject on all of
them, 不 negates all of them. Lesson 10 recombines both 吗 and 不.

Twenty-four words generate well over a hundred grammatical sentences.
That is the answer to "moving forward from a single word to sentences" —
the compounding is the curriculum.

Non-composable phrases (谢谢, 再见) are taught as whole units with a
picture and a microphone step. They do not enter the ladder, because
there is nothing to build them from.

### Deliberately excluded

- **Counting.** 一二三 cannot produce a sentence, because a counted noun
  in Mandarin requires a measure word — 三猫 is ungrammatical, it must
  be 三只猫. Teaching measure words defeats the goal. Counting becomes
  a bonus lesson outside the ladder that does not gate progress.
- **Grammar prose.** The `grammar` blocks in `lib/lessons.ts` have no
  equivalent here. Substitution drills teach the pattern; a child does
  not need it named.
- **回家 vs 去家.** 我去家 is unnatural. 家 is taught as a noun and used
  in the phrase 我家 ("my home"), never as the object of 去.

## Step engine

Five step types. Everything the child does is one of these.

| Step | Screen | Icon |
|---|---|---|
| `MEET` | Big picture, character below, audio auto-plays, tap to replay | 👂 |
| `MATCH` | Hears a word, taps the right picture out of three | 👆 |
| `SAY` | Picture + character, microphone to repeat | 🎤 |
| `BUILD` | Picture-tiles below an empty row, tapped into order | 🧩 |
| `SWAP` | The built sentence with one tile blank, pick its replacement | 🔄 |

### Generation

`buildSteps(lesson: KidLesson, words: WordIndex): Step[]` is a **pure
function**. A lesson goes in, an ordered step list comes out:

1. For each `newWord`, in order: `MEET`, then `SAY`.
2. After every second new word, a `MATCH` over the words met so far.
   Distractors are drawn from words the child already knows — earlier
   lessons first, falling back to other words met within this lesson
   when there is no earlier material (lesson 1). A lesson introducing
   fewer than two new words (6 and 9) emits no `MATCH`; its recall
   pressure comes from the `SWAP` steps, which is the point of those
   lessons.
3. `BUILD`, laddered incrementally: one step per prefix of length 2
   through N. For 我喝茶 (N=3) that is 我喝, then 我喝茶. For 你好 (N=2)
   it is a single step. A one-tile prefix is never a `BUILD`, because
   assembling a sentence from one tile is not an assembly.
4. One `SWAP` per entry in `swaps`.
5. A final `SAY` of the complete `build` sentence.

Adding lesson 11 is a data edit; the ladder assembles itself.

### Interaction rules

- **Tap-to-place, not drag.** Tapping a tile sends it to the next empty
  slot; tapping it again pulls it back. Far more forgiving for small
  hands on a tablet than HTML5 drag-and-drop, and it avoids touch-event
  problems entirely.
- **Nothing punishes.** A wrong `MATCH` shakes gently, highlights the
  correct answer, and allows a retry. No hearts, no timers, no failure
  state, no streaks.
- **Stars cannot be lost.** One star for finishing a lesson, plus one
  for all `MATCH` steps correct first try, plus one for completing every
  `SAY` step. Awarded at the end; never deducted.
- **`SAY` never blocks.** Speech recognition is Chrome/Edge-only and
  needs internet — a hard problem for the portable USB build. When
  unavailable, `SAY` degrades to "listen, say it out loud, tap the green
  check when you have said it." The child never hits a wall because of
  a browser.

Note: `components/MicPractice.tsx:53` currently calls `setState`
synchronously inside a `useEffect` body to detect recognizer support,
which `react-hooks/set-state-in-effect` flags as an error. `SayStep`
must not copy this pattern; support detection belongs in lazy state
initialisation.

## Progress

New file `lib/progress.ts`. localStorage key `mandarin-kid-v1`,
deliberately separate from the existing `mandarin-srs-v1` so the
grown-up flashcards keep their history.

```ts
interface Progress {
  completed: Record<string, { stars: number; at: number }>;
  current: string; // lessonId — what the "Keep going" button resolves to
}
```

Corrupt or absent storage resolves `current` to lesson 1 rather than
throwing. Lessons unlock strictly in order; `StarPath` shows every
lesson, with locked ones dimmed and untappable so the child can see
what is ahead.

When lesson 10 is complete, `current` stays on lesson 10 and the
"Keep going" card becomes a "Play again" card that lets the child
re-enter any finished lesson. There is no dead end and no empty state.

## Pictures

An illustration set bundled locally, in one consistent style, working
fully offline.

**Source:** the `openmoji` npm package (v15.1.0) — ~4,000 hand-drawn
SVG icons under CC BY-SA 4.0, the same licence family as the CC-CEDICT
data already shipped. Bundled locally it renders identically on every
OS, unlike system emoji.

**Pipeline:** `scripts/fetch-pics.mjs` reads the curriculum, resolves
each word's `pic` field, copies only those SVGs out of the package into
`public/pics/`, and fails loudly if a word has no picture. The
`openmoji` dependency is dev-only.

The path needs **26 pictures** — 24 core words plus 谢谢 and 再见. Of
these, roughly **16 come from OpenMoji** and **10 are hand-authored**
(below). A `PicTile` with a missing file falls back to the word's
emoji, so a broken asset degrades rather than crashes.

**Hand-authored (~10):** the words no emoji set expresses.

- 我 / 你 / 他 / 她 — must be visually *contrastive*, not merely
  correct. 🙋 and 👉 do not read as "me" versus "you" to a six-year-old.
  Drawn as a consistent set: a figure pointing at itself versus a
  figure pointing outward.
- 喜欢 — a heart above a smiling face.
- 吗 — a speech bubble with a question mark.
- 去 — a figure walking toward an arrow.
- 大 / 小 — the same object at two sizes, side by side, so the contrast
  is the picture.
- 吃 — an open mouth with food (😋 reads as "tasty", not "to eat").

These are original drawings, not modifications of OpenMoji artwork, so
CC BY-SA share-alike does not extend to them.

**Attribution:** one line in the README and the `/grown-ups` footer —
"Emoji artwork by OpenMoji, CC BY-SA 4.0" — alongside the existing
CC-CEDICT and Hanzi Writer credits.

## Components

**New:**

- `PicTile` — picture, character, optional pinyin, tap-to-speak. The
  atom the entire kid path is made of.
- `LessonRunner` — holds the step index, renders the current step,
  owns the Continue button and progress bar.
- `MeetStep` `MatchStep` `SayStep` `BuildStep` `SwapStep`
- `StarPath` — the map on `/`.
- `ParentSettings` — pinyin toggle, voice picker, reset progress.

**Reused:** `lib/speech.ts`, `lib/pinyin.ts`, `PinyinText`,
`SpeakButton`, `VoicePicker` (moves into `ParentSettings`).

`lib/speech.ts` needs an `en-US` path alongside its `zh-CN` one, so
instructions can be spoken aloud.

`components/MicPractice.tsx` is **not** reused. At 260 lines it carries
adult-facing UI a child should not see; `SayStep` is written lean.

## Testing

Vitest is installed and verified (v4.1.11, `vitest.config.mts`,
`npm test`). It is a devDependency only and does not touch the portable
build. `lib/__tests__/pinyin.test.ts` covers `lib/pinyin.ts` with nine
passing tests.

Four suites to write, all pure functions over data — which is why the
schema above was worth the rewrite:

1. **Curriculum guardrail** — every ref in every `build` and `swaps`
   resolves to a word taught in this lesson or earlier.
2. **`buildSteps`** — a word is always `MEET`-ed before appearing in a
   `BUILD`; `BUILD` ladders incrementally; `SWAP` changes exactly one
   tile; `MATCH` distractors are always known words.
3. **`lib/progress.ts`** — `current` resolves to lesson 1 on a fresh
   install, advances on completion, survives corrupt localStorage,
   never returns a locked lesson.
4. **Picture coverage** — every word has a `pic` that exists on disk.

Note: `npx tsc --noEmit` fails on a clean checkout because
`LayoutProps` and `PageProps` are Next 16 globals generated into
`.next/types/`. Typecheck must run *after* a build.

### What cannot be tested

Whether a five-year-old understands a `SWAP` screen. That needs ten
minutes with a real child.

**Build lessons 1–3 end-to-end first and put them in front of the
child before building the other seven.** The step engine is generic, so
three lessons exercise every step type; the remaining seven are data.
Discovering that `SWAP` confuses the child is cheap after three lessons
and expensive after ten.

## Out of scope

- User accounts and cross-device sync.
- Audio recording playback comparison.
- Handwriting practice in the kid path (`/characters` remains available
  in the grown-up section).
- Any change to `lib/vocab.ts`, `lib/lessons.ts`, or the seven existing
  feature pages beyond adding the `/grown-ups` shell around them.
- Neural TTS. The kid path uses the same OS voices as today.
