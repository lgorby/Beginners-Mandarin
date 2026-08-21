"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LANGUAGES } from "@/lib/languages";
import { PROGRESS_KEY, reloadProgress } from "@/lib/progress";
import { bestVoiceFor, subscribeVoices } from "@/lib/speech";
import { setPinyinVisible } from "@/lib/pinyinPref";
import { setGentleTones } from "@/lib/tonePref";
import { usePinyinVisible } from "./usePinyinVisible";
import { useGentleTones } from "../useGentleTones";
import { useKidLang } from "./useKidLang";
import LangSwitch from "./LangSwitch";

export default function ParentSettings() {
  const [open, setOpen] = useState(false);
  const visible = usePinyinVisible();
  const gentle = useGentleTones("kid");
  const lang = useKidLang();
  const language = LANGUAGES[lang];
  // The tag of the voice speak() would actually use ("" = none at all).
  // Voices load async in some browsers; the voiceschanged subscription
  // re-reads once they arrive. Server renders assume the right voice
  // exists so no warning flashes on a healthy machine.
  const bestVoiceTag = useSyncExternalStore(
    subscribeVoices,
    () =>
      bestVoiceFor(
        language.speechLang,
        language.preferredVoices,
        language.wrongVarietyVoices
      )?.lang.toLowerCase().replace("_", "-") ?? "",
    () => language.speechLang.toLowerCase()
  );
  const voiceInstalled = bestVoiceTag !== "";
  // The best the system has is still a variety this course doesn't teach
  // (a Castilian voice reading the American Spanish course).
  const wrongVariety = Boolean(
    language.wrongVarietyVoices?.some((t) => t.toLowerCase() === bestVoiceTag)
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Settings for grown-ups"
        className="fixed bottom-4 right-4 rounded-full bg-white/90 p-3 text-xl shadow-lg dark:bg-zinc-800/90"
      >
        ⚙️
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-zinc-900">
            <h2 className="text-xl font-bold">For grown-ups</h2>

            <div className="mt-4">
              <span className="block">
                Language
                <span className="block text-sm text-zinc-500">
                  Each language has its own path and its own stars.
                </span>
              </span>
              <div className="mt-2">
                <LangSwitch />
              </div>
            </div>

            {language.voicePack && !voiceInstalled && (
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                🔇 No {language.name} voice is installed, so a stand-in
                voice reads the words — they will sound wrong until one is
                added. In Windows: Settings → Time &amp; Language → Speech
                → Add voices → <strong>{language.voicePack}</strong>, then
                restart the browser.
              </p>
            )}

            {language.voicePack && voiceInstalled && wrongVariety && (
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                🗣️ Only a European {language.name} voice is installed, so
                words sound Castilian (&ldquo;gracias&rdquo; like
                &ldquo;grathias&rdquo;) — this course teaches Latin
                American {language.name}. In Windows: Settings → Time
                &amp; Language → Speech → Add voices →{" "}
                <strong>{language.voicePack}</strong>, then restart the
                browser.
              </p>
            )}

            {lang === "zh" && (
              <>
                <label className="mt-4 flex items-center justify-between gap-4">
                  <span>
                    Show pinyin
                    <span className="block text-sm text-zinc-500">
                      Off by default — young children read the picture, not the
                      spelling.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setPinyinVisible(e.target.checked)}
                    className="h-6 w-6"
                  />
                </label>

                <label className="mt-4 flex items-center justify-between gap-4">
                  <span>
                    Gentle tones
                    <span className="block text-sm text-zinc-500">
                      On by default — young children earn the win with the
                      right sounds, and tones are coached playfully. Turn off
                      to require correct tones for a &quot;Perfect&quot;.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={gentle}
                    onChange={(e) => setGentleTones("kid", e.target.checked)}
                    className="h-6 w-6"
                  />
                </label>

                <Link
                  href="/grown-ups"
                  className="mt-4 block rounded-2xl bg-zinc-100 px-4 py-3 text-center font-semibold dark:bg-zinc-800"
                >
                  Tones, dictionary, writing &amp; more →
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                if (!confirm("Erase all stars (every language) and start over?"))
                  return;
                localStorage.removeItem(PROGRESS_KEY);
                reloadProgress(); // drop the cached snapshot; the map re-renders
                setOpen(false);
              }}
              className="mt-3 w-full rounded-2xl px-4 py-3 text-sm text-red-600"
            >
              Reset progress
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded-2xl bg-red-600 px-4 py-3 font-bold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
