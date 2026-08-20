"use client";

import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";

/**
 * Animated stroke-order display for one character, with a "quiz" mode where
 * the learner traces the strokes with mouse or finger.
 */
export default function HanziStroke({
  char,
  size = 160,
}: {
  char: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [mode, setMode] = useState<"idle" | "quiz" | "done">("idle");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    setMode("idle");
    setFailed(false);
    const writer = HanziWriter.create(ref.current, char, {
      width: size,
      height: size,
      padding: 8,
      strokeColor: "#dc2626",
      outlineColor: "#e4e4e7",
      drawingColor: "#dc2626",
      showCharacter: true,
      delayBetweenStrokes: 250,
      strokeAnimationSpeed: 1,
      onLoadCharDataError: () => setFailed(true),
    });
    writerRef.current = writer;
    return () => {
      writerRef.current = null;
    };
  }, [char, size]);

  const animate = () => {
    setMode("idle");
    writerRef.current?.showCharacter({ duration: 0 });
    writerRef.current?.animateCharacter();
  };

  const quiz = () => {
    setMode("quiz");
    writerRef.current?.quiz({
      onComplete: () => setMode("done"),
    });
  };

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-1 text-zinc-400">
        <span className="text-6xl text-zinc-700 dark:text-zinc-200">{char}</span>
        <span className="text-xs">stroke data unavailable</span>
      </div>
    );
  }

  // Below ~140px the two buttons are wider than the drawing area, which let
  // them spill over neighboring content — stack them vertically instead.
  const stacked = size < 140;

  return (
    <div
      className="flex max-w-full shrink-0 flex-col items-center gap-2"
      style={{ width: size }}
    >
      <div
        ref={ref}
        className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700"
        style={{ width: size, height: size }}
      />
      <div className={stacked ? "flex w-full flex-col gap-1" : "flex gap-2"}>
        <button
          type="button"
          onClick={animate}
          className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          ▶ Animate
        </button>
        <button
          type="button"
          onClick={quiz}
          className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700"
        >
          ✍️ Trace it
        </button>
      </div>
      {mode === "quiz" && (
        <p className="text-xs text-zinc-500">Draw each stroke in order</p>
      )}
      {mode === "done" && (
        <p className="text-xs font-semibold text-green-600">🎉 Nice writing!</p>
      )}
    </div>
  );
}
