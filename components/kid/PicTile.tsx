"use client";

import { useState } from "react";
import Image from "next/image";
import PinyinText from "@/components/PinyinText";
import { getWord, languageOf } from "@/lib/curriculum";
import { speakWord } from "@/lib/kidSpeech";
import { usePinyinVisible } from "./usePinyinVisible";

/**
 * The atom the whole kid path is built from: picture, the word in its
 * own script, optional pinyin (Mandarin only), and the word's sound.
 * This is the ONLY component that renders those together — every step
 * composes it rather than reimplementing it.
 */

const SIZES = {
  sm: { box: "h-20 w-20", pic: 48, text: "text-xl" },
  md: { box: "h-28 w-28", pic: 64, text: "text-2xl" },
  lg: { box: "h-56 w-56", pic: 144, text: "text-6xl" },
} as const;

export default function PicTile({
  wordKey,
  size = "md",
  onClick,
  selected = false,
  disabled = false,
  showText = true,
  speakOnClick = true,
}: {
  /** The word's text — its key in WORDS. */
  wordKey: string;
  size?: keyof typeof SIZES;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showText?: boolean;
  speakOnClick?: boolean;
}) {
  const word = getWord(wordKey);
  const language = languageOf([wordKey]);
  const pinyinVisible = usePinyinVisible();
  const [broken, setBroken] = useState(false);
  const s = SIZES[size];

  // A long Spanish word ("estudiante") cannot take hanzi-sized type.
  const textSize = word.text.length > 4 && size === "lg" ? "text-4xl" : s.text;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={word.en}
      onClick={() => {
        if (speakOnClick) speakWord(word.text);
        onClick?.();
      }}
      className={`flex flex-col items-center justify-center gap-1 rounded-3xl border-4 bg-white p-2 transition active:scale-95 disabled:opacity-40 dark:bg-zinc-900 ${
        selected
          ? "border-red-500 shadow-lg"
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
      }`}
    >
      <span className={`flex ${s.box} items-center justify-center`}>
        {broken ? (
          <span style={{ fontSize: s.pic }}>{word.emoji}</span>
        ) : (
          <Image
            src={`/pics/${word.id}.svg`}
            alt=""
            width={s.pic}
            height={s.pic}
            onError={() => setBroken(true)}
            unoptimized
          />
        )}
      </span>
      {showText && (
        <>
          <span
            className={`${textSize} font-semibold`}
            lang={language.speechLang}
          >
            {word.text}
          </span>
          {word.pinyin && pinyinVisible && (
            <PinyinText pinyin={word.pinyin} className="text-sm font-medium" />
          )}
        </>
      )}
    </button>
  );
}
