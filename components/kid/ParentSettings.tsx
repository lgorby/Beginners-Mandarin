"use client";

import { useState } from "react";
import Link from "next/link";
import { PROGRESS_KEY, reloadProgress } from "@/lib/progress";
import { setPinyinVisible } from "@/lib/pinyinPref";
import { setGentleTones } from "@/lib/tonePref";
import { usePinyinVisible } from "./usePinyinVisible";
import { useGentleTones } from "../useGentleTones";
import { useKidLang } from "./useKidLang";
import LangSwitch from "./LangSwitch";

export default function ParentSettings() {
  const [open, setOpen] = useState(false);
  const visible = usePinyinVisible();
  const gentle = useGentleTones("kid");
  const lang = useKidLang();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Settings for grown-ups"
        className="fixed bottom-4 right-4 rounded-full bg-white/90 p-3 text-xl shadow-lg dark:bg-zinc-800/90"
      >
        ⚙️
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-zinc-900">
            <h2 className="text-xl font-bold">For grown-ups</h2>

            <div className="mt-4">
              <span className="block">
                Language
                <span className="block text-sm text-zinc-500">
                  Each language has its own path and its own stars.
                </span>
              </span>
              <div className="mt-2">
                <LangSwitch />
              </div>
            </div>

            {lang === "zh" && (
              <>
                <label className="mt-4 flex items-center justify-between gap-4">
                  <span>
                    Show pinyin
                    <span className="block text-sm text-zinc-500">
                      Off by default — young children read the picture, not the
                      spelling.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setPinyinVisible(e.target.checked)}
                    className="h-6 w-6"
                  />
                </label>

                <label className="mt-4 flex items-center justify-between gap-4">
                  <span>
                    Gentle tones
                    <span className="block text-sm text-zinc-500">
                      On by default — young children earn the win with the
                      right sounds, and tones are coached playfully. Turn off
                      to require correct tones for a &quot;Perfect&quot;.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={gentle}
                    onChange={(e) => setGentleTones("kid", e.target.checked)}
                    className="h-6 w-6"
                  />
                </label>

                <Link
                  href="/grown-ups"
                  className="mt-4 block rounded-2xl bg-zinc-100 px-4 py-3 text-center font-semibold dark:bg-zinc-800"
                >
                  Tones, dictionary, writing &amp; more →
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                if (!confirm("Erase all stars (every language) and start over?"))
                  return;
                localStorage.removeItem(PROGRESS_KEY);
                reloadProgress(); // drop the cached snapshot; the map re-renders
                setOpen(false);
              }}
              className="mt-3 w-full rounded-2xl px-4 py-3 text-sm text-red-600"
            >
              Reset progress
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded-2xl bg-red-600 px-4 py-3 font-bold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
