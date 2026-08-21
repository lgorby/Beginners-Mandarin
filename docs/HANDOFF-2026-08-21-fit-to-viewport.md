# Handoff — fit to viewport, and the SAY replay button (2026-08-21)

Branch `fit-to-viewport`, based on `spanish-grown-ups` (PR #11 head,
`5d0599c`). Four commits. **Not merged anywhere** — the PR targets
`spanish-grown-ups`, so PR #11 has to land before this can reach master.

This implements Parts 2 and 3 of `docs/HANDOFF-2026-08-21-pr11-fixes.md`.
Part 1 of that document was already done and is not touched here.

**State of the tree:** `npm test` 161 passed (12 files), `npx tsc --noEmit`
0 errors, `npm run lint` clean, `npm run build` succeeds, portable package
rebuilt and smoke-tested (both dictionaries answer, new shell present).

> The `tsc` gotcha from the previous handoff still applies: run
> `npm run build` BEFORE `npx tsc --noEmit`, or Next 16's generated
> `PageProps`/`LayoutProps` types are missing and you get three spurious
> `TS2304` errors.

---

## Scope, as agreed

Asked at the start, and answered:

- Replay: **move whole-sentence replay onto the English gloss** (not
  "delete the button and accept word-only replay").
- No-scroll target: **kid path AND grown-up pages**.
- Sizes: **all four** — 1366×768 laptop landscape, 390×844 phone
  portrait, 844×390 phone landscape, 1920×1080 desktop.

I flagged up front that grown-up pages could not fit 390px of height as
stacked documents. They are now paged instead; see the results table.

---

## Part 1 — Task A: the SAY step's replay button

`f52ac5d`. The button at `SayStep.tsx:196-206` is gone. The three
"Hear it again" buttons in the grown-up section were not touched.

**What replaced it.** Whole-sentence replay moved onto the English gloss
line, which SAY renders on every step — `lib/steps.ts:119` gives even a
single-word SAY the word's own gloss, so there is always something to
attach it to. The gloss is now a button with
`aria-label="Hear it again: <gloss>"` and a small 🔊.

**Both hazards the previous handoff identified are handled:**

1. *Sentence replay and question intonation.* A tile calls
   `speakWord`; only `speakSentence` applies the language's
   `wrapQuestion`, which wraps Spanish in `¿…?` so the TTS rises. The
   gloss button calls `speakSentence(step.words, { question })`, exactly
   as the deleted button did.
2. *The mic opening on a word tap.* `speak()` calls
   `speechSynthesis.cancel()` on entry, which fires the in-flight
   utterance's `onend` — and SAY's auto-speak passes an `onDone` that
   opens the microphone. `SentenceRow` gained an optional `onWordTap`,
   and `SayStep` passes a `disarm` that clears `autoArmed`. Both the
   gloss button and the tiles disarm now.

**Verified**, in headless Edge with `speechSynthesis.speak` instrumented,
on single-word and whole-sentence SAY steps in both languages:

| check | result |
|---|---|
| standalone 🔊 buttons on a SAY step | 0 |
| gloss replay control present | `Hear it again: Hello, Mom!` |
| gloss tap plays | `hola mamá` (whole sentence) |
| first tile tap plays | `hola` (one word) |
| Mandarin equivalent | gloss → `你好`, tile → `你` |

**Still unverified, needs a real device:** that the mic genuinely does
not open when a child taps a word mid-utterance. Headless has no working
speech synthesis or recognition, so the *disarm wiring* is proven but
the *end-to-end race* is not. Run a Spanish lesson to a SAY step, let
the auto-speak start, tap a word mid-utterance, confirm the mic stays
shut.

---

## Part 2 — Task B: fitting the viewport

### The shape of the change

`a7ff7c2` is the load-bearing commit. Before it, nothing in the codebase
constrained a page to the screen — no `h-dvh`, `h-screen`, or `dvh`
anywhere, and `<body>` was `min-h-full`, which means *at least* the
viewport.

- **`app/layout.tsx`** — `<body>` is `h-dvh overflow-hidden` and a flex
  column. `dvh` not `vh` because mobile browser chrome overflows `vh`.
