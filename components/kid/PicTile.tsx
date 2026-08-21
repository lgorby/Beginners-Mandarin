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

/**
 * Tile dimensions — the ONE place they are defined, so every step and
 * the blank slot in SentenceRow scale together.
 *
 * Sized against the viewport HEIGHT, not width: a step has to fit
 * between the instruction pill and the Continue button, and it is height
 * that runs out first (a 1366x768 laptop in landscape leaves ~600px; a
 * phone in landscape leaves ~390px). clamp() keeps the rem floor for
 * fat-finger targets and the rem ceiling so tiles never balloon on a
 * 1080p desktop. `container-type: size` on the box lets the emoji
 * fallback scale with it (see below).
 */
export const SIZES = {
  sm: {
    box: "h-[clamp(2.75rem,9dvh,5rem)] w-[clamp(2.75rem,9dvh,5rem)]",
    pic: 48,
    text: "text-[clamp(0.8125rem,2.2dvh,1.25rem)]",
  },
  md: {
    box: "h-[clamp(3.5rem,13dvh,7rem)] w-[clamp(3.5rem,13dvh,7rem)]",
    pic: 64,
    text: "text-[clamp(0.9375rem,3dvh,1.5rem)]",
  },
  lg: {
    box: "h-[clamp(4.5rem,24dvh,14rem)] w-[clamp(4.5rem,24dvh,14rem)]",
    pic: 144,
    text: "text-[clamp(1.5rem,6dvh,3.75rem)]",
  },
} as const;

export type TileSize = keyof typeof SIZES;

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
  size?: TileSize;
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
  const textSize =
    word.text.length > 4 && size === "lg"
      ? "text-[clamp(1.125rem,4dvh,2.25rem)]"
      : s.text;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={word.en}
      onClick={() => {
        if (speakOnClick) speakWord(word.text);
        onClick?.();
      }}
      className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-3xl border-4 bg-white p-1.5 transition active:scale-95 disabled:opacity-40 sm:gap-1 sm:p-2 dark:bg-zinc-900 ${
        selected
          ? "border-red-500 shadow-lg"
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
      }`}
    >
      {/* container-type:size makes the box a query container, so the
          emoji fallback can be sized in cqh and shrink with the tile —
          a fixed px font-size would overflow a clamped-down box. */}
      <span
        className={`flex ${s.box} items-center justify-center [container-type:size]`}
      >
        {broken ? (
          <span className="text-[70cqh] leading-none">{word.emoji}</span>
        ) : (
          <Image
            src={`/pics/${word.id}.svg`}
            alt=""
            width={s.pic}
            height={s.pic}
            onError={() => setBroken(true)}
            unoptimized
            className="h-full w-full object-contain"
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
