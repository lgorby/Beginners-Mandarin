import Link from "next/link";
import SpanishNavBar from "@/components/SpanishNavBar";
import VoicePicker from "@/components/VoicePicker";

/**
 * The Spanish twin of the (grown-ups) layout: same chrome — sticky
 * navbar, centered main column, attribution footer, floating voice
 * chooser — with the Spanish navbar and Spanish voices. Sits outside
 * the (grown-ups) route group on purpose: that group's layout renders
 * the Mandarin-only NavBar and VoicePicker.
 */
export default function SpanishGrownUpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SpanishNavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
        <Link href="/" className="hover:underline">
          ← Home
        </Link>
        <span className="mx-2">·</span>
        Dictionary data: WikDict (CC BY-SA) · Pictures: OpenMoji (CC BY-SA 4.0)
      </footer>
      <VoicePicker lang="es" />
    </>
  );
}
