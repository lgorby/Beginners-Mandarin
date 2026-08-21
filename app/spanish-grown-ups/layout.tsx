import Link from "next/link";
import SpanishNavBar from "@/components/SpanishNavBar";
import VoicePicker from "@/components/VoicePicker";

/**
 * The Spanish twin of the (grown-ups) layout: same chrome — navbar,
 * centered main column, attribution footer, voice chooser — with the
 * Spanish navbar and Spanish voices. Sits outside the (grown-ups) route
 * group on purpose: that group's layout renders the Mandarin-only NavBar
 * and VoicePicker.
 */
export default function SpanishGrownUpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SpanishNavBar />
      <main className="mx-auto w-full min-h-0 max-w-5xl flex-1 overflow-y-auto px-4 py-3 sm:py-6">
        {children}
      </main>
      <footer className="flex shrink-0 items-center gap-2 border-t border-zinc-200 px-4 py-2 text-xs text-zinc-400 dark:border-zinc-800">
        <Link href="/" className="shrink-0 hover:underline">
          ← Home
        </Link>
        <span className="hidden min-w-0 flex-1 truncate lg:inline">
          Dictionary data: WikDict (CC BY-SA) · Pictures: OpenMoji (CC BY-SA
          4.0)
        </span>
        <span className="ml-auto shrink-0">
          <VoicePicker lang="es" />
        </span>
      </footer>
    </>
  );
}
