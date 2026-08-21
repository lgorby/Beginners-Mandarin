import Link from "next/link";
import NavBar from "@/components/NavBar";
import VoicePicker from "@/components/VoicePicker";

/**
 * The only place NavBar renders. The kid path deliberately has no nav —
 * seven equally-weighted destinations are the overwhelm this redesign
 * exists to remove.
 *
 * This is a route group, so none of these pages' URLs change.
 *
 * The shell is exactly one viewport tall (see app/layout.tsx): navbar
 * and footer are fixed-height rails, and <main> is the single scroll
 * region. A page that fits — most do, now that the long ones page
 * themselves with components/Panes.tsx — never scrolls at all.
 */
export default function GrownUpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <main className="mx-auto w-full min-h-0 max-w-5xl flex-1 overflow-y-auto px-4 py-3 sm:py-6">
        {children}
      </main>
      <footer className="flex shrink-0 items-center gap-2 border-t border-zinc-200 px-4 py-2 text-xs text-zinc-400 dark:border-zinc-800">
        <Link href="/" className="shrink-0 hover:underline">
          ← Home
        </Link>
        <span className="hidden min-w-0 flex-1 truncate lg:inline">
          Dictionary data: CC-CEDICT (CC BY-SA 4.0) · Stroke data: Hanzi Writer
          · Pictures: OpenMoji (CC BY-SA 4.0)
        </span>
        <span className="ml-auto shrink-0">
          <VoicePicker />
        </span>
      </footer>
    </>
  );
}
