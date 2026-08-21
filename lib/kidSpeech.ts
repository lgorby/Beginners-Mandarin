"use client";

// The kid path's only way to speak course content. Binds a word ref to
// its language's voice via the curriculum, so no step component ever
// joins words or picks a language itself.

import { getWord, languageOf, sentenceText } from "./curriculum";
import { speak } from "./speech";

export function speakWord(
  text: string,
  opts?: { onDone?: () => void }
): void {
  speak(text, { ...opts, lang: languageOf([text]).speechLang });
}

/**
 * Speak a sentence of word refs. `question` (derived from the English
 * gloss ending in "?") lets a language that asks by intonation wrap the
 * text so the TTS actually rises — Spanish ¿…?, nothing for Mandarin.
 */
export function speakSentence(
  words: string[],
  opts?: { question?: boolean; onDone?: () => void }
): void {
  speak(sentenceText(words, { question: opts?.question }), {
    lang: languageOf(words).speechLang,
    onDone: opts?.onDone,
  });
}

export { getWord, languageOf, sentenceText };