- **Each route owns its scroll region.** Navbars and footers are
  `shrink-0` rails; `<main>` is `min-h-0 flex-1 overflow-y-auto`. Long
  content scrolls *inside a box*, so nothing is ever clipped or
  unreachable.
- **`components/Panes.tsx`** (new) — the tabbed frame the long reference
  pages use. Fixed title + tab row, one scrolling pane, optional
  always-visible footer rail. Arrow keys are deliberately unbound:
  tones/sounds/spelling already give ArrowRight to "next quiz word".
- **Two height-gated utilities in `globals.css`** — `short-hide`
  (≤620px) drops a sentence of prose, `compact-hide` (≤800px) drops a
  whole nice-to-have block. Never applied to a control, a label, or
  anything carrying a word's meaning.
- **`VoicePicker`** moved out of `fixed bottom-4 right-4` into the
  footer bar, panel opening upward. The kid path's ⚙️ likewise moved
  into StarPath's header row. Both sat exactly where the primary action
  lands on a short screen.

`7c4e9ed` sizes the kid path. `PicTile`'s `SIZES` map is still the one
place tile dimensions live; they are now `clamp()`ed against viewport
**height**, since a step must fit between the instruction pill and
Continue and height is what runs out. `SIZES` is exported so
SentenceRow's blank SWAP slot scales with its row. The emoji fallback is
sized in `cqh` against a `container-type: size` box so it shrinks too.

`229f0a0` pages the grown-up sections — tones, strokes, sounds, spelling
and the lesson page into panes; both dictionaries, both lesson lists and
both practice pages into rails-plus-one-scroll-region.

### Results, measured

`scripts/fit-check.mjs` (new, committed) drives headless Edge over CDP
and reports, per page per viewport, every box the user would have to
scroll. 20 pages × 4 viewports.

| viewport | fits with zero scrolling |
|---|---|
| desktop 1920×1080 | **20 / 20** |
| laptop 1366×640 *(1366×768 minus chrome)* | **16 / 20** |
| phone 390×844 portrait | **13 / 20** |
| phone 844×390 landscape | **3 / 20** |

**The window scrolls on 0 of 80 combinations.** That is the invariant
worth protecting — the script exits non-zero if it ever stops being
true. Everything else scrolls inside a bounded pane.

Before this branch, for comparison, the window scrolled on 55 of 80.

### What still scrolls, and why

Laptop 1366×640 — four pages, three of them trivially:

- `/mandarin-grown-ups` +6px, `/tones` +12px, `/lessons/greetings` +64px.
  Cosmetic. Another few px of padding would close them; I stopped
  because further compression starts making the pages look starved.
- `/strokes` +436px. Eight stroke cards, each with an SVG, a name, a
  pronunciation and a live Hanzi animation. This one is genuinely a
  reference list — it needs either a fifth pane or smaller cards, and
  both are design calls rather than layout fixes.

Phone portrait 390×844 — the kid map (+592px, twenty lessons one column
wide), the two hubs, `/strokes`, and three small ones.

Phone landscape 844×390 — most pages. 390px of height minus browser
chrome is around 330px of usable space; a quiz with a prompt and four
answer buttons barely fits, and a table of ten consonants cannot. The
chrome always fits and the controls are always reachable, which is the
real deliverable at this size.

**Genuinely unfixable without a product decision:** the kid map and the
lesson lists grow with the course. They are grids now (up to four
columns) and they scroll inside their box. Twenty lessons will not fit
a phone; paginating the map is a design change, not a layout one.

### Running the check yourself

```sh
npm run build
cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
(cd .next/standalone && PORT=3311 HOSTNAME=127.0.0.1 node server.js &)

"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --remote-debugging-port=9222 --disable-gpu \
  --user-data-dir=/tmp/fitcheck about:blank &

APP=http://127.0.0.1:3311 node scripts/fit-check.mjs
```

Chrome works in place of Edge. Nothing extra is installed — it uses
Node's built-in `WebSocket` against the browser's debug port.

**Stop the standalone server before `npm run build`**, or the build dies
with `EBUSY: rmdir .next\standalone`. The same applies to a running
portable app: it holds `dist-portable`.

---

## Part 3 — The portable package

