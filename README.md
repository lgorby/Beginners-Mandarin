# 你好 Mandarin — Beginners Mandarin (& Spanish)

A web app that teaches Mandarin Chinese from absolute zero — and, on the
kids' path, American (Latin American) Spanish too — with sound, speech, and
visuals throughout. Opening the app puts you at a front door with one big
door per kids' language and a quieter grown-up door below.

## 🧒 The kids' path (`/learn`)

A guided route for a child aged roughly 5–11, in the language whose door
they tap on the front page (🇨🇳 中文 in red, 🇲🇽 Español in green — the tap
IS the language choice). Each language has its own ten lessons and its own
stars; both carry one pictured word forward into a spoken sentence, one
screen at a time:

    你  →  你好  →  我喝茶  →  你喝茶吗？
    hola  →  un gato  →  yo bebo té  →  ¿tú quieres té?

A couple dozen words generate over a hundred grammatical sentences, because
several lessons teach a **multiplier** rather than vocabulary. In Mandarin,
吗 turns any sentence into a question, 他/她 swap the subject, and 不
negates it. In Spanish — where verbs conjugate, so subjects can't be
swapped freely — the multipliers are *quieres* (one word plus rising
intonation makes anything an offer), *él/ella + es*, and *no*.

- **Pictures first.** Every word has its own SVG; the child taps a picture,
  never a word list.
- **No reading required.** Each instruction is spoken aloud in English, so a
  pre-reader can use the app alone.
- **Pinyin is off by default** — a six-year-old can no more read `xǐhuan`
  than 喜欢. A grown-up can switch it on in ⚙️.
- **Nothing punishes.** No hearts, no timers, no streaks. Stars are earned and
  never lost, and a wrong tap just reveals the answer and lets you retry.
- **Locked in order**, so there is never a choice about what to do next.

The front door itself follows the same rule: the child's card is large and
shows their star total, the grown-up card is a quieter one below it.

## 🧑 The grown-up section (`/mandarin-grown-ups`)

The full toolkit — Mandarin only, since tones, CC-CEDICT, and stroke order
have no Spanish equivalent. `/spanish-grown-ups` has its own toolkit:
sounds trainer, WikDict-powered talking dictionary, microphone speaking
practice, accents &amp; stress trainer, and flashcards.

- **🎵 Tone trainer** — learn the four tones first (the classic mā/má/mǎ/mà
  demo), then an ear-training quiz. Tones are color-coded everywhere in the app
  (Pleco convention: 1st red, 2nd green, 3rd blue, 4th purple, neutral gray).
- **📚 10 lessons** — greetings, names, numbers, family, food, questions,
  likes, time, places, descriptions. Each lesson has vocabulary cards with
  emoji visuals, a 30-second grammar note, example sentences, and speaking
  practice.
- **🔎 Talking dictionary** — type an English word, pinyin, or Chinese
  characters and get matches from the full **CC-CEDICT** dictionary
  (~120,000 entries) with tone-colored pinyin and spoken audio.
- **🎤 Speaking practice** — the app speaks a word or sentence through your
  speakers (normal or slow 🐢 speed); you repeat it into the microphone and
  the browser's Mandarin speech recognizer scores how well it understood you.
- **✍️ Character writing** — animated stroke-order for any character plus
  finger/mouse tracing quizzes, powered by Hanzi Writer.
- **🃏 Flashcards** — spaced-repetition review (Leitner boxes, stored in
  localStorage) over all course vocabulary.

## Working on this project

`docs/STATUS.md` is the state of play — what is done, what is unverified,
and the known open items. Read it before picking the work back up.

## Run it

```bash
npm install
npm run dev      # development
# or
npm run build && npm start   # production
```

Open http://localhost:3000.

**Browser notes**: audio (text-to-speech) works in all modern browsers using
the operating system's Chinese and Spanish voices (es-MX preferred, any
`es-*` voice accepted). Microphone scoring uses the Web Speech API's speech
recognition, which works best in **Chrome or Edge**.

## Portable Windows app (no install, no Vercel)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-portable.ps1
```

This produces `dist-portable\BeginnersMandarin\` (and a zip): a self-contained
folder with the built app, a bundled Node runtime, and a compiled
`BeginnersMandarin.exe` launcher that starts the server invisibly on
port 3210 and opens the app in your default browser. Stop it with
`Stop Beginners Mandarin.bat`. The folder runs from a USB stick; see its
`README.txt` for notes (Chrome/Edge recommended for the mic feature).

## How it's built

- **Next.js 16** (App Router) + React 19 + Tailwind CSS 4, TypeScript.
- `data/cedict_ts.u8` — the raw CC-CEDICT dictionary (CC BY-SA 4.0), parsed
  once per server process by `lib/dictionary.ts` and searched via
  `/api/search?q=...`.
- `data/wikdict_es_en.tsv` — the Spanish dictionary (~25,000 entries),
  extracted from [WikDict](https://www.wikdict.com/)'s es-en export
  (Wiktionary data, CC BY-SA) by `node scripts/build-es-dict.mjs`, parsed by
  `lib/spanishDictionary.ts` and searched via `/api/search-es?q=...`.
- `lib/pinyin.ts` — converts numbered pinyin (`ni3 hao3`) to diacritics
  (`nǐ hǎo`) and drives tone coloring.
- `lib/vocab.ts` / `lib/lessons.ts` — the HSK-1-based curriculum behind the
  grown-up section.
- `lib/curriculum.ts` — the single source of truth for the kids' path. It
  merges one course per language (`lib/courses/zh.ts`, `lib/courses/es.ts`)
  and stamps each with its language; `lib/languages.ts` holds everything
  else that varies by language (speech tags, word joining, question
  intonation). Sentences are stored as **arrays of word references**, not
  strings, so `lib/steps.ts` can derive every exercise from them and a test
  can prove no sentence ever uses a word the child has not been taught.
- `lib/steps.ts` — turns a lesson into its ordered exercise sequence. Pure and
  deterministic, so adding a lesson — or a whole language — is a data edit
  and never a UI change.
- `npm test` — Vitest (dev-only; the portable build is unaffected).
  Run `npm run pics` after adding a word to the kids' curriculum.
- `lib/speech.ts` — browser text-to-speech (zh-CN voices) and speech
  recognition helpers.
- `hanzi-writer` — stroke-order animation and tracing quizzes (character data
  loads from the Hanzi Writer CDN).

## Roadmap ideas (from research on Rosetta Stone, HelloChinese, Duolingo, Pimsleur)

- Pinyin chart course (all initials/finals with audio) before lesson 1
- Tone-pair drills (the 20 two-syllable combinations)
- Pitch-contour visualization of your recorded voice vs. the reference
- Pinyin fading: show full pinyin → tap-to-reveal → characters only, as words mature in the SRS
- Multiple TTS voices per item (tone perception trained on one voice doesn't generalize)
- Neural TTS (e.g. Azure/Edge zh-CN voices) for higher-quality audio than the OS voices
- HSK-1 progress meter (x/150 words) and streaks
- Sentence-building (arrange-the-tiles) and listening-comprehension exercise types
- User accounts to sync SRS progress across devices

## Credits

- Dictionary: [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cedict) (CC BY-SA 4.0)
- Spanish dictionary: [WikDict](https://www.wikdict.com/) / Wiktionary (CC BY-SA)
- Stroke data & quizzes: [Hanzi Writer](https://hanziwriter.org/) (MIT)
- Pictures: [OpenMoji](https://openmoji.org/) (CC BY-SA 4.0) — vendored into
  `public/pics/` by `npm run pics`. Six pictures are original work.
