import type { Metadata } from "next";
import MicCheck from "@/components/MicCheck";
import NoiseCheck from "@/components/NoiseCheck";
import Paged from "@/components/Paged";
import RecognitionTest from "@/components/RecognitionTest";

export const metadata: Metadata = { title: "Microphone test" };

export default function MicTestPage() {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Paged className="min-h-0 flex-1">
      <div>
      <h1 className="mb-2 text-2xl font-bold">
        🎤 Microphone &amp; speech test
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Step 1 checks that the browser hears your microphone at all. Step 2
        measures whether your voice stands out from the room&apos;s background
        noise. Step 3 runs the same Mandarin speech recognizer the lessons use
        and logs everything it reports — English is a control: if English works
        but Mandarin fails, the problem is the Mandarin recognition service, not
        your microphone.
      </p>
      <MicCheck />
      <div className="mt-6">
        <NoiseCheck />
      </div>
      <div className="mt-6">
        <RecognitionTest />
      </div>
      </div>
      </Paged>
    </main>
  );
}
