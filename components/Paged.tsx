"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A bounded box that flips through pages instead of scrolling.
 *
 * On a phone, several screens hold more than one viewport of content.
 * The app's rule is that nothing scrolls — not the window (see
 * app/layout.tsx) and not an inner box either: content that does not
 * fit is paged, whole items at a time, with ‹ › controls. When the
 * content fits, this renders no controls and behaves exactly like a
 * plain box — which is the desktop/laptop case everywhere.
 *
 * How it works: the viewport is overflow-hidden, so it never scrolls by
 * wheel or touch, but scrollTop still positions it programmatically.
 * After layout, the content is walked into "atoms" — elements small
 * enough to fit a page whole — and page boundaries are placed so no
 * atom is ever cut in half. Flipping a page is one scrollTop
 * assignment; the layout itself never changes, so pagination cannot
 * reflow a grid the way hiding items would.
 *
 * The measurement re-runs on any resize or DOM change inside the box
 * (quiz feedback appearing, fonts settling, the pager rail itself), and
 * the current page index survives recomputes clamped to the new count.
 * If the browser force-scrolls the box anyway (tabbing to an off-page
 * control, find-in-page), the scroll handler adopts the nearest page
 * rather than fighting it.
 *
 * Content that should center when it fits (a lesson step, a flashcard)
 * can put `my-auto` on its wrapper: the viewport is a flex column, so
 * auto margins center while fitting and collapse to the top — where
 * page 1 starts — once content overflows.
 *
 * Touch swipes flip pages (left/up → next, right/down → previous);
 * mark a surface that owns its own touch gestures — a drawing box —
 * with `data-no-swipe`. Arrow keys are deliberately NOT bound, same as
 * components/Panes.tsx: quizzes and steps already use them via
 * lib/useArrowNav.ts.
 *
 * scripts/fit-check.mjs knows the data-paged/data-pager markers and
 * fails a page whose paged box overflows without showing controls.
 */
