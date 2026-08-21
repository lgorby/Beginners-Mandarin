"use client";

import { useState } from "react";
import { speak } from "@/lib/speech";
import { LANGUAGES } from "@/lib/languages";
import { useArrowNav } from "@/lib/useArrowNav";

// The Spanish twin of the tones page: the small set of sound rules that
// unlocks all Spanish spelling, then an ear-training quiz on the two
// contrasts English speakers actually struggle to hear (rr vs r, ñ vs n).

const es = LANGUAGES.es;
const sayEs = (text: string, rate = 0.8) =>
  speak(text, {
    lang: es.speechLang,
    voicePrefer: es.preferredVoices,
    voiceAvoid: es.wrongVarietyVoices,
    rate,
  });

// The five vowels — pure, short, and they NEVER change. In Spanish the
// vowel letter names are the vowel sounds, so speaking "a. casa." reads
// as the sound followed by the example.
const VOWELS = [
  { letter: "a", sounds: "ah", word: "casa", en: "house" },
  { letter: "e", sounds: "eh", word: "mesa", en: "table" },
  { letter: "i", sounds: "ee", word: "sí", en: "yes" },
  { letter: "o", sounds: "oh", word: "no", en: "no" },
  { letter: "u", sounds: "oo", word: "luna", en: "moon" },
];

const CONSONANTS = [
  { key: "ñ", hint: "Like the ny in “canyon”.", word: "año", en: "year" },
  { key: "rr", hint: "A rolled trill — the tongue vibrates.", word: "perro", en: "dog" },
  { key: "r", hint: "Between vowels: one quick flap, like the tt in “butter”.", word: "pero", en: "but" },
  { key: "j", hint: "A strong, breathy h.", word: "jugo", en: "juice" },
  { key: "ge / gi", hint: "G before e or i makes that same strong h.", word: "gente", en: "people" },
  { key: "h", hint: "Always silent.", word: "hola", en: "hello" },
  { key: "ll / y", hint: "Both sound like the y in “yes”.", word: "lluvia", en: "rain" },
  { key: "qu", hint: "Just a k — the u is silent.", word: "queso", en: "cheese" },
  { key: "z / ce / ci", hint: "An s sound in Latin American Spanish.", word: "cinco", en: "five" },
  { key: "b / v", hint: "The very same sound — “vaca” starts like “baca”.", word: "vaca", en: "cow" },
];

// Ear-training pool: minimal pairs where ONE sound changes the word.
// Index 0 vs 1 within a pair is what the listener must tell apart.
type PairWord = { text: string; en: string };
const PAIRS: [PairWord, PairWord][] = [
  [{ text: "perro", en: "dog" }, { text: "pero", en: "but" }],
  [{ text: "carro", en: "car" }, { text: "caro", en: "expensive" }],
  [{ text: "cerro", en: "hill" }, { text: "cero", en: "zero" }],
  [{ text: "corro", en: "I run" }, { text: "coro", en: "choir" }],
  [{ text: "parra", en: "grapevine" }, { text: "para", en: "for" }],
  [{ text: "campaña", en: "campaign" }, { text: "campana", en: "bell" }],
  [{ text: "peña", en: "crag" }, { text: "pena", en: "sorrow" }],
  [{ text: "moño", en: "hair bun" }, { text: "mono", en: "monkey" }],
  [{ text: "soñar", en: "to dream" }, { text: "sonar", en: "to sound" }],
];

interface Quiz {
  pair: [PairWord, PairWord];
  /** Which of the pair was spoken. */
  said: 0 | 1;
}

