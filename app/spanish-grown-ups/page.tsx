"use client";

import Link from "next/link";
import { getWord, lessonsFor, type Word } from "@/lib/curriculum";
import { LANGUAGES } from "@/lib/languages";
import { setKidLang } from "@/lib/langPref";
import { SPANISH_SECTIONS } from "@/lib/spanishSections";
import SpeakButton from "@/components/SpeakButton";

/**
 * The grown-up landing page for Spanish — the same shape as
 * /mandarin-grown-ups. The lessons are live today (the kid path teaches
 * Spanish); the other tools link to their coming-soon pages, sourced
 * from SPANISH_SECTIONS so the cards and the navbar always agree.
 */

const es = LANGUAGES.es;

interface Feature {
  href: string;
  icon: string;
  title: string;
  desc: string;
  /** Pin the learning language to Spanish before following the link. */
  pinLang?: boolean;
}

const sec = SPANISH_SECTIONS;
const FEATURES: Feature[] = [
  {
    href: "/spanish-grown-ups/sounds",
    icon: sec.sounds.icon,
    title: `1 · ${sec.sounds.title}`,
    desc: sec.sounds.desc,
  },
  {
    href: "/learn",
    icon: "📚",
    title: "2 · Take the Lessons",
    desc: "Ten bite-size lessons that build pictured words into spoken sentences.",
    pinLang: true,
  },
  {
    href: "/spanish-grown-ups/practice",
    icon: sec.practice.icon,
    title: `3 · ${sec.practice.title}`,
    desc: sec.practice.desc,
  },
  {
    href: "/spanish-grown-ups/spelling",
    icon: sec.spelling.icon,
    title: `4 · ${sec.spelling.title}`,
    desc: sec.spelling.desc,
  },
  {
    href: "/spanish-grown-ups/dictionary",
    icon: sec.dictionary.icon,
    title: sec.dictionary.title,
    desc: sec.dictionary.desc,
  },
  {
    href: "/spanish-grown-ups/flashcards",
    icon: sec.flashcards.icon,
    title: sec.flashcards.title,
    desc: sec.flashcards.desc,
  },
];

function EsWordCard({ word }: { word: Word }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-4xl">{word.emoji}</div>
      <div className="text-2xl font-semibold" lang={es.speechLang}>
        {word.text}
      </div>
      <div className="text-sm text-zinc-500">{word.en}</div>
      <SpeakButton
        text={word.text}
        size="sm"
        showSlow
        lang={es.speechLang}
        voicePrefer={es.preferredVoices}
        voiceAvoid={es.wrongVarietyVoices}
      />
    </div>
  );
}

export default function SpanishGrownUps() {
  const lessons = lessonsFor("es");
  const preview = ["hola", "gracias", "gato", "agua"].map(getWord);
  const wordCount = lessons.reduce((n, l) => n + l.newWords.length, 0);

  return (
    <div className="space-y-12">
      <section className="text-center">
        <div className="text-6xl">🦜</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Learn Spanish <span className="text-emerald-600">from zero</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-600 dark:text-zinc-300">
          Hear every word spoken aloud, practice with your microphone, and
          build real Latin American Spanish sentences — all in your browser,
          free.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/learn"
            onClick={() => setKidLang("es")}
            className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Start the Lessons →
          </Link>
          <Link
            href="/spanish-grown-ups/dictionary"
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
            onClick={f.pinLang ? () => setKidLang("es") : undefined}
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
            <EsWordCard key={w.text} word={w} />
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-zinc-500">
          {wordCount} beginner words across {lessons.length} lessons — with
          more grown-up tools on the way.
        </p>
      </section>
    </div>
  );
}
