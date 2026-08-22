"use client";

import { useSyncExternalStore } from "react";
import {
  getMicTraceServerSnapshot,
  getMicTraceSnapshot,
  micDebugEnabled,
  subscribeMicTrace,
} from "@/lib/speech";
import { useClientValue } from "@/lib/useClientValue";

/**
 * ?micdebug: the recognition event trace, on screen — see lib/speech.ts.
 * Renders nothing unless the URL asks for it, so it can stay mounted on
 * every microphone surface at no cost.
 */
export default function MicDebugOverlay() {
  const enabled = useClientValue(micDebugEnabled, false);
  const lines = useSyncExternalStore(
    subscribeMicTrace,
    getMicTraceSnapshot,
    getMicTraceServerSnapshot,
  );
  if (!enabled || lines.length === 0) return null;
  return (
    <div className="fixed bottom-2 left-2 z-50 max-w-xs select-text rounded-xl bg-black/80 p-2 font-mono text-[10px] leading-tight text-green-300">
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
