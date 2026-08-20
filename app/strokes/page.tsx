import Link from "next/link";
import HanziStroke from "@/components/HanziStroke";
import PinyinText from "@/components/PinyinText";
import SpeakButton from "@/components/SpeakButton";

// The 8 basic stroke types every character is built from.
// `path` is a small SVG sketch of the stroke's shape.
const STROKES = [
  { zh: "横", pinyin: "heng2", en: "horizontal", how: "Left to right, level", path: "M10 50 H90", example: "一", exPinyin: "yi1", exEn: "one" },
  { zh: "竖", pinyin: "shu4", en: "vertical", how: "Top to bottom, straight down", path: "M50 10 V90", example: "十", exPinyin: "shi2", exEn: "ten" },
  { zh: "撇", pinyin: "pie3", en: "left-falling", how: "Sweeps down to the lower left", path: "M65 15 C 55 45, 40 70, 18 85", example: "八", exPinyin: "ba1", exEn: "eight" },
  { zh: "捺", pinyin: "na4", en: "right-falling", how: "Presses down to the lower right", path: "M32 15 C 45 45, 65 70, 85 85", example: "人", exPinyin: "ren2", exEn: "person" },
  { zh: "点", pinyin: "dian3", en: "dot", how: "A short, quick tap", path: "M45 35 C 52 45, 58 55, 62 66", example: "六", exPinyin: "liu4", exEn: "six" },
  { zh: "提", pinyin: "ti2", en: "rising", how: "Flicks up to the upper right", path: "M20 80 L75 35", example: "我", exPinyin: "wo3", exEn: "I / me" },
  { zh: "钩", pinyin: "gou1", en: "hook", how: "A line that ends with a little hook", path: "M55 15 V70 L40 58", example: "小", exPinyin: "xiao3", exEn: "small" },
  { zh: "折", pinyin: "zhe2", en: "turn", how: "One stroke that bends a corner", path: "M20 30 H72 V82", example: "口", exPinyin: "kou3", exEn: "mouth" },
];

const RULES = [
  { rule: "Top before bottom", example: "三 — the three lines go top, middle, bottom" },
  { rule: "Left before right", example: "八 — the left stroke (撇) comes first" },
  { rule: "Horizontal before vertical", example: "十 — draw 一 first, then the vertical through it" },
  { rule: "Outside before inside…", example: "月 — the frame first, then the lines inside" },
  { rule: "…but close the box last", example: "日 — the bottom line seals the box at the end" },
  { rule: "Middle before the sides", example: "小 — the center hook first, then the two dots" },
];

// Radicals: the line-groups that carry meaning.
const RADICALS = [
  { glyph: "亻", meaning: "person", note: "a person standing", examples: [{ zh: "你", pinyin: "ni3", en: "you" }, { zh: "他", pinyin: "ta1", en: "he" }] },
  { glyph: "女", meaning: "woman", note: "", examples: [{ zh: "妈", pinyin: "ma1", en: "mom" }, { zh: "好", pinyin: "hao3", en: "good" }] },
  { glyph: "口", meaning: "mouth", note: "things you do with your mouth", examples: [{ zh: "吃", pinyin: "chi1", en: "to eat" }, { zh: "喝", pinyin: "he1", en: "to drink" }] },
  { glyph: "氵", meaning: "water", note: "three drops of water", examples: [{ zh: "河", pinyin: "he2", en: "river" }, { zh: "海", pinyin: "hai3", en: "sea" }] },
  { glyph: "讠", meaning: "speech", note: "words coming from a mouth", examples: [{ zh: "说", pinyin: "shuo1", en: "to speak" }, { zh: "谢", pinyin: "xie4", en: "to thank" }] },
  { glyph: "日", meaning: "sun / day", note: "a picture of the sun", examples: [{ zh: "明", pinyin: "ming2", en: "bright (sun + moon!)" }, { zh: "早", pinyin: "zao3", en: "early" }] },
  { glyph: "木", meaning: "tree / wood", note: "a trunk with branches", examples: [{ zh: "林", pinyin: "lin2", en: "forest (two trees!)" }, { zh: "本", pinyin: "ben3", en: "root; (book classifier)" }] },
  { glyph: "饣", meaning: "food", note: "", examples: [{ zh: "饭", pinyin: "fan4", en: "meal / rice" }, { zh: "饿", pinyin: "e4", en: "hungry" }] },
  { glyph: "扌", meaning: "hand", note: "actions done with hands", examples: [{ zh: "打", pinyin: "da3", en: "to hit / play" }, { zh: "找", pinyin: "zhao3", en: "to look for" }] },
  { glyph: "心", meaning: "heart", note: "feelings and thinking", examples: [{ zh: "想", pinyin: "xiang3", en: "to think / want" }, { zh: "忘", pinyin: "wang4", en: "to forget" }] },
];

// The 马 family: one sound-component, four words — meaning comes from the radical.
const MA_FAMILY = [
  { zh: "马", pinyin: "ma3", en: "horse", parts: "the original character — it sketches a horse" },
  { zh: "妈", pinyin: "ma1", en: "mom", parts: "女 woman + 马 mǎ (the sound)" },
  { zh: "吗", pinyin: "ma5", en: "question particle", parts: "口 mouth + 马 mǎ (the sound)" },
  { zh: "骂", pinyin: "ma4", en: "to scold", parts: "two 口 mouths shouting + 马 mǎ (the sound)" },
];

