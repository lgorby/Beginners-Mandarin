"use client";

import { useState } from "react";
import Panes from "@/components/Panes";
import { speak } from "@/lib/speech";
import { TONE_COLORS, TONE_DESCRIPTIONS } from "@/lib/pinyin";
import { useArrowNav } from "@/lib/useArrowNav";

// The classic "ma" demonstration: same syllable, four meanings.
const MA = [
  { zh: "妈", pinyin: "mā", tone: 1, en: "mom", contour: "‾‾‾" },
  { zh: "麻", pinyin: "má", tone: 2, en: "hemp", contour: "╱" },
  { zh: "马", pinyin: "mǎ", tone: 3, en: "horse", contour: "╲╱" },
  { zh: "骂", pinyin: "mà", tone: 4, en: "to scold", contour: "╲" },
  { zh: "吗", pinyin: "ma", tone: 5, en: "(question particle)", contour: "·" },
];

// Quiz pool: common single-syllable words with distinct tones.
const QUIZ_POOL = [
  { zh: "妈", tone: 1 }, { zh: "喝", tone: 1 }, { zh: "天", tone: 1 }, { zh: "书", tone: 1 },
  { zh: "麻", tone: 2 }, { zh: "茶", tone: 2 }, { zh: "人", tone: 2 }, { zh: "钱", tone: 2 },
  { zh: "马", tone: 3 }, { zh: "水", tone: 3 }, { zh: "好", tone: 3 }, { zh: "狗", tone: 3 },
  { zh: "骂", tone: 4 }, { zh: "大", tone: 4 }, { zh: "四", tone: 4 }, { zh: "爱", tone: 4 },
];

export default function TonesPage() {
  const [quizWord, setQuizWord] = useState<{ zh: string; tone: number } | null>(
    null,
  );
  const [guess, setGuess] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  const nextQuiz = () => {
    let pick = QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
    // Avoid repeating the same word twice in a row.
    while (quizWord && pick.zh === quizWord.zh) {
      pick = QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
    }
    setQuizWord(pick);
    setGuess(null);
    speak(pick.zh, { rate: 0.8 });
  };

  const makeGuess = (t: number) => {
    if (!quizWord || guess !== null) return;
    setGuess(t);
    setStreak(t === quizWord.tone ? streak + 1 : 0);
  };

  // ArrowRight starts the quiz / plays the next word — the same key that
  // means "next" everywhere else. There is no Previous: the quiz draws
  // at random, so there is no history to go back to.
  useArrowNav(undefined, nextQuiz);

  const lesson = (
    <div className="space-y-2">
      <p className="text-sm text-zinc-600 sm:text-base dark:text-zinc-300">
        In Mandarin,{" "}
        <strong>the pitch of your voice changes the meaning of a word</strong>.
        The same syllable &ldquo;ma&rdquo; can mean <em>mom</em>, <em>hemp</em>,{" "}
        <em>horse</em>, or <em>to scold</em> — depending only on the tone. This
        is the single most important thing to learn first. Tap each card to hear
        the difference.
      </p>

      {/* Cards beside the table from lg: up — side by side they cost one
          card's height instead of two blocks' worth. */}
      <div className="grid gap-3 lg:grid-cols-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-3">
        {MA.map((m) => (
          <button
            key={m.zh}
            type="button"
            onClick={() => speak(m.zh, { rate: 0.7 })}
            className="rounded-2xl border border-zinc-200 bg-white p-1.5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className="font-mono text-xl sm:text-2xl"
              style={{ color: TONE_COLORS[m.tone] }}
            >
              {m.contour}
            </div>
            <div className="text-2xl sm:text-4xl" lang="zh-CN">
              {m.zh}
            </div>
            <div
              className="font-semibold sm:text-lg"
              style={{ color: TONE_COLORS[m.tone] }}
            >
              {m.pinyin}
            </div>
            <div className="text-xs text-zinc-500">{m.en}</div>
            <div className="mt-1 text-sm">🔊</div>
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {[1, 2, 3, 4, 5].map((t) => (
          <div
            key={t}
            className="flex items-center gap-3 rounded-xl bg-white p-1.5 shadow-sm sm:p-2 dark:bg-zinc-900"
          >
            <span
              className="w-32 shrink-0 text-sm font-semibold sm:w-40 sm:text-base"
              style={{ color: TONE_COLORS[t] }}
            >
              {TONE_DESCRIPTIONS[t].name}
            </span>
            <span className="text-sm text-zinc-500">
              {TONE_DESCRIPTIONS[t].hint}
            </span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );

  const earTraining = (
    <div className="rounded-2xl border-2 border-red-200 bg-white p-4 sm:p-6 dark:border-red-900 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">
        Listen to a word and guess its tone. Tone hearing is a skill — a few
        minutes a day builds it fast.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={nextQuiz}
          className="rounded-full bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 active:scale-95"
        >
          {quizWord ? "▶ Next word" : "▶ Start quiz"}
        </button>
        {quizWord && (
          <button
            type="button"
            onClick={() => speak(quizWord.zh, { rate: 0.8 })}
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

      {quizWord && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((t) => {
              const isGuess = guess === t;
              const isAnswer = guess !== null && quizWord.tone === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => makeGuess(t)}
                  disabled={guess !== null}
                  className={`flex-1 rounded-xl border-2 p-3 text-center font-semibold transition ${
                    isAnswer
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : isGuess
                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                        : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
                  style={{ color: TONE_COLORS[t] }}
                >
                  Tone {t}
                </button>
              );
            })}
          </div>
          {guess !== null && (
            <p className="mt-3 text-center font-medium">
              {guess === quizWord.tone ? (
                <span className="text-green-600">✅ Correct!</span>
              ) : (
                <span className="text-red-600">
                  ❌ It was tone {quizWord.tone}
                </span>
              )}{" "}
              <span className="text-2xl" lang="zh-CN">
                {quizWord.zh}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Rules-then-quiz stacked is ~1000px of document; panes make each half
  // a screenful. See components/Panes.tsx.
  return (
    <Panes
      title="🎵 The Four Tones"
      panes={[
        { id: "tones", label: "The four tones", content: lesson },
        {
          id: "quiz",
          label: "Train your ear",
          icon: "🎧",
          content: earTraining,
        },
      ]}
    />
  );
}
