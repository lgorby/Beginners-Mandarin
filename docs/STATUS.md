# Where this project is

**Last updated:** 2026-08-20
**Branch:** `kid-learning-path` · **PR:** https://github.com/lgorby/Beginners-Mandarin/pull/1 (open, targeting `master`)

Read this first when picking the work back up. The spec and plan below say
what was *intended*; this file says what actually happened and what is
left.

## Pick up on a new machine

```bash
git clone https://github.com/lgorby/Beginners-Mandarin.git
cd Beginners-Mandarin
git checkout kid-learning-path
npm ci
npm run dev            # http://localhost:3000
```

Verified from a clean clone on 2026-08-20: `npm ci` → 63 tests pass →
`next build` succeeds → `tsc --noEmit` clean, with no manual steps. The
CC-CEDICT dictionary (9.8 MB) and all 26 pictures are committed, so
nothing needs regenerating.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Vitest, 63 tests |
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
| `/tones` `/lessons` `/dictionary` `/practice` `/strokes` `/characters` `/flashcards` | Unchanged from before this work |

All ten tasks in the implementation plan are done. `lib/vocab.ts` and
`lib/lessons.ts` were not modified — the grown-up section works exactly
as it did.

## Not verified — do this first

Nothing below has been tested with a browser or a person. It is the top
of the list.

- Clicking through a full lesson end to end
- Whether the spoken English instruction helps or talks over the Chinese
- Microphone scoring in real use (Chrome/Edge only)
- Whether a dashed blank slot reads as "put a word here"
- Whether tap-to-place looks tappable
- Whether three choices is too many for a `MATCH`

**Put lessons 1–3 in front of a child before trusting the other seven.**
The step engine is generic, so three lessons exercise every step type;
the rest is data. Lesson 6 (`Asking`) is the one to watch — it teaches a
single word and is the mechanic the whole design rests on.

## Open items

**Two known lint errors, deliberately left.** Both are
`react-hooks/set-state-in-effect`, both pre-date this work:

- `app/(grown-ups)/dictionary/page.tsx:25` — clears search results inside
  the debounce effect. Fix is to move the empty-query branch into the
  input's change handler.
- `app/(grown-ups)/flashcards/page.tsx:41` — builds the SRS review queue
  from `localStorage` and `Date.now()` on mount. This one needs the queue
  logic restructured, and **there are no tests over the SRS behaviour**.
  Write tests first; do not refactor it blind for a lint warning.

A third error of the same kind in `components/MicPractice.tsx` was fixed
using `lib/useClientValue.ts` — use that hook for any browser-capability
read.

**Two pictures I am not confident in.** Both are hand-drawn and worth
redrawing after watching a child:

- `public/pics/chi.svg` (吃, "to eat") may read as shouting rather than
  eating.
- `public/pics/da.svg` / `xiao.svg` (大 / 小) rely on an orange highlight
  to say which circle is meant. If a child misses the highlight, the two
  pictures look identical.

**Counting is not taught.** Deliberate — a counted noun needs a measure
word (三只猫, not 三猫), which is exactly the complexity this path
removes. If it should come back, it needs its own design.

## Gotchas

- **`tsc --noEmit` fails on a clean checkout.** `LayoutProps` and
  `PageProps` are Next 16 globals generated into `.next/types/`. Run
  `npx next build` first.
- **Never call `setState` inside a `useEffect` body.** React 19 rejects
  it. Use `lib/useClientValue.ts` for capability reads and
  `lib/clientStore.ts` for `localStorage`.
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
- PR #1 — the summary, including two defects that passing tests did not
  catch.
