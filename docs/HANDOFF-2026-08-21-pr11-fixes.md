# Handoff — PR #11 review fixes, and what's next (2026-08-21)

Branch `spanish-grown-ups` (local `pr-11`), pushed. PR #11 now carries 14
commits: the original Spanish-toolkit feature plus 13 review fixes.
See `docs/HANDOFF.md` for what the feature branch itself does — this
document covers only the review-fix work on top of it, and the two tasks
that come next.

**State of the tree:** `npm test` 161 passed (12 files), `npx tsc --noEmit`
0 errors, `npm run lint` clean, `npm run build` succeeds, portable package
rebuilds with both data files.

> **`tsc` gotcha:** run `npm run build` BEFORE `npx tsc --noEmit`. Next 16
> generates the global `PageProps`/`LayoutProps` types into `.next`, so a
> typecheck on a cleaned tree reports three spurious `TS2304` errors that
> have nothing to do with your changes.

---

## Part 1 — What was done

A code review of PR #11 found seven defects. Each was fixed in its own
commit, reviewed by a fresh agent, and re-reviewed after any fix round.

| # | Defect | Fix | Commits |
|---|---|---|---|
| F1 | Portable build shipped without `data/wikdict_es_en.tsv`, so every `/api/search-es` request in the packaged app returned 500 | `scripts/build-portable.ps1` names both data files with a `Test-Path` guard; `lib/__tests__/portableBuild.test.ts` fails when the list falls behind the loaders | `e464e40` |
| F2 | `lib/spanishDictionary.ts` split on `"\n"`, so CRLF checkouts left `\r` on every entry's last translation | `split(/\r?\n/)` + `.gitattributes` pinning `data/*.tsv` to LF | `4cb3b78`, `12c2b8d` |
| F3 | Dictionary search had no `catch` (silent failure) and no request-ordering guard (stale responses repopulating a cleared box) | error state + `requestId` ref in `app/spanish-grown-ups/dictionary/page.tsx` | `f09cab0` |
| F4 | A Castilian voice chosen in the grown-up picker drove the kids' lessons, and the settings warning ignored the saved preference so it reported the voice as fine | `pickVoice` is now the single source of truth for `speak()` and the warning; `bestVoiceFor` replaced by `effectiveVoiceFor`; `voiceWarningKind` picks the right message; picker marks wrong-variety voices | `9d4a46e`, `fa5af7b`, `646d6b6` |
| F5 | The stress *listening* quiz printed accent marks, making half the pool answerable by sight | `bare()` strips accents from button labels only | `2cbbaf7` |
| F6 | Front door and three comments still said the Spanish sections were "coming soon" | copy retired | `7633d52`, `10eae8d` |
| F7 | All 460 WikDict `nmf` rows showed "el/la", producing "el/la perro" | `lib/spanishNouns.ts` distinguishes genuinely common-gender nouns | `eee5c45`, `a538d31` |

Plus `5d0599c`: one exported `normTag` replacing three copy-pasted BCP-47
normalisers (two of which normalised only one side of the comparison).

### New modules worth knowing about

- `lib/spanishNouns.ts` — article/label/spoken-form for a dictionary entry. Pure, **zero imports** (it is imported by a client component and must never pull in `fs`).
- `lib/spanishStress.ts` — the stress-quiz pool, `bare()`, and `stressByRule()`, which independently derives the stress from the three rules so the pool's answer key can be tested against them.
- `lib/speech.ts` gained `pickVoice`, `effectiveVoiceFor`, `voiceWarningKind`, `rankedVoiceTag`, and now exports `normTag`.

### Decisions taken, and why

- **`nmf` gender heuristic.** Common-gender if the word ends `-a`, `-nte`, or `-ense`, excepting `elefante`/`infante`. A broader morphological rule was tested against the real data and rejected — it flips 110 words and wrongly makes `dios`, `tigre`, `conde`, `abad`, `sacerdote`, `virrey` common-gender.
- **Known-imperfect, left alone deliberately:** ~9 `-a` thing-nouns (`aneurisma`, `gorila`, `haba`, `papa`…) still show "el/la". They did before this PR too, so it is not a regression, and separating people from things needs semantics the TSV does not carry. `vertiente` is deliberately *not* excepted: adding it would render "el vertiente", which is actively wrong.
- **`juez`, `líder`, `portavoz`, `chef` and the invariable compounds** stay at "el" — grammatical but gender-incomplete. Fixing needs a curated word list.

### Still owed — manual checks nobody could run

This repo's vitest has **no jsdom**, and no agent here could drive a
browser. These are genuinely unverified:

- The voice picker's ⚠ Spain badge and both parent warnings. **Needs an `es-ES` voice installed** to exercise at all.
- The dictionary's error message (kill the network, search) and the stale-response race (DevTools → Slow 3G, type then clear).
- Visual: the stress quiz showing bare syllables; the dictionary showing "el perro".

---

## Part 2 — Next task A: remove the replay button from SAY steps

**Target — this exact element, and only this one:**

```tsx
// components/kid/steps/SayStep.tsx:195-206
<button
  type="button"
  onClick={() => {
    autoArmed.current = false; // replaying must not open the mic
    speakSentence(step.words, { question });
  }}
  className="rounded-full bg-red-50 px-6 py-4 text-3xl dark:bg-red-950"
  aria-label="Hear it again"
>
  🔊
</button>
```

**Do NOT touch** the three other "Hear it again" buttons — they are
different components with text labels, in the grown-up section:
`app/(grown-ups)/tones/page.tsx:135`,
`app/spanish-grown-ups/sounds/page.tsx:172`,
`app/spanish-grown-ups/spelling/page.tsx:191`.

