"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/tones", label: "Tones", icon: "🎵" },
  { href: "/lessons", label: "Lessons", icon: "📚" },
  { href: "/dictionary", label: "Dictionary", icon: "🔎" },
  { href: "/practice", label: "Speak", icon: "🎤" },
  { href: "/strokes", label: "Strokes", icon: "🖌️" },
  { href: "/characters", label: "Write", icon: "✍️" },
  { href: "/flashcards", label: "Review", icon: "🃏" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="z-50 shrink-0 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-2">
        <Link
          href="/"
          className="mr-3 flex shrink-0 items-center gap-2 font-bold"
        >
          <span className="text-xl">🐉</span>
          <span className="hidden sm:inline">
            你好<span className="text-red-600">Mandarin</span>
          </span>
        </Link>
        {LINKS.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-red-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="mr-1">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
