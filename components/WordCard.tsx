import { VocabWord } from "@/lib/vocab";
import PinyinText from "./PinyinText";
import SpeakButton from "./SpeakButton";

/** A vocabulary card: emoji visual, characters, tone-colored pinyin, sound. */
export default function WordCard({ word }: { word: VocabWord }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-4xl">{word.emoji}</div>
      <div className="text-3xl font-semibold" lang="zh-CN">
        {word.zh}
      </div>
      <PinyinText pinyin={word.pinyin} className="text-base font-medium" />
      <div className="text-sm text-zinc-500">{word.en}</div>
      <SpeakButton text={word.zh} size="sm" showSlow />
    </div>
  );
}
