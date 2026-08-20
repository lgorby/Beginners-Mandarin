"use client";

import { useEffect, useRef, useState } from "react";
import PinyinText from "@/components/PinyinText";
import SpeakButton from "@/components/SpeakButton";

interface Result {
  traditional: string;
  simplified: string;
  pinyin: string;
  pinyinMarked: string;
  definitions: string[];
}

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clearing happens in the change handler, not here — setState inside
  // the effect body is the pattern React 19's lint rejects.
  const onQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSearched(false);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (!q) return; // the change handler already cleared the results
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">🔎 Talking Dictionary</h1>
      <p className="mt-1 text-zinc-500">
        Type an <strong>English word</strong> (like &ldquo;water&rdquo;),{" "}
        <strong>pinyin</strong> (like &ldquo;shui&rdquo;), or paste{" "}
        <strong>Chinese characters</strong> — then tap 🔊 to hear it.
      </p>

      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Try: hello, water, cat, xie xie, 你好…"
        autoFocus
        className="mt-5 w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-lg shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-zinc-700 dark:bg-zinc-900"
      />

      {loading && <p className="mt-4 text-sm text-zinc-400">Searching…</p>}

      {searched && !loading && results.length === 0 && (
        <p className="mt-6 text-center text-zinc-500">
          No matches for &ldquo;{query}&rdquo; — try a simpler word.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {results.map((r, i) => (
          <li
            key={`${r.simplified}-${r.pinyin}-${i}`}
            className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <SpeakButton text={r.simplified} showSlow />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-3xl font-semibold" lang="zh-CN">
                  {r.simplified}
                </span>
                {r.traditional !== r.simplified && (
                  <span className="text-lg text-zinc-400" lang="zh-TW">
                    ({r.traditional})
                  </span>
                )}
                <PinyinText pinyin={r.pinyin} className="text-lg font-medium" />
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {r.definitions.slice(0, 4).join(" · ")}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl bg-zinc-100 p-4 text-xs text-zinc-500 dark:bg-zinc-900">
        Tone colors: <span style={{ color: "#e02424" }}>1st (flat)</span> ·{" "}
        <span style={{ color: "#0e9f6e" }}>2nd (rising)</span> ·{" "}
        <span style={{ color: "#1c64f2" }}>3rd (dip)</span> ·{" "}
        <span style={{ color: "#7e3af2" }}>4th (falling)</span> ·{" "}
        <span style={{ color: "#6b7280" }}>neutral</span>. 120,000+ entries from
        CC-CEDICT.
      </div>
    </div>
  );
}
