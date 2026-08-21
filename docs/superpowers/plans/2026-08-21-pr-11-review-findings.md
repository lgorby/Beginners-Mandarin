# PR #11 Review Findings — Spec

Source: code review of PR #11 "Split the grown-up door by language and
build the Spanish toolkit" (`master...origin/spanish-grown-ups`, 26 files).
Each finding below is a defect to fix. This document is the spec; the
implementation plan is `2026-08-21-pr-11-review-fixes.md`.

Verified against commit `8f6c4c7` on branch `spanish-grown-ups`.

---

## F1 — Portable build ships without the Spanish dictionary data (high)

`scripts/build-portable.ps1:30` copies only `data/cedict_ts.u8` into the
package. The PR adds a second runtime-read file, `data/wikdict_es_en.tsv`,
loaded with `fs.readFileSync(path.join(process.cwd(), "data", ...))` at
`lib/spanishDictionary.ts:41`. Next's standalone output traces *imports*,
not `fs` paths, so the file never reaches `dist-portable`. Every
`/api/search-es` request in the shipped portable app throws `ENOENT` and
returns 500 — the headline new feature returns nothing for every query.

**Required:** the portable package contains every data file read at
runtime, and the build fails loudly if one is missing.

## F2 — CRLF checkouts corrupt the last translation of every entry (medium)

`lib/spanishDictionary.ts:47` splits on `"\n"` only. The repo has no
`.gitattributes` and `core.autocrlf=true` on Windows, so a fresh clone
writes the TSV with CRLF and every entry's *last* translation keeps a
trailing `\r`.

Reproduced on this machine (confirmed, not theoretical):

```
 FAIL  lib/__tests__/spanishDictionary.test.ts > searchSpanish >
       finds a Spanish word for an English query, common word first
 AssertionError: expected [ 'water\r' ] to include 'water'
```

`agua` loses its exact-translation tier (score 95) and drops 105 → 98;
`hola` parses as `["hello", "hi\r"]`. The UI prints stray carriage
returns. The suite is red on a clean Windows clone: 118 pass, 1 fail.

**Required:** the parser is line-ending agnostic, and the checkout is
pinned to LF so the raw file is clean too.

## F3 — Dictionary search fails silently and races itself (medium)

`app/spanish-grown-ups/dictionary/page.tsx:73`: the debounced `async`
callback has `try { … } finally { setLoading(false) }` and no `catch`.

- Any fetch failure (offline, or the 500 from F1) rejects inside a
  `setTimeout` callback → unhandled rejection. The spinner clears,
  `searched` stays `false`, so neither results nor the "no matches"
  message renders. The search box just looks inert.
- No request-ordering guard: once the 300 ms timer has fired, clearing
  the input (which sets `results: []`, `searched: false`) cannot cancel
  the in-flight fetch, so results reappear under an empty search box.
  Two overlapping requests can also land out of order.

**Required:** a failed search says so; a stale response can never
overwrite a newer query or a cleared box.

## F4 — A Castilian voice chosen in Spanish settings leaks into the kid path (medium)

`lib/speech.ts:194`: `getPreferredVoiceName(normTag(lang).split("-")[0])`
applies a persisted voice to *every* utterance in that language. The
Spanish `VoicePicker` lists all `es-*` voices, Castilian ones included and
unmarked. A parent who taps "Microsoft Helena — es-ES" in
`/spanish-grown-ups` pins it app-wide, and the kid Spanish path then
speaks Castilian ("grathias") — exactly what `wrongVarietyVoices` exists
to prevent.

Worse, the warning at `components/kid/ParentSettings.tsx:28` is computed
from `bestVoiceFor(...)`, which reads only the automatic ranking and
ignores the stored preference. Settings reports the voice as fine while
`speak()` uses the wrong-variety one.

**Required:** the picker marks wrong-variety voices, and the settings
warning is derived from the same choice `speak()` actually makes.

## F5 — The listening quiz prints its own answer (low)

`app/spanish-grown-ups/spelling/page.tsx:221`: the "Find the Stress"
quiz renders each syllable as written text, accent mark included. Six of
the twelve pool words carry one (`te-lé-fo-no`, `co-ra-zón`, `mú-si-ca`,
`fá-cil`, `pa-pá`, `ár-bol`), so half the quiz is answerable by sight
without ever playing the audio — defeating its stated purpose ("Hearing
it is what makes the accent rules stick").

**Required:** the buttons show bare syllables; the reveal line still
shows the accent.

## F6 — The front door undersells the feature this PR ships (low)

`components/PathChooser.tsx:43` reads "Lessons and first words with audio
— more coming". The block comment above the grown-up doors still says the
full toolkit "only exists for Mandarin". Comments in
`components/SpanishNavBar.tsx:12` and `app/spanish-grown-ups/page.tsx:14`
still say the other sections "link to their coming-soon pages". This PR
ships all five tools.

**Required:** no copy or comment in the tree claims the Spanish sections
are unbuilt.

## F7 — "el/la perro" is not Spanish (low)

`app/spanish-grown-ups/dictionary/page.tsx:17` maps `ARTICLE.nmf` to
`"el/la"` for all 460 `nmf` rows. WikDict's `nmf` covers two different
things:

- genuinely common-gender nouns — one spelling, either gender:
  `activista`, `gimnasta`, `poeta` (43 rows, all ending in `-a`);
- masculine headwords whose feminine form is a *different* word:
  `perro`→`perra`, `actor`→`actriz`, `abuelo`→`abuela` (417 rows).

A teaching app currently displays "el/la perro", "el/la actor",
"el/la abuelo". `spokenForm` correctly declines to speak these, so the
learner also loses the audio for 417 common nouns.

**Required:** the article shown and spoken is the one that is actually
correct for the headword as spelled.

---

## Out of scope

Verified correct during review; no change required. Do not "fix" these:

- `getWord` preview words all exist in the es course.
- Both quiz de-duplication `while` loops terminate.
- All 12 stress annotations and the `EL_FEMININE` list are correct.
- `createSrsSession` closures are per-deck; `rateCurrent` is safe to detach.
- `normalizeSpeech`/`scoreMatch` already handle accented Latin script.
- No stale `/grown-ups` route references remain.
- `SpanishNavBar`'s `pick()` hoisting and array-literal union type-check.
- Layouts do not double-render `VoicePicker`.
