# 你好 Mandarin — Beginners Mandarin

A web app that teaches Mandarin Chinese from absolute zero, with sound, speech,
and visuals throughout:

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

## Run it

```bash
npm install
npm run dev      # development
# or
npm run build && npm start   # production
```

Open http://localhost:3000.

**Browser notes**: audio (text-to-speech) works in all modern browsers using
the operating system's Chinese voices. Microphone scoring uses the Web Speech
API's speech recognition, which works best in **Chrome or Edge**.

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
- `lib/pinyin.ts` — converts numbered pinyin (`ni3 hao3`) to diacritics
  (`nǐ hǎo`) and drives tone coloring.
- `lib/vocab.ts` / `lib/lessons.ts` — the HSK-1-based beginner curriculum.
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
- Stroke data & quizzes: [Hanzi Writer](https://hanziwriter.org/) (MIT)
