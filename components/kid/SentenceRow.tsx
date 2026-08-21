"use client";

import PicTile, { SIZES, type TileSize } from "./PicTile";

/**
 * A sentence as a row of tiles. The ONLY component that renders one.
 * `blankAt` leaves a slot empty for SWAP.
 */
export default function SentenceRow({
  words,
  blankAt,
  size = "md",
  onWordTap,
}: {
  words: string[];
  blankAt?: number;
  size?: TileSize;
  /**
   * Runs when a word tile is tapped, alongside the tile speaking itself.
   * SAY uses it to disarm hands-free listening: speak() cancels the
   * utterance in flight, which fires the auto-speak's onDone — and that
   * opens the microphone. See SayStep.tsx.
   */
  onWordTap?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      {words.map((word, i) =>
        i === blankAt ? (
          <span
            key={`blank-${i}`}
            // Same clamped box as a real tile, so the blank can't tower
            // over the row it sits in on a short screen.
            className={`flex ${SIZES[size].box} items-center justify-center rounded-3xl border-4 border-dashed border-red-400 text-4xl text-red-400`}
          >
            ?
          </span>
        ) : (
          <PicTile
            key={`${word}-${i}`}
            wordKey={word}
            size={size}
            onClick={onWordTap}
          />
        ),
      )}
    </div>
  );
}
