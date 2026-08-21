"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "@/lib/languages";
import SpeakButton from "@/components/SpeakButton";

interface Result {
  word: string;
  pos: string;
  translations: string[];
}

const es = LANGUAGES.es;

// A noun's article is part of learning the word, so nouns display AND
// speak with el/la. The other tags just label the entry.
const ARTICLE: Record<string, string> = { nm: "el", nf: "la", nmf: "el/la" };

// Feminine nouns that begin with a STRESSED a-/ha- take "el" in the
// singular (el agua, el águila) — "la agua" is wrong Spanish. Detecting
// the stress needs syllabification, so the common cases are listed.
const EL_FEMININE = new Set([
  "agua", "águila", "ala", "alba", "alga", "alma", "ama", "ancla", "ansia",
  "area", "área", "arma", "arpa", "asma", "asta", "aula", "ave", "aya",
  "haba", "habla", "hacha", "hada", "hambre", "haya",
]);

function articleFor(r: Result): string | undefined {
  if (r.pos === "nf" && EL_FEMININE.has(r.word)) return "el";
  return ARTICLE[r.pos];
}
const POS_LABEL: Record<string, string> = {
  nm: "noun (m.)",
  nf: "noun (f.)",
  nmf: "noun (m./f.)",
  n: "noun",
  prop: "name",
  adj: "adjective",
  v: "verb",
  adv: "adverb",
  loc: "phrase",
  interj: "interjection",
  saying: "saying",
};

/** What the 🔊 button says: "el perro", "la casa", or just the word. */
function spokenForm(r: Result): string {
  const article = articleFor(r);
  // el/la is a written shorthand, not sayable — speak those bare.
  return article && article !== "el/la" ? `${article} ${r.word}` : r.word;
}

export default function SpanishDictionaryPage() {
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
        const res = await fetch(`/api/search-es?q=${encodeURIComponent(q)}`);
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
        className="mt-5 w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-lg shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-900"
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
            key={`${r.word}-${r.pos}-${i}`}
            className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <SpeakButton
              text={spokenForm(r)}
              showSlow
              lang={es.speechLang}
              voicePrefer={es.preferredVoices}
              voiceAvoid={es.wrongVarietyVoices}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-3xl font-semibold" lang="es-MX">
                  {articleFor(r) && (
                    <span className="mr-2 text-xl font-normal text-zinc-400">
                      {articleFor(r)}
                    </span>
                  )}
                  {r.word}
                </span>
                {POS_LABEL[r.pos] && (
                  <span className="text-sm text-zinc-400">
                    {POS_LABEL[r.pos]}
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

      <div className="mt-8 rounded-xl bg-zinc-100 p-4 text-xs text-zinc-500 dark:bg-zinc-900">
        Nouns show their article — <strong>el</strong> (masculine) or{" "}
        <strong>la</strong> (feminine) — because the article is part of the
        word. 24,000+ entries from WikDict (Wiktionary data, CC BY-SA).
      </div>
    </div>
  );
}
