import { toSyllables, TONE_COLORS } from "@/lib/pinyin";

/** Renders numbered pinyin as tone-colored diacritic pinyin. */
export default function PinyinText({
  pinyin,
  className = "",
}: {
  pinyin: string;
  className?: string;
}) {
  const syllables = toSyllables(pinyin);
  return (
    <span className={className}>
      {syllables.map((s, i) => (
        <span key={i} style={{ color: TONE_COLORS[s.tone] }}>
          {s.marked}
          {i < syllables.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
