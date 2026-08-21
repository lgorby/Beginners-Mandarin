"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LANGUAGES } from "@/lib/languages";
import { PROGRESS_KEY, reloadProgress } from "@/lib/progress";
import {
  effectiveVoiceFor,
  normTag,
  rankedVoiceTag,
  subscribeVoices,
  voiceWarningKind,
} from "@/lib/speech";
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
  // The tag of the voice speak() would actually use ("" = none at all),
  // the grown-up's saved choice included — a warning computed from the
  // automatic ranking alone said "es-MX" while the app spoke es-ES.
  // Voices load async in some browsers; the voiceschanged subscription
  // re-reads once they arrive. Server renders assume the right voice
  // exists so no warning flashes on a healthy machine.
  const voiceTag = useSyncExternalStore(
    subscribeVoices,
    () => {
      const v = effectiveVoiceFor(
        language.speechLang,
        language.preferredVoices,
        language.wrongVarietyVoices
      );
      return v ? normTag(v.lang) : "";
    },
    () => language.speechLang.toLowerCase()
  );
  const voiceInstalled = voiceTag !== "";
  // The best-ranked voice for this language, blind to any saved
  // preference — diffed against voiceTag below to tell "nothing better
  // is installed" apart from "a grown-up picked the wrong one on
  // purpose" in the voice picker.
  const rankedTag = useSyncExternalStore(
    subscribeVoices,
    () =>
      rankedVoiceTag(
        language.speechLang,
        language.preferredVoices,
        language.wrongVarietyVoices
      ),
    () => language.speechLang.toLowerCase()
  );
  // Which wrong-variety warning (if any) to show. Installing a voice
  // pack can't fix a case where a grown-up's saved choice overrode a
  // ranking that would have picked correctly — the two need different
  // remedies, so the settings warning has to tell them apart.
  const voiceWarning = voiceWarningKind(
    voiceTag,
    rankedTag,
    language.wrongVarietyVoices ?? []
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

            {language.voicePack && voiceWarning === "install" && (
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

            {language.voicePack && voiceWarning === "picker" && (
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                🗣️ The {language.name} voice chosen in the Voice picker is
                a European one, so words sound Castilian
                (&ldquo;gracias&rdquo; like &ldquo;grathias&rdquo;) — this
                course teaches Latin American {language.name}. The Voice
                picker sits bottom-right on the grown-up pages (
                <Link href={language.grownUpsPath} className="underline">
                  open them below
                </Link>
                ) — choose a different voice there to fix it everywhere,
                the kids&apos; lessons included.
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
              </>
            )}

            <Link
              href={language.grownUpsPath}
              className="mt-4 block rounded-2xl bg-zinc-100 px-4 py-3 text-center font-semibold dark:bg-zinc-800"
            >
              {language.grownUpsLabel}
            </Link>

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
