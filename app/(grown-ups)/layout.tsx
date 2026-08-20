import Link from "next/link";
import NavBar from "@/components/NavBar";
import VoicePicker from "@/components/VoicePicker";

/**
 * The only place NavBar renders. The kid path deliberately has no nav —
 * seven equally-weighted destinations are the overwhelm this redesign
 * exists to remove.
 *
 * This is a route group, so none of these pages' URLs change.
 */
export default function GrownUpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
        <Link href="/" className="hover:underline">
          ← Home
        </Link>
        <span className="mx-2">·</span>
        Dictionary data: CC-CEDICT (CC BY-SA 4.0) · Stroke data: Hanzi Writer ·
        Pictures: OpenMoji (CC BY-SA 4.0)
      </footer>
      <VoicePicker />
    </>
  );
}
