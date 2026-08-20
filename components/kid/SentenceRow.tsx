"use client";

import PicTile from "./PicTile";

/**
 * A sentence as a row of tiles. The ONLY component that renders one.
 * `blankAt` leaves a slot empty for SWAP.
 */
export default function SentenceRow({
  words,
  blankAt,
  size = "md",
}: {
  words: string[];
  blankAt?: number;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {words.map((zh, i) =>
        i === blankAt ? (
          <span
            key={`blank-${i}`}
            className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-dashed border-red-400 text-4xl text-red-400"
          >
            ?
          </span>
        ) : (
          <PicTile key={`${zh}-${i}`} zh={zh} size={size} />
        )
      )}
    </div>
  );
}
