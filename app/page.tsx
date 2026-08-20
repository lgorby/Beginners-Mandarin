import Link from "next/link";
import { LESSONS } from "@/lib/curriculum";

// Placeholder: replaced by the star path once StarPath lands. It exists
// so the app builds and runs after every task.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-3xl font-bold">🐉 Learn Mandarin</h1>
      <ul className="mt-6 space-y-2">
        {LESSONS.map((l) => (
          <li key={l.id}>
            <Link href={`/learn/${l.id}`} className="hover:underline">
              {l.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/grown-ups"
        className="mt-8 inline-block text-sm text-zinc-500 hover:underline"
      >
        For grown-ups →
      </Link>
    </main>
  );
}