export default function SoundsPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [guess, setGuess] = useState<0 | 1 | null>(null);
  const [streak, setStreak] = useState(0);

  const nextQuiz = () => {
    let pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
    // Avoid repeating the same pair twice in a row.
    while (quiz && pair[0].text === quiz.pair[0].text) {
      pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
    }
    const said = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
    setQuiz({ pair, said });
    setGuess(null);
    sayEs(pair[said].text);
  };

  const makeGuess = (i: 0 | 1) => {
    if (!quiz || guess !== null) return;
    setGuess(i);
    setStreak(i === quiz.said ? streak + 1 : 0);
  };

  // ArrowRight starts the quiz / plays the next word — the same key that
  // means "next" everywhere else. Random draw, so there is no Previous.
  useArrowNav(undefined, nextQuiz);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold">🔤 Master the Sounds</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Spanish is spelled the way it sounds —{" "}
          <strong>learn these few rules and you can pronounce any word you
          read</strong>. Start with the five vowels: pure, short, and they
          never change, no matter the word. Tap each card to hear it.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {VOWELS.map((v) => (
          <button
            key={v.letter}
            type="button"
            onClick={() => sayEs(`${v.letter}. ${v.word}.`, 0.7)}
            className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-4xl font-bold text-emerald-600" lang="es-MX">
              {v.letter}
            </div>
            <div className="text-lg font-semibold">“{v.sounds}”</div>
            <div className="text-sm text-zinc-500" lang="es-MX">
              {v.word}
            </div>
            <div className="text-xs text-zinc-500">{v.en}</div>
            <div className="mt-1 text-sm">🔊</div>
          </button>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-xl font-bold">The letters that trip English speakers</h2>
        <div className="space-y-2">
          {CONSONANTS.map((c) => (
            <div
              key={c.key}
              className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-zinc-900"
            >
              <span className="w-20 shrink-0 text-lg font-bold text-emerald-600" lang="es-MX">
                {c.key}
              </span>
              <span className="flex-1 text-sm text-zinc-500">{c.hint}</span>
              <button
                type="button"
                onClick={() => sayEs(c.word, 0.7)}
                className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 active:scale-95 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
              >
                🔊 <span lang="es-MX">{c.word}</span>
                <span className="ml-1 text-xs opacity-70">({c.en})</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-emerald-200 bg-white p-6 dark:border-emerald-900 dark:bg-zinc-900">
        <h2 className="text-xl font-bold">🎧 Train Your Ear</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Listen to a word and pick which one you heard. One sound changes the
          whole word — <em>perro</em> is a dog, <em>pero</em> is
          &ldquo;but&rdquo;. A few minutes a day builds the ear fast.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={nextQuiz}
            className="rounded-full bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
          >
            {quiz ? "▶ Next word" : "▶ Start quiz"}
          </button>
          {quiz && (
            <button
              type="button"
              onClick={() => sayEs(quiz.pair[quiz.said].text)}
              className="rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              🔊 Hear it again
            </button>
          )}
          {streak > 1 && (
            <span className="font-semibold text-amber-600">
              🔥 {streak} in a row
            </span>
          )}
        </div>

        {quiz && (
          <div className="mt-4">
            <div className="flex gap-2">
              {([0, 1] as const).map((i) => {
                const w = quiz.pair[i];
                const isGuess = guess === i;
                const isAnswer = guess !== null && quiz.said === i;
                return (
                  <button
                    key={w.text}
                    type="button"
                    onClick={() => makeGuess(i)}
                    disabled={guess !== null}
                    className={`flex-1 rounded-xl border-2 p-3 text-center transition ${
                      isAnswer
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : isGuess
                          ? "border-red-500 bg-red-50 dark:bg-red-950"
                          : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                  >
                    <span className="block text-xl font-semibold" lang="es-MX">
                      {w.text}
                    </span>
                    <span className="block text-xs text-zinc-500">{w.en}</span>
                  </button>
                );
              })}
            </div>
            {guess !== null && (
              <p className="mt-3 text-center font-medium">
                {guess === quiz.said ? (
                  <span className="text-green-600">✅ Correct!</span>
                ) : (
                  <span className="text-red-600">❌ It said</span>
                )}{" "}
                <span className="text-2xl" lang="es-MX">
                  {quiz.pair[quiz.said].text}
                </span>{" "}
                <span className="text-sm text-zinc-500">
                  ({quiz.pair[quiz.said].en})
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
