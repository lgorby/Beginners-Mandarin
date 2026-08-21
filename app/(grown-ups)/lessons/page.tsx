import Link from "next/link";
import { LESSONS } from "@/lib/lessons";
import Paged from "@/components/Paged";

export default function LessonsPage() {
  return (
    // Ten lessons is a list, not a screenful: the heading stays put and
    // only the list pages, so the page itself never moves.
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-2">
      <div className="shrink-0">
        <h1 className="text-xl font-bold sm:text-3xl">📚 Lessons</h1>
        <p className="compact-hide mt-1 text-sm text-zinc-500">
          Ten bite-size lessons. Each one teaches a handful of words with audio,
          one grammar idea, and sentences you can practice speaking.
        </p>
        <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
          New here? Do the{" "}
          <Link href="/tones" className="font-semibold underline">
            tone trainer
          </Link>{" "}
          first — everything builds on it.
        </p>
      </div>
      <Paged className="min-h-0 flex-1">
      <ol className="grid auto-rows-min gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {LESSONS.map((l) => (
          <li key={l.id}>
            <Link
              href={`/lessons/${l.id}`}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:gap-4 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900"
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
      </Paged>
    </div>
  );
}
