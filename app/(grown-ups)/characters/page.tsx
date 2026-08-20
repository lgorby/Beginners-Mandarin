"use client";

import { useState } from "react";
import HanziStroke from "@/components/HanziStroke";
import PinyinText from "@/components/PinyinText";
import SpeakButton from "@/components/SpeakButton";
import { VOCAB } from "@/lib/vocab";

// Single-character beginner words are ideal for first stroke practice.
const STARTERS = ["一", "二", "三", "十", "人", "大", "小", "口", "日", "月", "水", "火"];

const STARTER_INFO: Record<string, { pinyin: string; en: string }> = {
  一: { pinyin: "yi1", en: "one" },
  二: { pinyin: "er4", en: "two" },
  三: { pinyin: "san1", en: "three" },
  十: { pinyin: "shi2", en: "ten" },
  人: { pinyin: "ren2", en: "person" },
  大: { pinyin: "da4", en: "big" },
  小: { pinyin: "xiao3", en: "small" },
  口: { pinyin: "kou3", en: "mouth" },
  日: { pinyin: "ri4", en: "sun / day" },
  月: { pinyin: "yue4", en: "moon / month" },
  水: { pinyin: "shui3", en: "water" },
  火: { pinyin: "huo3", en: "fire" },
};

export default function CharactersPage() {
  const [selected, setSelected] = useState("水");
  const [custom, setCustom] = useState("");

  const info =
    STARTER_INFO[selected] ??
    (() => {
      const v = VOCAB.find((w) => w.zh.includes(selected));
      return v ? { pinyin: "", en: v.en } : null;
    })();

  const pickCustom = () => {
    const ch = [...custom.trim()].find((c) => /[㐀-鿿]/.test(c));
    if (ch) setSelected(ch);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">✍️ Character Writing</h1>
        <p className="mt-1 text-zinc-500">
          Every character is written with a fixed stroke order. Watch the
          animation, then trace it yourself with your mouse or finger. These
          twelve pictograph-like characters are the classic starting set.
        </p>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
        {STARTERS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelected(c)}
            lang="zh-CN"
            className={`rounded-xl border p-2 text-2xl transition ${
              selected === c
                ? "border-red-500 bg-red-50 dark:bg-red-950"
                : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:justify-center sm:gap-10">
        <HanziStroke char={selected} size={200} />
        <div className="text-center sm:text-left">
          <div className="text-5xl" lang="zh-CN">
            {selected}
          </div>
          {info && (
            <>
              {info.pinyin && (
                <PinyinText
                  pinyin={info.pinyin}
                  className="text-xl font-medium"
                />
              )}
              <div className="text-zinc-500">{info.en}</div>
            </>
          )}
          <div className="mt-2">
            <SpeakButton text={selected} showSlow />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Try any character</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pickCustom()}
            placeholder="Paste a Chinese character, e.g. 爱"
            lang="zh-CN"
            className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="button"
            onClick={pickCustom}
            className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
          >
            Show
          </button>
        </div>
      </div>
    </div>
  );
}
