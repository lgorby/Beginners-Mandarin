import Link from "next/link";
import { LESSONS } from "@/lib/lessons";

export default function LessonsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">📚 Lessons</h1>
      <p className="mt-1 text-zinc-500">
        Ten bite-size lessons. Each one teaches a handful of words with audio,
        one grammar idea, and sentences you can practice speaking.
      </p>
      <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
        New here? Do the{" "}
        <Link href="/tones" className="font-semibold underline">
          tone trainer
        </Link>{" "}
        first — everything builds on it.
      </p>
      <ol className="mt-6 space-y-3">
        {LESSONS.map((l) => (
          <li key={l.id}>
            <Link
              href={`/lessons/${l.id}`}
              className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 font-bold text-white">
                {l.number}
              </span>
              <span>
                <span className="block font-semibold">{l.title}</span>
                <span className="block text-sm text-zinc-500">
                  {l.subtitle} · {l.words.length} words
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