### The premise checks out

Tapping the word already speaks it. `SentenceRow` renders each word as a
`PicTile`, and `PicTile` is itself a `<button>` whose `onClick` calls
`speakWord(word.text)` (`components/kid/PicTile.tsx:51-57`,
`speakOnClick` defaults to `true`). So the button is redundant for
single-word steps.

### Two things break if you only delete it

**1. Whole-sentence replay disappears.** The button calls
`speakSentence(step.words, { question })`; a tile calls
`speakWord(word.text)`. For a multi-word SAY step the child could then only
hear the words one at a time, never the sentence. SAY steps are routinely
multi-word — `SayStep.tsx:190-193` switches tiles to `size="sm"` when
`step.words.length > 2`. It also loses question intonation: `speakSentence`
applies the language's `wrapQuestion`, which wraps Spanish in `¿…?` so the
TTS actually rises (`lib/kidSpeech.ts:29-40`). `speakWord` does not.

Decide with the user which they want:
- accept single-word-only replay (fine if SAY steps are mostly one word — check `lib/courses/*.ts` first), or
- move whole-sentence replay onto something already on screen, e.g. tapping the English gloss at `SayStep.tsx:194`.

**2. The mic can open when the child taps a word.** This is the subtle one.

`speak()` calls `speechSynthesis.cancel()` on entry (`lib/speech.ts:253`).
Cancelling fires the *previous* utterance's `onend`/`onerror`, and
`SayStep`'s auto-speak passes an `onDone` that opens the microphone
(`SayStep.tsx:158-180`). The deleted button guarded against exactly this by
setting `autoArmed.current = false` first — its comment says so. `PicTile`'s
`onClick` does not touch `autoArmed`.

So once tiles are the only replay path, a child tapping a word while the
automatic read-aloud is still playing can trigger the hands-free mic. Give
`PicTile` in `SayStep` an `onClick` that disarms `autoArmed` (the prop
already exists: `PicTile.tsx:26,35` accepts `onClick`, and it runs
alongside `speakOnClick`). Note this hazard exists in a milder form today —
removing the button promotes it from incidental to the main path.

### Verifying

`npm test` covers none of this — SAY-step behaviour is component behaviour
and there is no jsdom. Do not add jsdom just for this without asking. Plan
on a real device check: run a Spanish lesson to a SAY step, let the
auto-speak start, tap a word mid-utterance, and confirm the mic does not
open.

---

## Part 3 — Next task B: fit on a laptop or phone without scrolling

### What the code looks like today

- **Height chain:** `app/layout.tsx:25-27` — `<html class="h-full">`, `<body class="flex min-h-full flex-col">`. `min-h-full` means *at least* the viewport; content taller than the screen simply scrolls. There is **no `h-dvh`, `h-screen`, or `dvh` anywhere in the codebase** — nothing currently constrains a page to the viewport.
- **The kid path is essentially fixed-size.** Only **3** responsive breakpoint utilities (`sm:`/`md:`/`lg:`) appear in all of `components/kid/`. Everything else is one hard-coded size.
- **The biggest offenders** are sized in absolute units:
  - `PicTile` boxes — `sm: h-20 w-20`, `md: h-28 w-28`, `lg: h-56 w-56` (`PicTile.tsx:18-20`). `lg` is 224 px per tile, and `MeetStep`-style single-word steps use it.
  - `SayStep`'s mic button — `px-10 py-6 text-4xl` (`SayStep.tsx:209-214`).
  - `StepShell`'s frame — `gap-6 px-4 py-6` plus an instruction pill and a Continue row (`StepShell.tsx:49`).
- **Fixed overlays that can cover the controls on a short screen:**
  `ParentSettings`' ⚙️ at `fixed bottom-4 right-4` (`ParentSettings.tsx:76`) and `VoicePicker` at `fixed bottom-4 right-4` (`VoicePicker.tsx:101`). On a laptop in landscape these sit right where the Continue button lands.

`StepShell` already uses `flex flex-1 flex-col justify-between`, so the
frame is *shaped* to fill a fixed height — it just never gets one. That
makes it a good place to start.

### Ask the user this before starting

**Which screens must fit without scrolling?** The kid path (`/learn`) is a
step-at-a-time flow and is a reasonable no-scroll target. The grown-up
pages are long-form documents — `/spanish-grown-ups/spelling` has rules,
accent pairs, punctuation and a quiz stacked vertically — and cannot fit a
phone without either scrolling or being restructured into panes. Do not
assume the requirement covers both.

Also get the actual target sizes. "Laptop" and "phone" are very different
constraints; a 1366×768 laptop in landscape has ~600 px of usable height
after browser chrome, which is tighter than many phones in portrait.

### Suggested approach once scoped

1. Give the flow a real viewport height (`h-dvh` on the shell, not `min-h-`), and let `StepShell`'s existing `flex-1`/`justify-between` distribute it. Use `dvh` rather than `vh` — mobile browser chrome makes `vh` overflow.
2. Make the fixed sizes responsive. `PicTile`'s `SIZES` map is the single place tile dimensions are defined, so it is one edit; consider clamping with viewport-relative sizing so tiles shrink on short screens instead of at width breakpoints (height is the binding constraint here, not width).
3. Move or hide the `fixed bottom-4 right-4` overlays when they would overlap the primary action.
4. Check the two worst cases specifically: a 3+ word SAY step (largest tile row plus mic button plus Continue) and `MeetStep` with an `lg` tile.

No automated test can catch a layout regression here. Verify by resizing a
real browser to the agreed sizes, and check both orientations on a phone.
