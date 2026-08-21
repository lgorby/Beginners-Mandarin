import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson, LESSONS, lessonWords } from "@/lib/lessons";
import PagerNav from "@/components/PagerNav";
import Panes from "@/components/Panes";
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

  const newWords = (
    <section>
      <p className="compact-hide mb-3 text-sm text-zinc-500">
        {lesson.subtitle} · Tap 🔊 to hear each word, 🐢 for slow speed. Say it
        out loud after the audio — every time.
      </p>
      {/* xl fits six across, so a six-word lesson is one row on a laptop —
          rows are what a 640px-tall viewport cannot afford. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
        {words.map((w) => (
          <WordCard key={w.zh} word={w} />
        ))}
      </div>
    </section>
  );

  const grammar = (
    <section className="space-y-3">
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
  );

  const sentences = (
    <ul className="space-y-2">
      {lesson.sentences.map((s) => (
        <li
          key={s.zh}
          className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900"
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
  );

  const practice = (
    <section>
      <p className="compact-hide mb-3 text-sm text-zinc-500">
        Speak into your microphone — the app checks whether it understood you as
        saying the phrase.
      </p>
      <div className="mb-3">
        <GentleTonesToggle />
      </div>
      <div className="space-y-4">
        {lesson.sentences.slice(0, 2).map((s) => (
          <MicPractice key={s.zh} target={s.zh} pinyin={s.pinyin} en={s.en} />
        ))}
      </div>
    </section>
  );

  return (
    <Panes
      title={`${lesson.number} · ${lesson.title}`}
      panes={[
        { id: "words", label: "New words", icon: "🆕", content: newWords },
        { id: "grammar", label: "Grammar", icon: "💡", content: grammar },
        { id: "sentences", label: "Sentences", icon: "💬", content: sentences },
        { id: "practice", label: "Now you try", icon: "🎤", content: practice },
      ]}
      // Lesson-to-lesson navigation must stay reachable whichever pane
      // is open, so it is a rail rather than the end of a scroll.
      footer={
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
      }
    />
  );
}
