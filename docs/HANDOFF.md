# Handoff — Spanish grown-up section (2026-08-21)

Branch `spanish-grown-ups`, branched from `master` at e82a7dc. Everything
below is verified: `npm run build`, `npx tsc --noEmit`, `npm run lint`,
and `npm test` (119 tests, 9 files) all pass.

## What this branch does

The single "For grown-ups · Mandarin" door split into two. The Mandarin
toolkit moved from `/grown-ups` to `/mandarin-grown-ups` (old URL 308s via
`next.config.ts`), and a full Spanish twin now lives at
`/spanish-grown-ups` — same chrome, emerald accent instead of red:

| Spanish page | What it is | Mandarin twin |
|---|---|---|
| `/spanish-grown-ups` | Landing: hero, feature cards, first words with audio | `/mandarin-grown-ups` |
| `…/sounds` | Five vowels, tricky consonants, rr/r + ñ/n minimal-pair ear quiz | `/tones` |
| `…/dictionary` | Talking dictionary, search-as-you-type both directions | `/dictionary` |
| `…/practice` | Mic practice: scored "Say it!" + Record & Compare | `/practice` |
| `…/spelling` | Stress rules, accent-mark pairs, ¿ ¡, find-the-stress quiz | (no direct twin) |
| `…/flashcards` | Leitner-box SRS review of the Spanish course words | `/flashcards` |

Lessons stay on the kid path (`/learn`) — the Spanish navbar/cards link
there and pin the language first via `setKidLang("es")`.

## How the pieces fit

- **`lib/spanishSections.ts`** — SSOT for the section list; the navbar
  (`components/SpanishNavBar.tsx`) and the landing cards read it.
- **`app/spanish-grown-ups/layout.tsx`** — the section's chrome (navbar,
  footer, `<VoicePicker lang="es" />`). Deliberately OUTSIDE the
  `(grown-ups)` route group, which renders the Mandarin-only chrome.
- **Dictionary**: `data/wikdict_es_en.tsv` (~25k entries; regenerate with
  `node scripts/build-es-dict.mjs`, which downloads WikDict's es-en
  SQLite — CC BY-SA, credited in README + section footer) → parsed by
  `lib/spanishDictionary.ts` (accent-blind, importance-ranked) → served
  by `/api/search-es` → UI at `app/spanish-grown-ups/dictionary/page.tsx`.
  The page adds el/la articles, including el-with-stressed-a feminine
  nouns (el agua) via a hand list.
- **Generalized shared components** (Mandarin behavior unchanged, new
  optional language params):
  - `components/SpeakButton.tsx` — `lang`/`voicePrefer`/`voiceAvoid`.
  - `components/MicPractice.tsx` — `lang="es"` switches the recognizer
    tag, TTS voice, and copy; skips the pinyin/tone rescoring (`/api/score`)
    which is Mandarin-only. `pinyin` prop is now optional.
  - `components/VoicePicker.tsx` — per-language voice list + persisted
    choice (`lib/speech.ts` VOICE_KEYS: zh key unchanged, es added), so a
    Spanish pick can never make a Chinese voice read Spanish.
  - `lib/srs.ts` — refactored into `createSrsSession(key, words)`;
    Mandarin exports kept under their old names, `spanishSrs` added
    (storage key `spanish-srs-v1`, deck = es course words from
    `lib/curriculum`).

## Loose ends / natural next steps

- The Spanish practice sentences come straight from the kid lessons
  (~30 items); a richer adult sentence list would be the next content win.
- `guessVoiceGender` in `lib/speech.ts` knows common Microsoft/Google
  Spanish voice names; unknown voices show 🗣️ — extend the list if a
  user's voice shows unlabeled.
- The sounds/spelling quiz pools are small hand-curated lists — easy to
  extend in place (`QUIZ`/`PAIRS` consts at the top of each page).
- Adding a third language: entry in `lib/languages.ts`, course in
  `lib/courses/`, then mirror `app/spanish-grown-ups/` — nothing in the
  shared components needs changing further.

## Gotcha for local dev

`npm run build` and `next dev` share `.next/`; building while the dev
server runs leaves it serving stale chunks. Stop the dev server, build,
then restart it.
