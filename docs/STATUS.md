# Where this project is

**Last updated:** 2026-08-20 (late evening)
**Branch:** `spanish-kid-path` — adds American Spanish to the kid path
behind a language chooser. PR #1 (kid learning path), PR #2 (hear-first
speaking flow), and PR #3 (da/xiao pictures) are merged on `master`.

Read this first when picking the work back up. The spec and plan below
say what was *intended*; this file says what actually happened and what
is left.

## Pick up on a new machine

```bash
git clone https://github.com/lgorby/Beginners-Mandarin.git
cd Beginners-Mandarin
npm ci
npm run dev            # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Vitest, 80 tests across 7 suites |
| `npm run pics` | Re-vendor OpenMoji SVGs — run after adding a word |
| `npx next build` | Production build |
| `npx tsc --noEmit` | Typecheck — **must run after a build**, see gotchas |
| `npx eslint .` | Lint — clean |

## The kid path speaks two languages (2026-08-20)

The kid path now teaches **Mandarin or American (Latin American) Spanish**,
chosen with flag chips on the front door and in the ⚙️ grown-up settings.
How it is built (DRY/SSOT — one engine, N courses):

- `lib/languages.ts` — everything that varies by language except content:
  BCP-47 tags for TTS/recognition (`es-MX`), how word tiles join into a
  sentence (Mandarin runs together, Spanish takes spaces), and question
  intonation (Spanish asks by tone alone, so spoken questions are wrapped
  ¿…?; questionness is derived from the English gloss ending in "?").
- `lib/courses/zh.ts` / `lib/courses/es.ts` — data only. `lib/curriculum.ts`
  stamps each course with its language and merges them; word text is the
  WORDS key (hanzi and Latin script cannot collide — a test guards it).
  `lib/steps.ts` needed only a per-language lookup change; the step engine,
  step components, and every curriculum guardrail test run over both
  courses unchanged.
- The Spanish course respects conjugation: verbs are taught in the person
  the sentences use (bebo/como/quiero/voy), subjects are never swapped out
  from under a conjugated verb, and the multipliers are *quieres* (offer by
  intonation), *él/ella + es*, and *no*. Adjectives come after the noun
  ("un gato grande") and the BUILD ladder teaches that order.
- Progress: one store, per-language paths — lesson ids are globally unique
  so `mandarin-kid-v1` needed no migration; each language has its own
  stars, unlocks, and "keep going" card. `kid-lang-v1` holds the choice,
  and opening a lesson pulls the path into that lesson's language.
- Speech: `lib/kidSpeech.ts` is the kid path's only way to speak content
  (word → its language's voice). `/api/score` (pinyin+tones) stays
  Mandarin-only; Spanish SAY steps score on the normalized transcript
  (case/accents/¿? stripped), and pinyin/gentle-tones settings hide when
  Spanish is active. The grown-up toolkit remains Mandarin-only on purpose.
- Pictures: Spanish reuses the six hand-drawn SVGs via a new
  `art: { from: "copy", of }` form in `scripts/fetch-pics.mjs`; the rest
  vendor from OpenMoji under Spanish ids. `npm run pics` covers both.

## What exists now

The app has two ways in, from a front door at `/`:

| Route | What |
|---|---|
| `/` | Front door — two doors, weighted toward the child |
| `/learn` | Star path — ten lessons, locked in order |
| `/learn/[id]` | Lesson runner — one exercise per screen |
| `/grown-ups` | The original home page |
| `/mic-test` | Diagnostics: mic level meter, room-noise check, recognition event log |
| `/api/score` | Pronunciation scoring (pinyin + tones) via CC-CEDICT |
| `/tones` `/lessons` `/dictionary` `/practice` `/strokes` `/characters` `/flashcards` | Unchanged from before this work |

## Verified by real use (Edge on Windows, 2026-08-20)

The speaking exercises were hand-tested end to end and rebuilt where
they failed. What stands now:

- **Recognition works on Edge.** Two Edge quirks are worked around in
  `lib/speech.ts`: the final transcript is often empty (text only
  arrives via interim results), and a reused recognizer instance can
  wedge (start() accepted, no events — every attempt gets a fresh
  instance). Both were diagnosed with `/mic-test`'s event log.
- **Scoring is by sound, not spelling.** `/api/score` looks up pinyin
  for any transcript in CC-CEDICT and scores syllables 70% / tones 30%,
  so a homophone transcript of a correct pronunciation is not a failure.
  Character match remains a floor. Per-syllable chips (green/amber/gray)
  plus a percentage show exactly how close an attempt was.
- **Strictness is age-aware.** "Gentle tones" (all-sounds-right counts
  as the win) is ON by default for the kid path, OFF for the grown-up
  practice; each has its own toggle and localStorage key (`lib/tonePref.ts`).
- **The app speaks first.** SAY steps play the word, then open the mic
  hands-free (ding + status + soundwave driven by real recognizer
  events; auto-open only when mic permission is already granted, once
  per step, disarmed by any manual tap). BUILD steps speak the sentence
  to assemble, with a replay button. SWAP stays silent on purpose — the
  sentence would announce the answer.
- **Pictures**: `chi.svg`, `da.svg`, `xiao.svg` were redrawn after the
  originals confused a real user (chi read as shouting; da/xiao relied
  on an orange highlight). Each picture now carries its meaning alone.

## Not verified — do this first

**Speak the Spanish path on a real machine.** Tests, build, lint, and an
SSR smoke test all pass, but nobody has yet heard the es-MX voice choice,
watched `es-MX` recognition score a child's "yo bebo té", or confirmed the
¿…? wrap actually raises the TTS intonation. `/learn/hola` end-to-end in
Edge is the first thing to do — the same hand-verification the Mandarin
speaking flow got on 2026-08-20. Also check a machine with no Spanish voice
installed: speak() falls back to the browser default voice, which may
sound wrong enough to need a "no Spanish voice" notice like the mic one.

**Put lessons 1–3 in front of an actual child.** Everything above was
verified by an adult. Still untested with a child: whether the spoken
English instruction helps or talks over the Chinese, whether the
hands-free mic timing suits a child's response speed, whether a dashed
blank slot reads as "put a word here", and whether three choices is too
many for a MATCH. The step engine is generic, so three lessons exercise
every step type; the rest is data. Lesson 6 (`Asking`) is the one to
watch — it teaches a single word and is the mechanic the whole design
rests on.

## Open items

**The lint debt is paid.** The two long-standing
`react-hooks/set-state-in-effect` errors are fixed: the dictionary
clears results in the input's change handler, and the flashcards' SRS
moved to `lib/srs.ts` — pure, tested functions (`lib/__tests__/srs.test.ts`)
plus a `useSyncExternalStore` session store, per the STATUS instruction
to write tests before touching it. One deliberate behaviour change:
the review queue now genuinely puts due cards before new ones (the old
code documented that order but never sorted).

**Counting is not taught.** Deliberate — a counted noun needs a measure
word (三只猫, not 三猫), which is exactly the complexity this path
removes. If it should come back, it needs its own design.

**Picture strategy is settled: illustrations, not stock photos.**
Considered and rejected 2026-08-20 — photos cannot depict the abstract
words (不, 是, 吗), break style consistency, and add licensing/privacy
concerns in a public repo. If a specific word fails the child test,
redraw that one picture.

## Gotchas

- **`tsc --noEmit` fails on a clean checkout.** `LayoutProps` and
  `PageProps` are Next 16 globals generated into `.next/types/`. Run
  `npx next build` first (or exclude `.next` via a temp tsconfig).
- **The React compiler lint forbids more than setState-in-effect.**
  Components may not mutate module-level variables, call impure
  functions (`performance.now`), or assign properties on objects held
  in refs. Push such logic to module scope (see `RecognitionTest.tsx`,
  `NoiseCheck.tsx`) or into lib functions taking callbacks (see
  `recognizeAttempt` in `lib/speech.ts`).
- **Never call `setState` inside a `useEffect` body.** React 19 rejects
  it. Use `lib/useClientValue.ts` for capability reads and
  `lib/clientStore.ts` for `localStorage`.
- **Edge speech quirks live in `lib/speech.ts`** — read the comments
  there before touching recognition; both workarounds look removable
  and are not.
- **`AGENTS.md` is rewritten by `next dev`.** Committing it alongside
  your work keeps the tree clean; deleting the block just recreates it.
- **Browser wallet extensions** (Phantom, MetaMask) throw
  `Cannot redefine property: ethereum` into the Next dev overlay. Not an
  app bug — use a private window to avoid it.

## Where the reasoning lives

- `docs/superpowers/specs/2026-08-20-kid-learning-path-design.md` — why
  the design is shaped this way, including the research on how Chinese
  children actually acquire literacy.
- `docs/superpowers/plans/2026-08-20-kid-learning-path.md` — the
  task-by-task implementation plan, with the two deviations noted at the
  top.
- PR #1 — the original path, including two defects passing tests did
  not catch. PR #2 — the hear-first speaking flow. The commit messages
  on `master` narrate the Edge debugging arc in detail.
