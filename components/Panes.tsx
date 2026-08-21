"use client";

import { useState } from "react";

import Paged from "./Paged";

/**
 * Turns a long stacked document into one-viewport panes.
 *
 * The grown-up pages are reference material — rules, tables, examples,
 * then a quiz — and stacked vertically none of them fit a laptop, let
 * alone a phone in landscape. This is the ONLY component that renders
 * that tabbed frame, so every grown-up page pages the same way.
 *
 * The frame itself (title, tabs, optional footer) is fixed height; the
 * active pane is the single flexible region. A pane that still
 * overflows on a very short screen pages inside its own box (see
 * components/Paged.tsx) — the tabs and the page chrome never move.
 *
 * Arrow keys are deliberately NOT bound: several of these pages already
 * give ArrowRight to "next quiz word" via lib/useArrowNav.ts.
 */

export interface Pane {
  /** Stable key; also the value stored as the active tab. */
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
}

export default function Panes({
  title,
  panes,
  accent = "red",
  footer,
}: {
  title: React.ReactNode;
  panes: Pane[];
  /** Matches the section's colour — Mandarin red, Spanish emerald. */
  accent?: "red" | "emerald";
  /** Always-visible row under the pane, for navigation that must not scroll away. */
  footer?: React.ReactNode;
}) {
  const [active, setActive] = useState(panes[0].id);
  const current = panes.find((p) => p.id === active) ?? panes[0];
  const selectedClass =
    accent === "emerald"
      ? "bg-emerald-600 text-white"
      : "bg-red-600 text-white";

  return (
    <div className="flex h-full flex-col gap-2">
      <h1 className="shrink-0 text-lg font-bold sm:text-2xl">{title}</h1>

      <div role="tablist" className="flex shrink-0 gap-1 overflow-x-auto pb-1">
        {panes.map((p) => {
          const selected = p.id === current.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(p.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                selected
                  ? selectedClass
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {p.icon && <span className="mr-1">{p.icon}</span>}
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Keyed so switching tabs starts the new pane on page 1. */}
      <Paged key={current.id} role="tabpanel" className="min-h-0 flex-1">
        {current.content}
      </Paged>

      {footer && <div className="shrink-0 pt-2">{footer}</div>}
    </div>
  );
}
