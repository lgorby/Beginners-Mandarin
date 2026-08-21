"use client";

import { LANGUAGES, LANG_CODES } from "@/lib/languages";
import { setKidLang } from "@/lib/langPref";
import { useKidLang } from "./useKidLang";

/**
 * The language chooser: one chip per course. The ONLY component that
 * switches the kid path's language, shared by the front door and the
 * grown-up settings so they cannot drift apart.
 */
export default function LangSwitch() {
  const active = useKidLang();

  return (
    <div
      role="group"
      aria-label="Choose a language to learn"
      className="flex justify-center gap-2"
    >
      {LANG_CODES.map((code) => {
        const language = LANGUAGES[code];
        const selected = code === active;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            onClick={() => setKidLang(code)}
            className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 font-semibold transition active:scale-95 ${
              selected
                ? "border-red-600 bg-red-600 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            <span aria-hidden>{language.flag}</span>
            <span lang={language.speechLang}>{language.nativeName}</span>
          </button>
        );
      })}
    </div>
  );
}
