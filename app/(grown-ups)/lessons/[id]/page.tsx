import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson, LESSONS, lessonWords } from "@/lib/lessons";
import PagerNav from "@/components/PagerNav";
import WordCard from "@/components/WordCard";
import GentleTonesToggle from "@/components/GentleTonesToggle";
import MicPractice from "@/components/MicPractice";
import SpeakButton from "@/components/SpeakButton";
import PinyinText from "@/components/PinyinText";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }));
}

export default async function LessonPage({
  params,
}: PageProps<"/lessons/[id]">) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();
  const words = lessonWords(lesson);
  const prev = LESSONS.find((l) => l.number === lesson.number - 1);
  const next = LESSONS.find((l) => l.number === lesson.number + 1);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="text-sm font-semibold text-red-600">
          Lesson {lesson.number} of {LESSONS.length}
        </p>
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <p className="text-zinc-500">{lesson.subtitle}</p>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">🆕 New Words</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Tap 🔊 to hear each word, 🐢 for slow speed. Say it out loud after the
          audio — every time.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {words.map((w) => (
            <WordCard key={w.zh} word={w} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">💡 Grammar in 30 Seconds</h2>
        {lesson.grammar.map((g) => (
          <div
            key={g.point}
            className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/40"
          >
            <p className="font-semibold">{g.point}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {g.explanation}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">💬 Sentences</h2>
        <ul className="space-y-3">
          {lesson.sentences.map((s) => (
            <li
              key={s.zh}
              className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <SpeakButton text={s.zh} showSlow />
              <div>
                <div className="text-2xl" lang="zh-CN">
                  {s.zh}
                </div>
                <PinyinText pinyin={s.pinyin} className="text-sm font-medium" />
                <div className="text-sm text-zinc-500">{s.en}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">🎤 Now You Try</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Speak into your microphone — the app checks whether it understood you
          as saying the phrase.
        </p>
        <div className="mb-4">
          <GentleTonesToggle />
        </div>
        <div className="space-y-4">
          {lesson.sentences.slice(0, 2).map((s) => (
            <MicPractice key={s.zh} target={s.zh} pinyin={s.pinyin} en={s.en} />
          ))}
        </div>
      </section>

      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <PagerNav
          prev={
            prev && {
              href: `/lessons/${prev.id}`,
              label: `Lesson ${prev.number}`,
            }
          }
          next={
            next
              ? {
                  href: `/lessons/${next.id}`,
                  label: `Lesson ${next.number}: ${next.title}`,
                }
              : { href: "/flashcards", label: "🎉 Review everything" }
          }
          center={
            <Link href="/lessons" className="hover:underline">
              All lessons
            </Link>
          }
        />
      </div>
    </div>
  );
}
