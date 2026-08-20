import type { SyllableMark } from "@/lib/pronounce";

const STYLES: Record<SyllableMark["status"], string> = {
  full: "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
  sound:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",
  miss: "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500",
};

const PREFIX: Record<SyllableMark["status"], string> = {
  full: "✓ ",
  sound: "~ ",
  miss: "",
};

/**
 * Per-syllable closeness report for a speaking attempt: green = sound and
 * tone right, amber = right sound but wrong tone, gray = not heard.
 */
export default function SyllableReport({
  syllables,
  score,
}: {
  syllables: SyllableMark[];
  score: number;
}) {
  if (syllables.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-wrap justify-center gap-1.5">
        {syllables.map((s, i) => (
          <span
            key={i}
            className={`rounded-full border-2 px-3 py-1 text-lg font-semibold ${STYLES[s.status]}`}
          >
            {PREFIX[s.status]}
            {s.pinyin}
          </span>
        ))}
      </div>
      <p className="text-sm text-zinc-400">{score}% match</p>
    </div>
  );
}
