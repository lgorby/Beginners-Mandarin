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
    ["你好", "谢谢", "猫", "茶"].includes(w.zh)
  );
  return (
    <div className="space-y-12">
      <section className="text-center">
        <div className="text-6xl">🐉</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Learn Mandarin <span className="text-red-600">from zero</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-600 dark:text-zinc-300">
          Hear every word spoken aloud, practice with your microphone, learn the
          four tones, and write real characters — all in your browser, free.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/tones"
            className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Start with Tones →
          </Link>
          <Link
            href="/dictionary"
            className="rounded-full border border-zinc-300 px-6 py-3 font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Try the Dictionary
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-3xl">{f.icon}</div>
            <h2 className="mt-2 font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {f.desc}
            </p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-center text-xl font-bold">
          Tap 🔊 to hear your first words
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {preview.map((w) => (
            <WordCard key={w.zh} word={w} />
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-zinc-500">
          {VOCAB.length} beginner words across {LESSONS.length} lessons — plus a
          full 120,000-entry dictionary.
        </p>
      </section>
    </div>
  );
}