Rebuilt with `scripts/build-portable.ps1`. 120 MB folder plus zip at
`dist-portable/BeginnersMandarin-portable.zip`.

Smoke-tested by running the packaged `node/node.exe app/server.js`
directly:

- `/` → 200
- `/api/search-es?q=dog` → `perro (nmf) dog, hound` — the Spanish
  dictionary is in the package (this was F1 in the previous handoff)
- `/api/search?q=water` → `水 shui3` — CC-CEDICT too
- `/learn/hello` serves `<body class="flex h-dvh flex-col overflow-hidden …">`,
  so the packaged build is this branch, not a stale one

Note: a previously-running portable app was holding port 3210 and
`dist-portable`. I stopped it to rebuild — that was the build being
replaced. If you want it running again, launch the new
`dist-portable/BeginnersMandarin/BeginnersMandarin.exe`.

---

## Things worth knowing before you touch this

- **`next start` does not work with `output: "standalone"`.** It appears
  to start and then serves nothing useful. Use
  `node .next/standalone/server.js` with `.next/static` and `public`
  copied in, which is what the portable build does. I lost a measurement
  round to a stale server on port 3210 that answered instead.
- **`overflow-hidden` on `<body>` propagates to the viewport**, and body
  itself is then treated as `overflow: visible`. So body does not clip
  its own children — every bounded region has to be explicit. That is
  why `min-h-0` appears on every flex-column ancestor: without it,
  `flex-1` refuses to shrink below content size and the chain leaks.
- **Prettier is not this project's formatter** (not in
  `devDependencies`, no config). Running `npx prettier --write` over the
  tree reformats unrelated files and data tables. I reverted that churn;
  don't reintroduce it.
- The `short-hide` / `compact-hide` utilities set `display: none`. Don't
  combine them with a responsive display utility (`sm:block`) on the
  same element — which one wins depends on utility order, not intent.

---

## Suggested next steps

1. Real-device pass on the SAY step mic race (above) — the one thing
   this branch changes that no automated check can reach.
2. ~~Decide what `/strokes` should do at laptop height~~ — done, see the
   addendum below.
3. Decide whether the kid map should paginate rather than scroll on a
   phone.
4. ~~If the ~6–64px laptop overflows bother you, they are all padding~~ —
   done, see the addendum below.

---

## Addendum (2026-08-21, later): the laptop now fits everywhere

Continuation work; steps 2 and 4 above are done.

**`/strokes` — shrink-the-cards, taken further.** The eight stroke
cards each carried their own 90px HanziWriter *plus two stacked
buttons* (~180px per row × four rows — that was the whole +436px).
`components/StrokeExplorer.tsx` (new) replaces them with a
master–detail pair: compact selectable cards on the left, ONE shared
panel on the right with the stroke's name + 🔊, a 120px animation of
the example character, ▶ Animate / ✍️ Trace it, and the "See it in"
line. Nothing was hidden — every control the old cards had exists in
the panel. The cards are plain `<button>`s, so the per-card 🔊 moved
into the panel (a button cannot nest inside a button).

**The padding-level ones:**

- `/lessons/[id]` word grid: `xl:grid-cols-6`, so a six-word lesson is
  one row on a laptop (rows are what 640px cannot afford).
- `/tones`: ma-cards `sm:p-4` → `sm:p-3`, lesson `space-y-3` → `space-y-2`.
- `/mandarin-grown-ups`: hero button row `sm:mt-6` → `sm:mt-4`.

**Results, re-measured** with `scripts/fit-check.mjs` (same method):

| viewport | fits with zero scrolling |
|---|---|
| desktop 1920×1080 | **20 / 20** |
| laptop 1366×640 | **20 / 20** *(was 16)* |
| phone 390×844 portrait | **13 / 20** |
| phone 844×390 landscape | **3 / 20** |

The window still scrolls on **0 of 80**. `/strokes` inner scroll on
phone portrait dropped from +1720px to +374px, phone landscape from
+649px to +195px. Verified visually (headless screenshots at 1366×640
and 1920×1080): `npm test` 161 passed, `tsc --noEmit` 0 errors, lint
clean apart from a pre-existing warning in `fit-check.mjs` itself.

Still open from the original list: the real-device mic race (step 1)
and the kid-map pagination decision (step 3).