export default function Paged({
  children,
  className = "",
  role,
}: {
  children: React.ReactNode;
  className?: string;
  /** ARIA role for the viewport, e.g. Panes' "tabpanel". */
  role?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Each page is a [start, end) slice of the content's height: start is
  // where scrollTop lands, end is the bottom of the last atom that fits
  // — everything past it belongs to the next page and is clipped out so
  // no half-cut card shows at the page's bottom edge.
  const [pages, setPages] = useState<{ start: number; end: number }[]>([
    { start: 0, end: Infinity },
  ]);
  const [page, setPage] = useState(0);
  // Bottom filler so the LAST page's start is a reachable scrollTop —
  // the browser clamps scrollTop to scrollHeight − clientHeight, and an
  // atom-aligned final page usually starts beyond that.
  const [spacer, setSpacer] = useState(0);
  // False until the first real measurement has committed. Surfaced as
  // data-paged-ready on the root, which is scripts/fit-check.mjs's
  // hydration signal: before this, the server HTML shows an
  // overflowing box with no controls, indistinguishable from a broken
  // pager. Set in the same state batch as that first measurement, so
  // the attribute never appears before the controls do.
  const [ready, setReady] = useState(false);

  const compute = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const H = vp.clientHeight;
    if (H <= 0) return;
    const vpRect = vp.getBoundingClientRect();
    const origin = vpRect.top - vp.scrollTop;

    // Atoms: the units a page break may not split. An element taller
    // than a page is not an atom — recurse for its children (a grid
    // breaks into rows of cards, a stack into its sections).
    const atoms: { top: number; bottom: number }[] = [];
    const collect = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.height <= 0) return;
      const top = r.top - origin;
      if (r.height <= H || el.children.length === 0) {
        atoms.push({ top, bottom: top + r.height });
      } else {
        for (const c of el.children) collect(c);
      }
    };
    for (const c of vp.children) {
      if (!c.hasAttribute("data-paged-spacer")) collect(c);
    }
    const contentBottom = atoms.reduce((m, a) => Math.max(m, a.bottom), 0);

    const next: { start: number; end: number }[] = [];
    let start = 0;
    while (next.length < 40) {
      const limit = start + H;
      // The visible end of this page: the bottom of the last atom that
      // fits it whole. If nothing ends inside the page (a single leaf
      // taller than the viewport), show the full window.
      let end = start;
      for (const a of atoms) {
        if (a.bottom <= limit + 1) end = Math.max(end, a.bottom);
      }
      if (end <= start + 1) end = limit;
      next.push({ start, end });
      if (contentBottom <= limit + 2) break;
      // The next page starts at the first atom that does not fit
      // entirely on this one.
      let cut = Infinity;
      for (const a of atoms) {
        if (a.bottom > limit + 1 && a.top > start + 1) {
          cut = Math.min(cut, a.top);
        }
      }
      if (cut === Infinity || cut <= start + 1) cut = limit;
      start = cut;
    }

    const last = next[next.length - 1];
    setSpacer(
      next.length > 1
        ? Math.max(0, Math.ceil(last.start + H - contentBottom))
        : 0,
    );
    setPages((prev) =>
      prev.length === next.length &&
      prev.every(
        (v, i) =>
          Math.abs(v.start - next[i].start) < 1 &&
          Math.abs(v.end - next[i].end) < 1,
      )
        ? prev
        : next,
    );
    setReady(true);
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(vp);
    for (const c of vp.children) ro.observe(c);
    const mo = new MutationObserver(schedule);
    mo.observe(vp, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    };
  }, [compute]);

  const pageCount = pages.length;
  const current = Math.min(page, pageCount - 1);

  useEffect(() => {
    const vp = viewportRef.current;
    if (vp) vp.scrollTop = pages[current]?.start ?? 0;
  }, [pages, current]);

  // The browser can scroll a hidden-overflow box itself (focus moving
  // to an off-page control, find-in-page). Adopt the nearest page so
  // the controls stay truthful instead of snapping the user back.
  const onScroll = () => {
    const vp = viewportRef.current;
    if (!vp || pageCount < 2) return;
    let nearest = 0;
    for (let i = 1; i < pages.length; i++) {
      if (
        Math.abs(pages[i].start - vp.scrollTop) <
        Math.abs(pages[nearest].start - vp.scrollTop)
      ) {
        nearest = i;
      }
    }
    if (nearest !== current) setPage(nearest);
  };

  // Hide the sliver of the next page's first atom: show only this
  // page's [start, end) band, clipped at the last whole atom's bottom.
  const band = pages[current];
  const clip =
    pageCount > 1 && band && Number.isFinite(band.end)
      ? { clipPath: `inset(0 0 calc(100% - ${band.end - band.start}px) 0)` }
      : undefined;

  const goTo = (delta: number) =>
    setPage(Math.min(Math.max(current + delta, 0), pageCount - 1));

  const flip = (e: React.MouseEvent, delta: number) => {
    // Pagers can sit inside clickable surfaces (a flashcard); flipping
    // a page must not also flip the card.
    e.stopPropagation();
    goTo(delta);
  };

  // Touch swipes flip pages too: left or up → next, right or down →
  // previous. Touch only, not mouse — desktops have the ‹ › buttons,
  // and mouse drags select text. A tap never flips (60px threshold),
  // and two gestures are left alone: anything starting on a
  // [data-no-swipe] surface (the trace-it drawing box — a stroke drawn
  // there is not a swipe), and anything starting inside one of the rare
  // nested boxes that genuinely scrolls (a diagnostic log).
  //
  // The handlers live on the ROOT, not the clipped viewport: clip-path
  // clips hit-testing too, so a finger landing in the clipped band at a
  // page's bottom would fall through the viewport entirely. touchmove
  // keeps the last position so a swipe still counts when the browser
  // ends the gesture with touchcancel instead of touchend — some
  // Android gesture paths do, even under touch-action:none.
  const touchStart = useRef<{
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    skip: boolean;
  } | null>(null);
  // ?touchdebug: an on-screen event trace, because a phone has no
  // console. Harmless in production; nobody types it by accident.
  const [debugLog, setDebugLog] = useState<string[] | null>(null);
  const dbg = (line: string) =>
    setDebugLog((prev) => (prev ? [...prev.slice(-6), line] : prev));

  useEffect(() => {
    // One-time client-only read of the URL flag. It cannot be a state
    // initializer: the server renders null and a lazy client init of []
    // would mismatch on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.search.includes("touchdebug")) setDebugLog([]);
  }, []);

  const swipeDelta = () => {
    const start = touchStart.current;
    if (!start || start.skip || pageCount < 2) return 0;
    const dx = start.lastX - start.x;
    const dy = start.lastY - start.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < 60) return 0;
    return (ax > ay ? dx : dy) < 0 ? 1 : -1;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      touchStart.current = null; // a pinch is never a page flip
      dbg("start: multi-touch, ignored");
      return;
    }
    const t = e.touches[0];
    let skip = false;
    for (
      let n = e.target instanceof Element ? e.target : null;
      n && n !== rootRef.current;
      n = n.parentElement
    ) {
      const cs = getComputedStyle(n);
      if (
        n.hasAttribute("data-no-swipe") ||
        (/(auto|scroll)/.test(cs.overflowY) &&
          n.scrollHeight > n.clientHeight) ||
        (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth)
      ) {
        skip = true;
        break;
      }
    }
    touchStart.current = {
      x: t.clientX,
      y: t.clientY,
      lastX: t.clientX,
      lastY: t.clientY,
      skip,
    };
    dbg(`start ${Math.round(t.clientX)},${Math.round(t.clientY)}${skip ? " (skip)" : ""}`);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start) return;
    const t = e.touches[0];
    start.lastX = t.clientX;
    start.lastY = t.clientY;
  };

  const settleTouch = (kind: "end" | "cancel") => {
    const start = touchStart.current;
    const delta = swipeDelta();
    touchStart.current = null;
    if (start) {
      dbg(
        `${kind} ${Math.round(start.lastX - start.x)},${Math.round(start.lastY - start.y)} -> ${
          delta === 0 ? "no flip" : delta > 0 ? "next" : "prev"
        }`,
      );
    } else {
      dbg(`${kind} (no start)`);
    }
    if (delta !== 0) goTo(delta);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    if (start) {
      const t = e.changedTouches[0];
      start.lastX = t.clientX;
      start.lastY = t.clientY;
    }
    settleTouch("end");
  };

  const onTouchCancel = () => settleTouch("cancel");

  const buttonClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-lg font-bold text-zinc-600 transition hover:bg-zinc-100 active:scale-95 disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div
      ref={rootRef}
      data-paged-root
      data-paged-ready={ready ? "" : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      // touch-none only while pages exist: real mobile browsers run
      // drags through their own gesture recognizer first, and without
      // touch-action:none a swipe is claimed as a pan attempt and
      // arrives as touchcancel — CDP-dispatched touches never showed
      // this. A single-page box keeps normal browser gestures.
      className={`relative flex min-h-0 flex-col ${
        pageCount > 1 ? "touch-none" : ""
      } ${className}`}
    >
      <div
        ref={viewportRef}
        data-paged
        role={role}
        onScroll={onScroll}
        style={clip}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {children}
        {spacer > 0 && (
          <div
            data-paged-spacer
            aria-hidden
            className="shrink-0"
            style={{ height: spacer }}
          />
        )}
      </div>
      {pageCount > 1 && (
        <div
          data-pager
          className="flex shrink-0 items-center justify-center gap-3 pt-1.5"
        >
          <button
            type="button"
            onClick={(e) => flip(e, -1)}
            disabled={current === 0}
            aria-label="Previous page"
            className={buttonClass}
          >
            ‹
          </button>
          <span
            aria-live="polite"
            className="text-xs font-medium tabular-nums text-zinc-500"
          >
            {current + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={(e) => flip(e, 1)}
            disabled={current === pageCount - 1}
            aria-label="Next page"
            className={buttonClass}
          >
            ›
          </button>
        </div>
      )}
      {debugLog && (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 left-1 z-50 rounded bg-black/70 p-1 font-mono text-[10px] leading-tight text-green-300"
        >
          <div>
            pages {current + 1}/{pageCount} · touchdebug
          </div>
          {debugLog.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
