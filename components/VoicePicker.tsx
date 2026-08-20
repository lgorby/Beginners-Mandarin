"use client";

import { useEffect, useState } from "react";
import {
  getMandarinVoices,
  getPreferredVoiceName,
  guessVoiceGender,
  onVoicesReady,
  setPreferredVoiceName,
  speak,
} from "@/lib/speech";

const SAMPLE = "你好！我是你的中文老师。";

/**
 * Floating voice chooser (bottom-right on every page). Lists the system's
 * Mandarin voices with a male/female label, previews each, and persists the
 * choice — all app audio then uses it.
 */
export default function VoicePicker() {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      setVoices(getMandarinVoices());
      setSelected(getPreferredVoiceName());
    };
    load();
    onVoicesReady(load);
  }, []);

  const choose = (name: string) => {
    setSelected(name);
    setPreferredVoiceName(name);
    speak(SAMPLE, { voiceName: name });
  };

  const current = voices.find((v) => v.name === selected) ?? voices[0];
  const currentGender = current ? guessVoiceGender(current.name) : null;
  const hasMale = voices.some((v) => guessVoiceGender(v.name) === "male");

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-80 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">Choose a voice</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close voice picker"
              className="rounded-full px-2 text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          </div>
          {voices.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No Mandarin voices found on this system. Install one in Windows
              Settings → Time &amp; Language → Language → add Chinese
              (Simplified) with Speech, then restart the browser.
            </p>
          ) : (
            <>
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {voices.map((v) => {
                  const gender = guessVoiceGender(v.name);
                  const isSel = (selected ?? voices[0]?.name) === v.name;
                  return (
                    <li key={v.name}>
                      <button
                        type="button"
                        onClick={() => choose(v.name)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                          isSel
                            ? "bg-red-600 text-white"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span className="mr-1">
                          {gender === "male" ? "👨" : gender === "female" ? "👩" : "🗣️"}
                        </span>
                        {v.name.replace(/^Microsoft |^Google /, "")}
                        <span
                          className={`ml-1 text-xs ${isSel ? "text-red-100" : "text-zinc-400"}`}
                        >
                          {gender ?? ""} {v.lang}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-zinc-400">
                Tap a voice to hear a sample. Your choice is used for all audio
                in the app.
                {!hasMale &&
                  " No male voice found — add Chinese (Simplified) speech in Windows Settings → Time & Language → Language to get Microsoft Kangkang (male), or open the app in Microsoft Edge which bundles many extra voices."}
              </p>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-lg transition hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        aria-label="Voice settings"
      >
        {currentGender === "male" ? "👨" : currentGender === "female" ? "👩" : "🗣️"}{" "}
        Voice
      </button>
    </div>
  );
}
