"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "@/lib/languages";
import SpeakButton from "@/components/SpeakButton";
import { articleFor, posLabel, spokenForm } from "@/lib/spanishNouns";

interface Result {
  word: string;
  pos: string;
  translations: string[];
}

const es = LANGUAGES.es;

export default function SpanishDictionaryPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped by every new query and by clearing the box. A response whose
  // id no longer matches lost the race and must not touch the UI: the
  // debounce timer only cancels requests that have not fired yet.
  const requestId = useRef(0);

  // Clearing happens in the change handler, not here — setState inside
  // the effect body is the pattern React 19's lint rejects.
  const onQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      requestId.current++;
      setResults([]);
      setSearched(false);
      setError(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (!q) return; // the change handler already cleared the results
    const id = ++requestId.current;
    const current = () => id === requestId.current;
    debounce.current = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/search-es?q=${encodeURIComponent(q)}`);
        // fetch only rejects on a network failure; a 500 arrives as a
        // perfectly good response with no results in it.
        if (!res.ok) throw new Error(`search-es returned ${res.status}`);
        const data = (await res.json()) as { results: Result[] };
        if (!current()) return;
        setResults(data.results);
        setSearched(true);
      } catch {
        // Offline, or the dictionary failed to load server-side. Saying
        // so beats the old behaviour, where the spinner cleared and the
        // page went back to looking like nothing had been typed.
        if (!current()) return;
        setResults([]);
        setSearched(false);
        setError(true);
      } finally {
        if (current()) setLoading(false);
      }
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  return (
    // Same shape as the Mandarin dictionary: the search box is a fixed
    // rail and only the unbounded results list scrolls.
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-3">
      <div className="shrink-0">
        <h1 className="text-xl font-bold sm:text-3xl">🔎 Talking Dictionary</h1>
        <p className="short-hide mt-1 text-sm text-zinc-500">
          Type an <strong>English word</strong> (like &ldquo;water&rdquo;) or a{" "}
          <strong>Spanish word</strong> (like &ldquo;agua&rdquo;) — accents
          optional — then tap 🔊 to hear it.
        </p>

        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Try: hello, water, dog, hola, gracias…"
          autoFocus
          className="mt-3 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 sm:px-5 sm:py-4 sm:text-lg dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <p className="text-sm text-zinc-400">Searching…</p>}

        {error && !loading && (
          <p className="mt-4 text-center text-zinc-500">
            Couldn&apos;t reach the dictionary. Check your connection and try
            again.
          </p>
        )}

        {searched && !loading && !error && results.length === 0 && (
          <p className="mt-4 text-center text-zinc-500">
            No matches for &ldquo;{query}&rdquo; — try a simpler word.
          </p>
        )}

        <ul className="space-y-2">
          {results.map((r, i) => (
            <li
              key={`${r.word}-${r.pos}-${i}`}
              className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <SpeakButton
                text={spokenForm(r.word, r.pos)}
                showSlow
                lang={es.speechLang}
                voicePrefer={es.preferredVoices}
                voiceAvoid={es.wrongVarietyVoices}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-3xl font-semibold" lang="es-MX">
                    {articleFor(r.word, r.pos) && (
                      <span className="mr-2 text-xl font-normal text-zinc-400">
                        {articleFor(r.word, r.pos)}
                      </span>
                    )}
                    {r.word}
                  </span>
                  {posLabel(r.word, r.pos) && (
                    <span className="text-sm text-zinc-400">
                      {posLabel(r.word, r.pos)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {r.translations.slice(0, 4).join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="short-hide shrink-0 rounded-xl bg-zinc-100 p-3 text-xs text-zinc-500 dark:bg-zinc-900">
        Nouns show their article — <strong>el</strong> (masculine) or{" "}
        <strong>la</strong> (feminine) — because the article is part of the
        word. 24,000+ entries from WikDict (Wiktionary data, CC BY-SA).
      </div>
    </div>
  );
}
