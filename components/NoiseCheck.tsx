"use client";

import { useEffect, useState } from "react";

type Verdict = { ambient: number; voice: number };

// Module scope: the React compiler forbids impure calls (performance.now,
// rAF loops) inside component functions, and a running measurement
// outlives any single render anyway. This is a mount-once diagnostic.
let teardown: (() => void) | null = null;

function stopNoiseCheck() {
  teardown?.();
  teardown = null;
}

function level(analyser: AnalyserNode, buf: Uint8Array<ArrayBuffer>): number {
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(100, Math.sqrt(sum / buf.length) * 300);
}

/** Sample the level every frame for ms milliseconds. */
function watch(
  analyser: AnalyserNode,
  ms: number,
  cancelled: () => boolean
): Promise<number[]> {
  return new Promise((resolve) => {
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const samples: number[] = [];
    const t0 = performance.now();
    const tick = () => {
      samples.push(level(analyser, buf));
      if (performance.now() - t0 < ms && !cancelled()) {
        requestAnimationFrame(tick);
      } else {
        resolve(samples);
      }
    };
    tick();
  });
}

/**
 * Two-phase measurement: ambient level while the user stays silent, then
 * peak level while they speak — the same signal-to-noise contrast the
 * speech recognizer has to work with.
 */
async function runNoiseCheck(
  onStage: (s: "quiet" | "speak") => void
): Promise<Verdict> {
  stopNoiseCheck();
  const stream = await navigator.mediaDevices.getUserMedia({
    // The same cleanups a voice call would use, so the measurement
    // reflects the processed signal, not the raw room.
    audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
  });
  const ctx = new AudioContext();
  let cancelled = false;
  teardown = () => {
    cancelled = true;
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
  };
  try {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    onStage("quiet");
    const quiet = await watch(analyser, 2500, () => cancelled);
    onStage("speak");
    const talk = await watch(analyser, 3000, () => cancelled);
    if (cancelled) throw new Error("cancelled");
    // Ambient: 75th percentile, so a single bump doesn't count as noise.
    const sorted = [...quiet].sort((a, b) => a - b);
    return {
      ambient: Math.round(sorted[Math.floor(sorted.length * 0.75)] ?? 0),
      voice: Math.round(Math.max(0, ...talk)),
    };
  } finally {
    stopNoiseCheck();
  }
}

export default function NoiseCheck() {
  const [stage, setStage] = useState<
    "idle" | "quiet" | "speak" | "done" | "error"
  >("idle");
  const [result, setResult] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => stopNoiseCheck, []);

  const run = async () => {
    setResult(null);
    setError(null);
    try {
      const r = await runNoiseCheck(setStage);
      setResult(r);
      setStage("done");
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Microphone permission is blocked — allow it via the 🔒/🎤 icon in the address bar, then reload."
          : "Could not open the microphone."
      );
      setStage("error");
    }
  };

  const verdict =
    result &&
    (result.voice < 10
      ? {
          icon: "🤷",
          text: "I never heard a clear voice — speak louder or move closer to the microphone, then run it again.",
        }
      : result.ambient > 18
        ? {
            icon: "❌",
            text: `The room is loud (background ${result.ambient}/100 vs your voice ${result.voice}/100). The recognizer will struggle — try a quieter spot, move closer to the mic, or enable Windows noise suppression for your input device.`,
          }
        : result.ambient > 8
          ? {
              icon: "⚠️",
              text: `Some background noise (${result.ambient}/100 vs your voice ${result.voice}/100). Recognition should mostly work, but a quieter room would help.`,
            }
          : {
              icon: "✅",
              text: `Quiet room (background ${result.ambient}/100) and a clear voice (${result.voice}/100) — the recognizer gets a clean signal.`,
            });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">🤫 Noise check:</span>
        {stage === "quiet" ? (
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Stay completely silent…
          </span>
        ) : stage === "speak" ? (
          <span className="animate-pulse text-sm font-medium text-red-600 dark:text-red-400">
            Now say “nǐ hǎo”!
          </span>
        ) : (
          <button
            type="button"
            onClick={run}
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            ▶ Measure my room
          </button>
        )}
      </div>

      {verdict && (
        <p className="mt-3 text-sm">
          {verdict.icon} {verdict.text}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
