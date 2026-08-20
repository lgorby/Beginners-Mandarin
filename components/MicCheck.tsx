"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Microphone diagnostic: requests the mic and shows a live level meter,
 * so the user can tell whether the browser is receiving any sound at all —
 * separate from whether speech *recognition* works.
 */
export default function MicCheck() {
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setStatus("idle");
    setLevel(0);
  };

  useEffect(() => stop, []);

  const start = async () => {
    setError(null);
    setPeak(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      setStatus("running");
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.min(100, Math.round(Math.sqrt(sum / buf.length) * 300));
        setLevel(rms);
        setPeak((p) => Math.max(p, rms));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Microphone permission is blocked. Click the 🔒/🎤 icon in the address bar, set Microphone to Allow, then reload the page."
          : name === "NotFoundError"
            ? "No microphone was found. Check that one is plugged in and enabled in Windows Settings → Privacy & security → Microphone."
            : `Could not open the microphone (${name || "unknown error"}).`
      );
      setStatus("error");
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">🩺 Mic check:</span>
        {status !== "running" ? (
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            ▶ Test my microphone
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            ⏹ Stop test
          </button>
        )}
        {status === "running" && (
          <span className="text-sm text-zinc-500">Speak — the bar should move:</span>
        )}
      </div>

      {status === "running" && (
        <div className="mt-3">
          <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-[width] duration-75 ${level > 8 ? "bg-green-500" : "bg-amber-400"}`}
              style={{ width: `${Math.max(2, level)}%` }}
            />
          </div>
          <p className="mt-2 text-sm">
            {peak > 8 ? (
              <span className="font-medium text-green-600">
                ✅ Your microphone works — the browser is hearing you.
              </span>
            ) : (
              <span className="text-zinc-500">
                Waiting for sound… if the bar never moves while you talk, check
                the input device in Windows sound settings.
              </span>
            )}
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
