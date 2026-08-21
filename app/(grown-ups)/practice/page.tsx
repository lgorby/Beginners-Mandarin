"use client";

import { useState } from "react";
import GentleTonesToggle from "@/components/GentleTonesToggle";
import MicCheck from "@/components/MicCheck";
import MicPractice from "@/components/MicPractice";
import PagerNav from "@/components/PagerNav";
import { LESSONS } from "@/lib/lessons";
import { toDiacritics } from "@/lib/pinyin";
import { VOCAB } from "@/lib/vocab";

type Mode = "words" | "sentences";

export default function PracticePage() {
  const [mode, setMode] = useState<Mode>("words");
  const [index, setIndex] = useState(0);

  const wordItems = VOCAB.map((w) => ({
    zh: w.zh,
    pinyin: w.pinyin,
    en: `${w.emoji} ${w.en}`,
  }));
  const sentenceItems = LESSONS.flatMap((l) => l.sentences);
  const items = mode === "words" ? wordItems : sentenceItems;
  const item = items[index % items.length];

  const switchMode = (m: Mode) => {
    setMode(m);
    setIndex(0);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎤 Speaking Practice</h1>
        <p className="mt-1 text-zinc-500">
          Listen, then say it into your microphone. Scored practice
          (&ldquo;Say it!&rdquo;) uses the browser&apos;s Mandarin speech
          recognizer — <strong>Google Chrome works best</strong> and it needs
          internet. Record &amp; Compare works in any browser, offline.
        </p>
      </div>

      <MicCheck />

      <div className="flex gap-2">
        {(["words", "sentences"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === m
                ? "bg-red-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {m === "words" ? "Single words" : "Full sentences"}
          </button>
        ))}
      </div>

      <GentleTonesToggle />

      <MicPractice
        key={`${mode}-${index}`}
        target={item.zh}
        pinyin={item.pinyin}
        en={item.en}
        retryKey
      />

      <PagerNav
        prev={{
          onClick: () => setIndex((i) => (i - 1 + items.length) % items.length),
        }}
        next={{ onClick: () => setIndex((i) => (i + 1) % items.length) }}
        center={`${(index % items.length) + 1} / ${items.length}`}
      />

      <p className="text-xs text-zinc-400">
        Tip: if your score is low, play 🐢 slow mode and copy the tone shape —
        pitch matters more than speed. Target pinyin:{" "}
        {toDiacritics(item.pinyin)}
      </p>
    </div>
  );
}
