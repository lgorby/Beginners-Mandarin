"use client";

import { useState } from "react";
import { speak } from "@/lib/speech";
import { LANGUAGES } from "@/lib/languages";
import { useArrowNav } from "@/lib/useArrowNav";
import { bare, QUIZ, wordOf, type StressWord } from "@/lib/spanishStress";

// Accents & spelling: the three stress rules that govern every Spanish
// word, the accent marks that tell two words apart, and ¿ ¡ — then a
// quiz that trains hearing WHERE the stress falls.

const es = LANGUAGES.es;
const sayEs = (text: string, rate = 0.8) =>
  speak(text, {
    lang: es.speechLang,
    voicePrefer: es.preferredVoices,
    voiceAvoid: es.wrongVarietyVoices,
    rate,
  });

const RULES = [
  {
    rule: "Ends in a vowel, n, or s → stress the second-to-last syllable.",
    examples: [
      { word: "casa", broken: "CA-sa" },
      { word: "examen", broken: "e-XA-men" },
    ],
  },
  {
    rule: "Ends in any other consonant → stress the last syllable.",
    examples: [
      { word: "español", broken: "es-pa-ÑOL" },
      { word: "comer", broken: "co-MER" },
    ],
  },
  {
    rule: "An accent mark overrides both rules — stress THAT syllable.",
    examples: [
      { word: "teléfono", broken: "te-LÉ-fo-no" },
      { word: "corazón", broken: "co-ra-ZÓN" },
    ],
  },
];

// Same sound, different word: the accent mark carries the meaning.
const PAIRS = [
  { a: "tú", aEn: "you", b: "tu", bEn: "your" },
  { a: "él", aEn: "he", b: "el", bEn: "the" },
  { a: "sí", aEn: "yes", b: "si", bEn: "if" },
  { a: "qué", aEn: "what", b: "que", bEn: "that" },
  { a: "está", aEn: "he/she is", b: "esta", bEn: "this" },
];

export default function SpellingPage() {
  const [quiz, setQuiz] = useState<StressWord | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  const nextQuiz = () => {
    let pick = QUIZ[Math.floor(Math.random() * QUIZ.length)];
    // Avoid repeating the same word twice in a row.
    while (quiz && wordOf(pick) === wordOf(quiz)) {
      pick = QUIZ[Math.floor(Math.random() * QUIZ.length)];
    }
    setQuiz(pick);
    setGuess(null);
    sayEs(wordOf(pick));
  };

  const makeGuess = (i: number) => {
    if (!quiz || guess !== null) return;
    setGuess(i);
    setStreak(i === quiz.stress ? streak + 1 : 0);
  };

  // ArrowRight starts the quiz / plays the next word — the same key that
  // means "next" everywhere else. Random draw, so there is no Previous.
  useArrowNav(undefined, nextQuiz);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold">✍️ Accents &amp; Spelling</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Every Spanish word stresses exactly one syllable, and{" "}
          <strong>three rules tell you which</strong> — the accent mark
          isn&apos;t decoration, it&apos;s the third rule. Tap any word to
          hear where the stress lands.
        </p>
      </div>

      <div className="space-y-2">
        {RULES.map((r) => (
          <div
            key={r.rule}
            className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:bg-zinc-900"
          >
            <span className="flex-1 text-sm text-zinc-600 dark:text-zinc-300">
              {r.rule}
            </span>
            <span className="flex shrink-0 gap-2">
              {r.examples.map((ex) => (
                <button
                  key={ex.word}
                  type="button"
                  onClick={() => sayEs(ex.word, 0.7)}
                  className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 active:scale-95 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                >
                  🔊 <span lang="es-MX">{ex.word}</span>
                  <span className="ml-1 text-xs opacity-70">{ex.broken}</span>
                </button>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-xl font-bold">
          One mark, a different word
        </h2>
        <p className="mb-3 text-sm text-zinc-500">
          These pairs sound the same — the accent mark is what tells the
          reader which word you mean.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAIRS.map((p) => (
            <button
              key={p.a}
              type="button"
              onClick={() => sayEs(p.a, 0.7)}
              className="flex items-center justify-between rounded-xl bg-white p-3 text-left shadow-sm transition hover:shadow-md active:scale-[0.99] dark:bg-zinc-900"
            >
              <span>
                <span className="text-lg font-bold text-emerald-600" lang="es-MX">
                  {p.a}
                </span>
                <span className="ml-1 text-xs text-zinc-500">{p.aEn}</span>
              </span>
              <span className="text-zinc-300 dark:text-zinc-600">vs</span>
              <span className="text-right">
                <span className="text-lg font-bold" lang="es-MX">
                  {p.b}
                </span>
                <span className="ml-1 text-xs text-zinc-500">{p.bEn}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="text-lg font-bold">¿Upside-down punctuation?</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Questions and exclamations are wrapped on <em>both</em> ends —{" "}
          <span lang="es-MX">¿Cómo estás?</span> ·{" "}
          <span lang="es-MX">¡Hola!</span> — because Spanish word order
          doesn&apos;t change for a question, the opening mark is the only
          early warning the reader gets.
        </p>
        <button
          type="button"
          onClick={() => sayEs("¿Cómo estás? ¡Muy bien!", 0.75)}
          className="mt-3 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 active:scale-95 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
        >
          🔊 <span lang="es-MX">¿Cómo estás? ¡Muy bien!</span>
        </button>
      </div>

      <div className="rounded-2xl border-2 border-emerald-200 bg-white p-6 dark:border-emerald-900 dark:bg-zinc-900">
        <h2 className="text-xl font-bold">🎧 Find the Stress</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Listen to a word and tap the syllable that carries the stress.
          Hearing it is what makes the accent rules stick.
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
              onClick={() => sayEs(wordOf(quiz))}
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
              {quiz.syllables.map((syl, i) => {
                const isGuess = guess === i;
                const isAnswer = guess !== null && quiz.stress === i;
                return (
                  <button
                    key={`${syl}-${i}`}
                    type="button"
                    onClick={() => makeGuess(i)}
                    disabled={guess !== null}
                    className={`flex-1 rounded-xl border-2 p-3 text-center text-lg font-semibold transition ${
                      isAnswer
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : isGuess
                          ? "border-red-500 bg-red-50 dark:bg-red-950"
                          : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                    lang="es-MX"
                  >
                    {bare(syl)}
                  </button>
                );
              })}
            </div>
            {guess !== null && (
              <p className="mt-3 text-center font-medium">
                {guess === quiz.stress ? (
                  <span className="text-green-600">✅ Correct!</span>
                ) : (
                  <span className="text-red-600">❌ Not quite —</span>
                )}{" "}
                <span className="text-xl" lang="es-MX">
                  {quiz.syllables
                    .map((s, i) => (i === quiz.stress ? s.toUpperCase() : s))
                    .join("-")}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
