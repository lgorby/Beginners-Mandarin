# Where this project is

**Last updated:** 2026-08-20 (evening)
**Branch:** `master` — PR #1 (kid learning path) and PR #2 (hear-first
speaking flow) are both merged; no feature branches are open.

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
| `npx eslint .` | Lint — 2 known errors, see below |

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

**Two known lint errors, deliberately left.** Both are
`react-hooks/set-state-in-effect`, both pre-date this work:

- `app/(grown-ups)/dictionary/page.tsx` — clears search results inside
  the debounce effect. Fix is to move the empty-query branch into the
  input's change handler.
- `app/(grown-ups)/flashcards/page.tsx` — builds the SRS review queue
  from `localStorage` and `Date.now()` on mount. This one needs the
  queue logic restructured, and **there are no tests over the SRS
  behaviour**. Write tests first; do not refactor it blind.

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
