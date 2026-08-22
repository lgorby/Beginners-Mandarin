"use client";

import { useEffect, useRef } from "react";

const BARS = 7;

/**
 * A live voice level meter: real microphone input, not recognizer
 * events. The recognizer's sound/speech events reset every time a dead
 * session is silently re-armed (see lib/speech.ts), which made the old
 * "I can hear you!" line flicker away mid-word — this meter draws from
 * its own mic stream, so it dances steadily for as long as the child
 * is talking, whatever the recognition service is doing underneath.
 *
 * Renders nothing but baseline dots if the stream can't open; it must
 * never be the reason listening breaks. Levels move via direct style
 * writes from one rAF loop — setState at animation rate would re-render
 * the whole step 60 times a second.
 */
export default function VoiceLevel({
  barClassName = "bg-red-500",
}: {
  /** Bar color, so the meter reads on any background (white on red). */
  barClassName?: string;
}) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const draw = () => {
          analyser.getByteFrequencyData(data);
          for (let i = 0; i < BARS; i++) {
            // Bands across ~200Hz–5.5kHz — where a voice lives.
            const band = data.slice(i * 4 + 1, i * 4 + 5);
            const level = band.reduce((a, b) => a + b, 0) / band.length / 255;
            const el = barsRef.current[i];
            if (el) el.style.height = `${4 + level * 28}px`;
          }
          raf = requestAnimationFrame(draw);
        };
        draw();
      } catch {
        // No stream — the bars just sit at their baseline.
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, []);

  return (
    <div className="flex h-8 items-center gap-1" aria-hidden>
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className={`w-1.5 rounded-full transition-[height] duration-75 ${barClassName}`}
          style={{ height: "4px" }}
        />
      ))}
    </div>
  );
}
