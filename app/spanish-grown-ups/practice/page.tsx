"use client";

import { useState } from "react";
import MicCheck from "@/components/MicCheck";
import MicPractice from "@/components/MicPractice";
import PagerNav from "@/components/PagerNav";
import { WORDS, lessonsFor, sentenceText } from "@/lib/curriculum";

type Mode = "words" | "sentences";

// The Mandarin practice page's twin, fed by the Spanish course: its
// words, and every sentence the lesson ladder builds.
const wordItems = Object.values(WORDS)
  .filter((w) => w.lang === "es")
  .map((w) => ({ text: w.text, en: `${w.emoji} ${w.en}` }));

const sentenceItems = lessonsFor("es")
  .flatMap((l) => [l.build, ...l.swaps])
  .map((s) => ({
    text: sentenceText(s.words, { question: s.en.endsWith("?") }),
    en: s.en,
  }));

export default function SpanishPracticePage() {
  const [mode, setMode] = useState<Mode>("words");
  const [index, setIndex] = useState(0);

  const items = mode === "words" ? wordItems : sentenceItems;
  const item = items[index % items.length];

  const switchMode = (m: Mode) => {
    setMode(m);
    setIndex(0);
  };

  return (
    // Same shape as the Mandarin practice page.
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-2">
      <div className="shrink-0">
        <h1 className="text-xl font-bold sm:text-3xl">🎤 Speaking Practice</h1>
        <p className="compact-hide mt-1 text-sm text-zinc-500">
          Listen, then say it into your microphone. Scored practice (&ldquo;Say
          it!&rdquo;) uses the browser&apos;s Spanish speech recognizer —{" "}
          <strong>Google Chrome works best</strong> and it needs internet.
          Record &amp; Compare works in any browser, offline.
        </p>
      </div>

      <div className="shrink-0">
        <MicCheck />
      </div>

      <div className="flex shrink-0 gap-2">
        {(["words", "sentences"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === m
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {m === "words" ? "Single words" : "Full sentences"}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <MicPractice
          key={`${mode}-${index}`}
          target={item.text}
          en={item.en}
          lang="es"
          retryKey
        />
      </div>

      <div className="shrink-0">
        <PagerNav
          prev={{
            onClick: () =>
              setIndex((i) => (i - 1 + items.length) % items.length),
          }}
          next={{ onClick: () => setIndex((i) => (i + 1) % items.length) }}
          center={`${(index % items.length) + 1} / ${items.length}`}
        />
      </div>

      <p className="compact-hide shrink-0 text-xs text-zinc-400">
        Tip: if your score is low, play 🐢 slow mode and copy it — keep the
        vowels short and pure, and don&apos;t rush the rolled r.
      </p>
    </div>
  );
}
