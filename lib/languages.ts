// The languages the kid path can teach. SSOT for everything that varies
// by language EXCEPT the course content itself (lib/courses/*) — speech
// tags, how word tiles join into a sentence, and chooser labels.
//
// Adding a language means: an entry here, a course in lib/courses/, and
// pictures. Nothing in the step engine or the components changes.

export type LangCode = "zh" | "es";

export interface Language {
  code: LangCode;
  /** English name, shown to the grown-up. */
  name: string;
  /** The language's own name, shown on the chooser. */
  nativeName: string;
  flag: string;
  /** BCP-47 tag for text-to-speech and the html lang attribute. */
  speechLang: string;
  /** BCP-47 tag the speech recognizer listens in. */
  recognitionLang: string;
  /** What separates word tiles when a sentence is spoken or scored. */
  joiner: string;
  /**
   * Wraps a spoken sentence that asks a question. Spanish marks a
   * question by intonation alone, so the TTS needs ¿…? to rise;
   * Mandarin's question is the word 吗 and needs nothing.
   */
  wrapQuestion?: (s: string) => string;
  /**
   * The Windows voice pack that provides this language's TTS voice,
   * named in the missing-voice notice. Mandarin omits it — the grown-up
   * VoicePicker owns that message.
   */
  voicePack?: string;
}

export const LANGUAGES: Record<LangCode, Language> = {
  zh: {
    code: "zh",
    name: "Mandarin",
    nativeName: "中文",
    flag: "🇨🇳",
    speechLang: "zh-CN",
    recognitionLang: "zh-CN",
    joiner: "",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇲🇽",
    // American (Latin American) Spanish voices and recognition.
    speechLang: "es-MX",
    recognitionLang: "es-MX",
    joiner: " ",
    wrapQuestion: (s) => `¿${s}?`,
    voicePack: "Spanish (Mexico)",
  },
};

export const LANG_CODES = Object.keys(LANGUAGES) as LangCode[];

export function isLangCode(v: unknown): v is LangCode {
  return typeof v === "string" && v in LANGUAGES;
}
