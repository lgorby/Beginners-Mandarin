"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useArrowNav } from "@/lib/useArrowNav";

/**
 * The grown-up section's Previous/Next row: Previous on the left, Next
 * on the right, optional counter between, ArrowLeft/ArrowRight bound via
 * lib/useArrowNav.ts. The ONLY component that renders this row, so every
 * grown-up pager looks and behaves the same. (The kid path's StepShell
 * keeps its own child-sized chrome and shares the same hook instead.)
 *
 * Each side takes an onClick OR an href — href renders a real link and
 * the arrow key navigates to it. Omit a side that has nowhere to go.
 */
interface PagerTarget {
  label?: string;
  href?: string;
  onClick?: () => void;
}

export default function PagerNav({
  prev,
  next,
  center,
}: {
  prev?: PagerTarget;
  next?: PagerTarget;
  center?: React.ReactNode;
}) {
  const router = useRouter();
  const activate = (t?: PagerTarget) =>
    t && (t.onClick ?? (t.href ? () => router.push(t.href!) : undefined));

  useArrowNav(activate(prev), activate(next));

  const prevClass =
    "rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700";
  const nextClass =
    "rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700";

  const side = (t: PagerTarget | undefined, text: string, className: string) => {
    if (!t) return <span aria-hidden />; // keep justify-between balanced
    return t.href ? (
      <Link href={t.href} onClick={t.onClick} className={className}>
        {text}
      </Link>
    ) : (
      <button type="button" onClick={t.onClick} className={className}>
        {text}
      </button>
    );
  };

  return (
    <div className="flex items-center justify-between gap-3">
      {side(prev, `← ${prev?.label ?? "Previous"}`, prevClass)}
      {center && <span className="text-sm text-zinc-400">{center}</span>}
      {side(next, `${next?.label ?? "Next"} →`, nextClass)}
    </div>
  );
}
