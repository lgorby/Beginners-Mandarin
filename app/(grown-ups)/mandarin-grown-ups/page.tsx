import Link from "next/link";
import { LESSONS } from "@/lib/lessons";
import { VOCAB } from "@/lib/vocab";
import WordCard from "@/components/WordCard";

const FEATURES = [
  {
    href: "/tones",
    icon: "🎵",
    title: "1 · Master the Tones",
    desc: "Mandarin has 4 tones — start here. Hear each tone, then test your ear.",
  },
  {
    href: "/lessons",
    icon: "📚",
    title: "2 · Take the Lessons",
    desc: "Ten bite-size lessons: greetings, numbers, family, food, and more.",
  },
  {
    href: "/practice",
    icon: "🎤",
    title: "3 · Speak Out Loud",
    desc: "Use your microphone — the app listens and checks your pronunciation.",
  },
  {
    href: "/strokes",
    icon: "🖌️",
    title: "4 · What the Lines Mean",
    desc: "The 8 basic strokes, stroke-order rules, and the radicals that carry meaning.",
  },
  {
    href: "/characters",
    icon: "✍️",
    title: "5 · Write Characters",
    desc: "Watch animated stroke order, then trace each character yourself.",
  },
  {
    href: "/dictionary",
    icon: "🔎",
    title: "Talking Dictionary",
    desc: "Type any English word — get the Mandarin, pinyin, and spoken audio from 120,000+ entries.",
  },
  {
    href: "/flashcards",
    icon: "🃏",
    title: "Review Flashcards",
    desc: "Spaced-repetition review so what you learn actually sticks.",
  },
];

export default function Home() {
  const preview = VOCAB.filter((w) =>
    ["你好", "谢谢", "猫", "茶"].includes(w.zh),
  );
  return (
    // A hub of seven cards plus a hero: the hero shrinks hard on short
    // screens so the cards — the reason to be here — stay above the fold.
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
      <section className="shrink-0 text-center">
        <div className="text-3xl sm:text-6xl">🐉</div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:mt-3 sm:text-4xl">
          Learn Mandarin <span className="text-red-600">from zero</span>
        </h1>
        <p className="short-hide mx-auto mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
          Hear every word spoken aloud, practice with your microphone, learn the
          four tones, and write real characters — all in your browser, free.
        </p>
        <div className="mt-3 flex justify-center gap-3 sm:mt-4">
          <Link
            href="/tones"
            className="rounded-full bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-700 sm:px-6 sm:py-3"
          >
            Start with Tones →
          </Link>
          <Link
            href="/dictionary"
            className="rounded-full border border-zinc-300 px-5 py-2 font-semibold transition hover:bg-zinc-100 sm:px-6 sm:py-3 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Try the Dictionary
          </Link>
        </div>
      </section>

      <section className="grid shrink-0 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-2xl">{f.icon}</div>
            <h2 className="mt-1 text-sm font-semibold">{f.title}</h2>
            <p className="short-hide mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {f.desc}
            </p>
          </Link>
        ))}
      </section>

      <section className="compact-hide shrink-0">
        <h2 className="mb-2 text-center font-bold sm:text-xl">
          Tap 🔊 to hear your first words
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {preview.map((w) => (
            <WordCard key={w.zh} word={w} />
          ))}
        </div>
        <p className="mt-2 text-center text-sm text-zinc-500">
          {VOCAB.length} beginner words across {LESSONS.length} lessons — plus a
          full 120,000-entry dictionary.
        </p>
      </section>
    </div>
  );
}
