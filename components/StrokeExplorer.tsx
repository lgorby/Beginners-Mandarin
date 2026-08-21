"use client";

import { useState } from "react";
import HanziStroke from "./HanziStroke";
import PinyinText from "./PinyinText";
import SpeakButton from "./SpeakButton";

export interface StrokeInfo {
  zh: string;
  pinyin: string;
  en: string;
  how: string;
  /** Small SVG sketch of the stroke's shape, in a 100×100 viewBox. */
  path: string;
  example: string;
  exPinyin: string;
  exEn: string;
}

/**
 * The eight basic strokes as a master–detail pair: a compact list of
 * strokes beside ONE animation/tracing panel showing the selected
 * stroke's example character.
 *
 * Every card used to carry its own 90px HanziWriter plus two buttons —
 * ~180px a row, four rows, which is why /strokes overflowed a 1366×640
 * laptop by 436px. Sharing one panel keeps every affordance (hear the
 * name, animate the example, trace it) while the list fits beside it.
 *
 * The cards are plain buttons — the speak/animate/trace controls all
 * live in the panel, because interactive controls cannot nest inside a
 * button element.
 */
export default function StrokeExplorer({ strokes }: { strokes: StrokeInfo[] }) {
  const [selected, setSelected] = useState(strokes[0]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start">
      <div className="grid flex-1 content-start gap-2 sm:grid-cols-2">
        {strokes.map((s) => {
          const isSelected = s.zh === selected.zh;
          return (
            <button
              key={s.zh}
              type="button"
              onClick={() => setSelected(s)}
              aria-pressed={isSelected}
              className={`flex items-center gap-3 rounded-2xl border bg-white p-2 text-left shadow-sm transition dark:bg-zinc-900 ${
                isSelected
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-zinc-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800"
              }`}
            >
              <svg
                viewBox="0 0 100 100"
                className="h-10 w-10 shrink-0 rounded-xl bg-zinc-50 dark:bg-zinc-800"
                aria-hidden
              >
                <path
                  d={s.path}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2">
                  <span className="text-xl" lang="zh-CN">
                    {s.zh}
                  </span>
                  <PinyinText pinyin={s.pinyin} className="font-medium" />
                  <span className="text-sm text-zinc-500">{s.en}</span>
                </span>
                <span className="block text-xs text-zinc-500">{s.how}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 md:w-60 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-2xl" lang="zh-CN">
            {selected.zh}
          </span>
          <PinyinText pinyin={selected.pinyin} className="font-semibold" />
          <SpeakButton text={selected.zh} size="sm" />
        </div>
        <HanziStroke char={selected.example} size={120} />
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          See it in:
          <span className="text-lg text-zinc-700 dark:text-zinc-200" lang="zh-CN">
            {selected.example}
          </span>
          <PinyinText pinyin={selected.exPinyin} className="font-medium" />
          ({selected.exEn})
          <SpeakButton text={selected.example} size="sm" />
        </p>
      </div>
    </div>
  );
}
