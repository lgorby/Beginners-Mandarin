"use client";

import { useEffect, useState } from "react";
import { LANGUAGES } from "@/lib/languages";
import {
  getMandarinVoices,
  getPreferredVoiceName,
  guessVoiceGender,
  normTag,
  onVoicesReady,
  setPreferredVoiceName,
  speak,
  voicesFor,
} from "@/lib/speech";

/**
 * Is `voiceLang` one of the wrong-variety tags in `avoid`? Both sides
 * are normalised — an avoid list written with an underscore (e.g.
 * "es_ES") must still match a voice tag that also uses one.
 */
function isWrongVariety(avoid: string[], voiceLang: string): boolean {
  const tag = normTag(voiceLang);
  return avoid.some((t) => normTag(t) === tag);
}

/** Everything about the picker that differs per language. */
const CONFIG = {
  zh: {
    sample: "你好！我是你的中文老师。",
    speechLang: undefined as string | undefined, // speak() defaults to zh-CN
    getVoices: getMandarinVoices,
    selectedClass: "bg-red-600 text-white",
    selectedMetaClass: "text-red-100",
    missing:
      "No Mandarin voices found on this system. Install one in Windows Settings → Time & Language → Language → add Chinese (Simplified) with Speech, then restart the browser.",
    noMale:
      " No male voice found — add Chinese (Simplified) speech in Windows Settings → Time & Language → Language to get Microsoft Kangkang (male), or open the app in Microsoft Edge which bundles many extra voices.",
    // Mandarin has no wrong-variety list: the course teaches Putonghua
    // and every zh voice is a reasonable reading of it.
    avoid: [] as string[],
    avoidBadge: "",
    avoidNote: "",
  },
  es: {
    sample: "¡Hola! Vamos a aprender español.",
    speechLang: LANGUAGES.es.speechLang as string | undefined,
    getVoices: () =>
      voicesFor(
        LANGUAGES.es.speechLang,
        LANGUAGES.es.preferredVoices,
        LANGUAGES.es.wrongVarietyVoices
      ),
    selectedClass: "bg-emerald-600 text-white",
    selectedMetaClass: "text-emerald-100",
    missing:
      "No Spanish voices found on this system. Install one in Windows Settings → Time & Language → Language → add Spanish (Mexico) with Speech, then restart the browser.",
    noMale:
      " No male voice found — add Spanish (Mexico) speech in Windows Settings → Time & Language → Language to get Microsoft Raul (male), or open the app in Microsoft Edge which bundles many extra voices.",
    avoid: LANGUAGES.es.wrongVarietyVoices ?? [],
    avoidBadge: "Spain",
    avoidNote:
      " Voices marked Spain speak Castilian — “gracias” comes out “grathias” — which isn't the American Spanish this course teaches. Picking one changes the audio everywhere, the kids' lessons included.",
  },
};

/**
 * Floating voice chooser (bottom-right on every page). Lists the system's
 * voices for one language with a male/female label, previews each, and
 * persists the choice — all app audio in that language then uses it.
 */
export default function VoicePicker({
  lang = "zh",
}: {
  lang?: keyof typeof CONFIG;
}) {
  const cfg = CONFIG[lang];
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      setVoices(cfg.getVoices());
      setSelected(getPreferredVoiceName(lang));
    };
    load();
    onVoicesReady(load);
  }, [lang, cfg]);

  const choose = (name: string) => {
    setSelected(name);
    setPreferredVoiceName(name, lang);
    speak(cfg.sample, { voiceName: name, lang: cfg.speechLang });
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
            <p className="text-sm text-zinc-500">{cfg.missing}</p>
          ) : (
            <>
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {voices.map((v) => {
                  const gender = guessVoiceGender(v.name);
                  const isSel = (selected ?? voices[0]?.name) === v.name;
                  // Ranked last by voicesFor(), but still selectable — a
                  // grown-up may genuinely want it. Say what it is first.
                  const wrongVariety = isWrongVariety(cfg.avoid, v.lang);
                  return (
                    <li key={v.name}>
                      <button
                        type="button"
                        onClick={() => choose(v.name)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                          isSel
                            ? cfg.selectedClass
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span className="mr-1">
                          {gender === "male" ? "👨" : gender === "female" ? "👩" : "🗣️"}
                        </span>
                        {v.name.replace(/^Microsoft |^Google /, "")}
                        <span
                          className={`ml-1 text-xs ${isSel ? cfg.selectedMetaClass : "text-zinc-400"}`}
                        >
                          {gender ?? ""} {v.lang}
                          {wrongVariety && ` · ⚠ ${cfg.avoidBadge}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-zinc-400">
                Tap a voice to hear a sample. Your choice is used for all app
                audio in this language.
                {!hasMale && cfg.noMale}
                {voices.some((v) => isWrongVariety(cfg.avoid, v.lang)) &&
                  cfg.avoidNote}
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