export default function StrokesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div>
        <h1 className="text-3xl font-bold">🖌️ What the Lines Mean</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Chinese characters look complicated, but they aren&apos;t random
          drawings. Every character is built from a handful of{" "}
          <strong>basic strokes</strong>, written in a{" "}
          <strong>fixed order</strong>, and grouped into{" "}
          <strong>components that carry meaning</strong>. Learn these three
          ideas and characters stop being pictures — they become words you can
          read.
        </p>
      </div>

      <section>
        <h2 className="mb-1 text-xl font-bold">1 · The 8 Basic Strokes</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Almost every line in every character is one of these eight. Tap 🔊 to
          hear each stroke&apos;s Chinese name, and ▶ Animate to watch the
          example character being written.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {STROKES.map((s) => (
            <div
              key={s.zh}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <svg
                viewBox="0 0 100 100"
                className="h-16 w-16 shrink-0 rounded-xl bg-zinc-50 dark:bg-zinc-800"
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
              <div className="min-w-0 flex-1 basis-44">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl" lang="zh-CN">
                    {s.zh}
                  </span>
                  <PinyinText pinyin={s.pinyin} className="font-medium" />
                  <span className="text-sm text-zinc-500">{s.en}</span>
                  <SpeakButton text={s.zh} size="sm" />
                </div>
                <p className="text-xs text-zinc-500">{s.how}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  See it in: <span lang="zh-CN" className="text-base text-zinc-600 dark:text-zinc-300">{s.example}</span>{" "}
                  ({s.exEn})
                </p>
              </div>
              <HanziStroke char={s.example} size={90} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-bold">2 · The Order of the Lines</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Strokes are always written in the same order — it makes characters
          faster to write, easier to remember, and legible in handwriting.
          Six rules cover nearly everything:
        </p>
        <ol className="space-y-2">
          {RULES.map((r, i) => (
            <li
              key={r.rule}
              className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-zinc-900"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <span>
                <span className="font-semibold">{r.rule}</span>
                <span className="block text-sm text-zinc-500" lang="zh-CN">
                  {r.example}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-zinc-500">
          Test these on the{" "}
          <Link href="/characters" className="font-semibold text-red-600 underline">
            ✍️ Write page
          </Link>{" "}
          — the tracing quiz only accepts strokes drawn in the right order.
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-bold">3 · Lines That Carry Meaning: Radicals</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Groups of strokes form <strong>radicals</strong> — reusable parts
          that hint at a character&apos;s meaning. Spot the radical and you can
          often guess what a new character is about. Here are ten of the most
          useful ones:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {RADICALS.map((r) => (
            <div
              key={r.glyph}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-4xl text-red-600" lang="zh-CN">
                  {r.glyph}
                </span>
                <span className="font-semibold">{r.meaning}</span>
                {r.note && (
                  <span className="text-xs text-zinc-400">({r.note})</span>
                )}
              </div>
              <ul className="mt-2 space-y-1">
                {r.examples.map((ex) => (
                  <li key={ex.zh} className="flex items-center gap-2 text-sm">
                    <SpeakButton text={ex.zh} size="sm" />
                    <span className="text-xl" lang="zh-CN">
                      {ex.zh}
                    </span>
                    <PinyinText pinyin={ex.pinyin} className="font-medium" />
                    <span className="text-zinc-500">{ex.en}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-red-200 bg-white p-6 dark:border-red-900 dark:bg-zinc-900">
        <h2 className="text-xl font-bold">4 · Putting It Together: the 马 Family</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Most characters combine a <strong>meaning part</strong> (the radical)
          with a <strong>sound part</strong>. Remember mā / má / mǎ / mà from
          the{" "}
          <Link href="/tones" className="font-semibold text-red-600 underline">
            tones page
          </Link>
          ? Here&apos;s how the lines spell those words:
        </p>
        <ul className="mt-4 space-y-3">
          {MA_FAMILY.map((m) => (
            <li
              key={m.zh}
              className="flex items-center gap-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"
            >
              <SpeakButton text={m.zh} />
              <span className="w-12 text-center text-4xl" lang="zh-CN">
                {m.zh}
              </span>
              <span className="min-w-0">
                <PinyinText pinyin={m.pinyin} className="text-lg font-semibold" />
                <span className="ml-2 text-sm text-zinc-500">{m.en}</span>
                <span className="block text-sm text-zinc-500">{m.parts}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
          The radical tells you the <em>meaning family</em> (woman, mouth), the
          shared part 马 tells you the <em>sound</em> (&ldquo;ma&rdquo;), and
          the <strong>tone</strong> tells you the exact word. That&apos;s the
          whole system — lines → strokes → radicals → characters.
        </p>
      </section>

      <div className="flex flex-wrap justify-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Link
          href="/characters"
          className="rounded-full bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700"
        >
          ✍️ Practice writing →
        </Link>
        <Link
          href="/tones"
          className="rounded-full border border-zinc-300 px-5 py-2.5 font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          🎵 Review the tone lines
        </Link>
      </div>
    </div>
  );
}
