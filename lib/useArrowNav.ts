"use client";

import { useEffect } from "react";

/**
 * SSOT for arrow-key paging: ArrowRight advances, ArrowLeft goes back,
 * everywhere in the app. Every Previous/Next surface binds through this
 * hook — components/PagerNav.tsx for the grown-up rows, the kid path's
 * StepShell directly — so the keys can never mean different things on
 * different pages.
 *
 * Pass undefined for a direction that has nowhere to go; the key then
 * falls through untouched. Keys are also ignored while typing in a
 * field (the dictionary search must keep its cursor keys) and when any
 * modifier is held (browser shortcuts like Alt+Left stay the browser's).
 */
export function useArrowNav(
  onPrev: (() => void) | undefined,
  onNext: (() => void) | undefined
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
        return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
      const fn =
        e.key === "ArrowRight" ? onNext : e.key === "ArrowLeft" ? onPrev : null;
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext]);
}
