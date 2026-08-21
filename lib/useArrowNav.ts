"use client";

import { useEffect } from "react";

// SSOT for the app's global keyboard shortcuts. Every page binds through
// the hooks here — ArrowRight/ArrowLeft to page, Space/Enter to act —
// so a key can never mean different things on different pages.

/**
 * True when a global shortcut must leave this keypress alone: typing in
 * a field (the dictionary search keeps its cursor keys) or a held
 * modifier (browser shortcuts like Alt+Left stay the browser's).
 */
function reserved(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
    return true;
  const t = e.target as HTMLElement | null;
  return Boolean(
    t &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable)
  );
}

/**
 * ArrowRight advances, ArrowLeft goes back. Pass undefined for a
 * direction that has nowhere to go; the key then falls through
 * untouched.
 */
export function useArrowNav(
  onPrev: (() => void) | undefined,
  onNext: (() => void) | undefined
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (reserved(e)) return;
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

/**
 * Space or Enter fires the page's ACT action — say it / try again on a
 * microphone surface, "Keep going" on the star path and the lesson
 * celebration. Pass undefined while the action is unavailable (already
 * listening, recognition unsupported, mid-lesson).
 *
 * Bind at most one per screen: the handler is global, so a page with
 * two microphones (the grown-up lesson pages) must not use it — Space
 * would open both.
 *
 * A focused button or link already activates on these keys natively;
 * those presses are left to the browser so one press never fires twice.
 */
export function useRetryKey(onRetry: (() => void) | undefined) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!onRetry || reserved(e)) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "BUTTON" || t.tagName === "A")) return;
      e.preventDefault();
      onRetry();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRetry]);
}
