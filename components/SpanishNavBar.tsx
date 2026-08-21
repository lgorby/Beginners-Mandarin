"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setKidLang } from "@/lib/langPref";
import { SPANISH_SECTIONS } from "@/lib/spanishSections";

/**
 * NavBar's Spanish twin: same sticky bar and pill buttons, emerald
 * accent. Lessons is the one live destination (the kid path already
 * teaches Spanish, so the link pins the language first); the other
 * sections lead to their coming-soon pages.
 */

const LINKS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/spanish-grown-ups/sounds", ...pick("sounds") },
  { href: "/learn", label: "Lessons", icon: "📚", pinLang: true },
  { href: "/spanish-grown-ups/dictionary", ...pick("dictionary") },
  { href: "/spanish-grown-ups/practice", ...pick("practice") },
  { href: "/spanish-grown-ups/spelling", ...pick("spelling") },
  { href: "/spanish-grown-ups/flashcards", ...pick("flashcards") },
];

function pick(slug: keyof typeof SPANISH_SECTIONS) {
  const { label, icon } = SPANISH_SECTIONS[slug];
  return { label, icon };
}

export default function SpanishNavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-2">
        <Link
          href="/spanish-grown-ups"
          className="mr-3 flex shrink-0 items-center gap-2 font-bold"
        >
          <span className="text-xl">🦜</span>
          <span className="hidden sm:inline">
            ¡Hola!<span className="text-emerald-600">Spanish</span>
          </span>
        </Link>
        {LINKS.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={l.pinLang ? () => setKidLang("es") : undefined}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white"
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
