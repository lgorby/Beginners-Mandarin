import type { Metadata } from "next";
import MicCheck from "@/components/MicCheck";
import NoiseCheck from "@/components/NoiseCheck";
import RecognitionTest from "@/components/RecognitionTest";

export const metadata: Metadata = { title: "Microphone test" };

export default function MicTestPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">🎤 Microphone &amp; speech test</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Step 1 checks that the browser hears your microphone at all. Step 2
        measures whether your voice stands out from the room&apos;s background
        noise. Step 3 runs the same Mandarin speech recognizer the lessons
        use and logs everything it reports — English is a control: if
        English works but Mandarin fails, the problem is the Mandarin
        recognition service, not your microphone.
      </p>
      <MicCheck />
      <div className="mt-6">
        <NoiseCheck />
      </div>
      <div className="mt-6">
        <RecognitionTest />
      </div>
    </main>
  );
}
