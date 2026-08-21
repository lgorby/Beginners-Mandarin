# PR #11 Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all seven defects found in the PR #11 review, one at a time, each independently committed and independently reviewed before the next begins.

**Architecture:** Seven self-contained tasks, ordered so the currently-red test suite goes green first and the two feature-breaking defects are cleared before the cosmetic ones. Each task moves the logic under test into a pure module under `lib/` where the existing vitest setup can reach it (there is no jsdom in this repo, so component internals are verified by a scripted manual run instead). Every task ends with a commit followed by a fresh-eyes reviewer gate; a task is not done until its reviewer returns clean.

**Tech Stack:** Next.js 16.3.1 (App Router, `output: "standalone"`), React 19.2.8, TypeScript 5, Tailwind 4, Vitest 4.1.11 (node environment, no DOM), PowerShell for the portable packager.

**Spec:** `docs/superpowers/plans/2026-08-21-pr-11-review-findings.md`

## Global Constraints

- **Branch:** all work lands on `spanish-grown-ups` (local branch `pr-11`, currently at `8f6c4c7`). Do not merge to `master`; PR #11 stays open and gets these commits pushed to it.
- **Baseline:** `npm test` on a clean Windows clone is **118 passed, 1 failed** — the failure is F2 and Task 1 fixes it. From Task 2 onward the suite must be fully green; a red suite is a stop-the-line event, not a known issue.
- **Test runner:** `npm test` (`vitest run`). `vitest.config.mts` sets `include: ["**/*.test.ts"]` and **no** `environment: "jsdom"`. Two consequences bind every task: test files must end in `.test.ts` (not `.tsx`), and no test may touch `window`, `document`, or render a component. Do not add jsdom or a testing-library dependency — it is out of scope for this plan.
- **Test location:** `lib/__tests__/<module>.test.ts`, matching the nine existing suites.
- **Pure logic lives in `lib/`.** Page and component files hold JSX and state only. Never import `lib/spanishDictionary.ts` or `lib/dictionary.ts` from a client component — they `import fs` at module scope and would break the browser bundle.
- **Comment style:** this codebase writes comments that explain *why*, in full sentences, often several lines. Match it. Every comment added by this plan is given verbatim — use it as written.
- **Commits:** one commit per task, Conventional Commits prefix (`fix:`, `test:`, `refactor:`). Do not squash tasks together.
- **Known non-issue:** `npx tsc --noEmit` reports two errors in `.next/**/validator.ts` about a missing `app/(grown-ups)/grown-ups/page.js`. These are stale generated types from the pre-rename route and regenerate on `npm run build`. Ignore them; if they are noisy, `rm -rf .next` first. Do not "fix" generated files.

---

## The Review Gate

**This procedure runs at the end of every task. The next task does not start until it returns clean.** It is the same procedure each time; only the **Review focus** differs, and each task states its own.

- [ ] **Gate step 1: Confirm the task's own verification passed.** Re-read the task's final test/verify step output. If anything is red or unrun, the gate does not start.

- [ ] **Gate step 2: Dispatch a fresh reviewer subagent.** Use the `feature-dev:code-reviewer` agent type. It has no context from this session — give it everything it needs:

```
Review the last commit on branch spanish-grown-ups in
C:\GitHub\Beginners-Mandarin\Beginners-Mandarin.

Run: git show HEAD --stat, then git show HEAD

Context: this commit fixes exactly ONE finding from a prior code review of
PR #11. The finding it is meant to fix is quoted below. Nothing else in the
repo is in scope for this review.

<paste the task's "Review focus" block verbatim here>

Answer these four questions, each with evidence from the diff:
1. Does the change actually fix the quoted finding, in every code path the
   finding names? Quote the lines that do it.
2. Does it introduce a new defect, regress existing behaviour, or leave a
   caller of a changed function unfixed? Search for every call site of
   anything whose signature or semantics changed.
3. Do the tests in this commit actually FAIL against the pre-fix code?
   Reason it through explicitly — a test that would pass either way is not
   a regression test.
4. Is the change in scope? Flag anything the commit touches that the quoted
   finding did not ask for.

Report only issues you are confident about, with file:line. If the commit
is clean, say so plainly and say nothing else.
```

- [ ] **Gate step 3: Act on the verdict.**
  - Clean → tick the task's checkbox and move to the next task.
  - Issues raised → **do not** implement them reflexively. Use `superpowers:receiving-code-review`: verify each claim against the code first, fix what is genuinely wrong, and push back in writing on what is not. Amend or add a commit, then re-run the gate from step 1.

---

## File Structure

New files:

| File | Responsibility |
|---|---|
| `.gitattributes` | Pin runtime-parsed data files to LF on checkout (Task 1). |
| `lib/__tests__/portableBuild.test.ts` | Guard: every `fs`-read data file is copied by the packager (Task 2). |
| `lib/spanishNouns.ts` | Pure: dictionary entry → article, spoken form, part-of-speech label (Task 5). |
| `lib/__tests__/spanishNouns.test.ts` | Tests for the above. |
| `lib/spanishStress.ts` | Pure: the stress-quiz word pool, accent stripping, and the three stress rules (Task 6). |
| `lib/__tests__/spanishStress.test.ts` | Tests for the above. |

Modified files:

| File | Change |
|---|---|
| `lib/spanishDictionary.ts` | Line-ending-agnostic parsing (Task 1). |
| `lib/__tests__/spanishDictionary.test.ts` | Regression test for stray `\r` (Task 1). |
| `scripts/build-portable.ps1` | Copy and verify both data files (Task 2). |
| `app/spanish-grown-ups/dictionary/page.tsx` | Error state + request-ordering guard (Task 3); import from `lib/spanishNouns` (Task 5). |
| `lib/speech.ts` | Extract `pickVoice`, replace `bestVoiceFor` with `effectiveVoiceFor` (Task 4). |
| `lib/__tests__/speech.test.ts` | Tests for `pickVoice` (Task 4). |
| `components/kid/ParentSettings.tsx` | Warn from the voice actually in use (Task 4). |
| `components/VoicePicker.tsx` | Mark wrong-variety voices (Task 4). |
| `app/spanish-grown-ups/spelling/page.tsx` | Import the pool from `lib/spanishStress`, show bare syllables (Task 6). |
| `components/PathChooser.tsx`, `components/SpanishNavBar.tsx`, `app/spanish-grown-ups/page.tsx` | Retire "coming soon" copy and comments (Task 7). |

---

## Task 1: Line-ending-agnostic dictionary parsing (F2)

Do this first: the suite is red until it lands, and every later task's verification depends on a green baseline.

**Files:**
- Modify: `lib/spanishDictionary.ts:47`
- Modify: `lib/__tests__/spanishDictionary.test.ts` (append one test)
- Create: `.gitattributes`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks import. `searchSpanish(query, limit?)` keeps its exact signature — this is a parsing fix, not an API change.

- [ ] **Step 1: Confirm the bug reproduces before touching anything**

```bash
npx vitest run lib/__tests__/spanishDictionary.test.ts
```

Expected: `1 failed | 7 passed`, with
`AssertionError: expected [ 'water\r' ] to include 'water'`.

If it passes instead, your checkout has LF line endings and you cannot see the bug. Force the CRLF state the test needs before continuing:

```bash
git config core.autocrlf true
rm data/wikdict_es_en.tsv && git checkout -- data/wikdict_es_en.tsv
file data/wikdict_es_en.tsv   # must say: with CRLF line terminators
```

- [ ] **Step 2: Write the failing regression test**

Append to `lib/__tests__/spanishDictionary.test.ts`, inside the existing `describe("searchSpanish", ...)` block:

```ts
  it("leaves no stray carriage return on the last translation", () => {
    // Windows checks the TSV out with CRLF (core.autocrlf), and the last
    // tab-separated field on each line is the translation list. Splitting
    // on "\n" alone left a \r glued to every entry's final translation,
    // which silently cost exact-match entries their top score tier and
    // printed a control character in the UI.
    for (const r of searchSpanish("water", 10)) {
      for (const t of r.translations) {
        expect(t).toBe(t.trim());
      }
    }
  });
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run lib/__tests__/spanishDictionary.test.ts
```

Expected: `2 failed | 7 passed`. The new test fails with
`expected 'water\r' to be 'water'`.

- [ ] **Step 4: Fix the parser**

In `lib/spanishDictionary.ts`, inside `load()`, replace this line:

```ts
  for (const line of text.split("\n")) {
```

with these three:

```ts
  // Split on either line ending: Windows clones check this file out with
  // CRLF (core.autocrlf, and .gitattributes only helps a fresh checkout),
  // and a trailing \r would ride along on every entry's last translation.
  for (const line of text.split(/\r?\n/)) {
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run lib/__tests__/spanishDictionary.test.ts
```

Expected: `9 passed`. Note the file on disk is still CRLF — that is the point: the parser now copes with it.

- [ ] **Step 6: Run the whole suite**

```bash
npm test
```

Expected: `120 passed`, 0 failed. This is the green baseline every later task must preserve.

- [ ] **Step 7: Pin the checkout to LF as well**

Create `.gitattributes` at the repo root:

```
# Data files parsed line-by-line at runtime check out with LF everywhere,
# including on Windows where core.autocrlf would otherwise rewrite them.
# lib/spanishDictionary.ts tolerates CRLF too - this keeps the raw file
# clean for the build scripts and for anything that reads it by hand.
#
# cedict_ts.u8 is deliberately NOT listed: its parser regex already
# absorbs a trailing \r, and re-normalising 120k lines would bury a real
# diff under line-ending churn.
data/*.tsv text eol=lf
```

Then re-normalise the working copy:

```bash
git add --renormalize data/wikdict_es_en.tsv
rm data/wikdict_es_en.tsv && git checkout -- data/wikdict_es_en.tsv
file data/wikdict_es_en.tsv
```

Expected: `Unicode text, UTF-8 text` with **no** "CRLF" in the description.

- [ ] **Step 8: Run the suite once more, now on an LF checkout**

```bash
npm test
```

Expected: `120 passed`. Both halves of the fix are now proven independently — step 5 proved the parser copes with CRLF, this proves nothing broke on LF.

- [ ] **Step 9: Commit**

```bash
git add lib/spanishDictionary.ts lib/__tests__/spanishDictionary.test.ts .gitattributes data/wikdict_es_en.tsv
git commit -m "fix: parse the Spanish dictionary on CRLF checkouts"
```

- [ ] **Step 10: Review gate.** Run **The Review Gate** above with this focus:

> **Review focus (F2):** `lib/spanishDictionary.ts:47` split parsed lines on `"\n"` only. With `core.autocrlf=true` and no `.gitattributes`, a Windows clone writes `data/wikdict_es_en.tsv` with CRLF, so every entry's *last* tab-separated translation kept a trailing `\r`. `agua` parsed as `["water\r"]`, missing its exact-English-match tier (score 95) and dropping 105 → 98; `hola` parsed as `["hello", "hi\r"]`. The committed test at `lib/__tests__/spanishDictionary.test.ts:22` failed on any such clone. The fix must make the parser tolerate both line endings **and** must not rely on `.gitattributes` alone, which does nothing for clones that already exist.

---

## Task 2: Ship the Spanish dictionary in the portable build (F1)

**Files:**
- Modify: `scripts/build-portable.ps1` (the "2/5 Laying out app files" section, around lines 28-31)
- Create: `lib/__tests__/portableBuild.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: nothing importable. The new test is a standing guard, not a library.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/portableBuild.test.ts`:

```ts
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// Next's standalone output traces *imports*. A data file opened at
// runtime through fs.readFileSync(path.join(process.cwd(), "data", …))
// is invisible to it, so it only reaches the portable app if
// build-portable.ps1 copies it by name. Nothing else notices when it
// doesn't: the app builds, starts, and 500s on the first search. This
// test is what notices — including for the next data file someone adds.

const root = process.cwd();

/** Every data file the server reads at runtime, found in lib/*.ts. */
function runtimeDataFiles(): string[] {
  const dir = path.join(root, "lib");
  const found = new Set<string>();
  const re = /path\.join\(\s*process\.cwd\(\)\s*,\s*"data"\s*,\s*"([^"]+)"\s*\)/g;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(dir, name), "utf8");
    for (const m of src.matchAll(re)) found.add(m[1]);
  }
  return [...found].sort();
}

describe("portable build", () => {
  const script = fs.readFileSync(
    path.join(root, "scripts", "build-portable.ps1"),
    "utf8"
  );

  it("still recognises how the loaders open their data files", () => {
    // Guards the guard: if someone changes the readFileSync idiom, the
    // test below would silently pass over an empty list.
    expect(runtimeDataFiles()).toEqual(["cedict_ts.u8", "wikdict_es_en.tsv"]);
  });

  it("copies every runtime-read data file into the package", () => {
    for (const file of runtimeDataFiles()) {
      expect(script).toContain(file);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run lib/__tests__/portableBuild.test.ts
```

Expected: the second test FAILS — the script contains `cedict_ts.u8` but not `wikdict_es_en.tsv`. The first test passes.

- [ ] **Step 3: Fix the packager**

In `scripts/build-portable.ps1`, replace these three lines:

```powershell
# The dictionary file is read at runtime with fs, so bundle it explicitly.
New-Item -ItemType Directory -Force "$dist\app\data" | Out-Null
Copy-Item "$root\data\cedict_ts.u8" "$dist\app\data\" -Force
```

with:

```powershell
# The dictionaries are opened at runtime with fs, so Next's standalone
# tracing never sees them - they have to be named here. A missing one
# doesn't fail the build, it 500s the first search in the shipped app,
# so verify each landed rather than trusting Copy-Item.
# lib/__tests__/portableBuild.test.ts fails if this list falls behind.
New-Item -ItemType Directory -Force "$dist\app\data" | Out-Null
foreach ($f in @("cedict_ts.u8", "wikdict_es_en.tsv")) {
  Copy-Item "$root\data\$f" "$dist\app\data\" -Force
  if (-not (Test-Path "$dist\app\data\$f")) { throw "data\$f missing from package" }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run lib/__tests__/portableBuild.test.ts
```

Expected: `2 passed`.

- [ ] **Step 5: Prove it end-to-end with a real package build**

The unit test checks the script's text; this checks the script's effect. It takes a few minutes.

```bash
powershell -ExecutionPolicy Bypass -File scripts/build-portable.ps1
ls dist-portable/BeginnersMandarin/app/data/
```

Expected: the build reaches "Done." and the listing shows **both** `cedict_ts.u8` and `wikdict_es_en.tsv`.

Then start the packaged app and search it — this is the exact path that was broken. Launch `dist-portable/BeginnersMandarin/BeginnersMandarin.exe`, open `http://127.0.0.1:3210/spanish-grown-ups/dictionary`, type `water`, and confirm `agua` comes back. Stop it with `dist-portable/BeginnersMandarin/Stop Beginners Mandarin.bat`.

- [ ] **Step 6: Run the whole suite**

```bash
npm test
```

Expected: `122 passed`, 0 failed.

- [ ] **Step 7: Commit**

`dist-portable/` is build output — confirm it is not staged.

```bash
git status --short
git add scripts/build-portable.ps1 lib/__tests__/portableBuild.test.ts
git commit -m "fix: ship the Spanish dictionary in the portable build"
```

- [ ] **Step 8: Review gate.** Run **The Review Gate** above with this focus:

> **Review focus (F1):** `scripts/build-portable.ps1:30` copied only `data/cedict_ts.u8` into `dist-portable\BeginnersMandarin\app\data\`. PR #11 added a second runtime-read data file, `data/wikdict_es_en.tsv`, loaded at `lib/spanishDictionary.ts:41` via `fs.readFileSync(path.join(process.cwd(), "data", ...))` — a path Next's standalone tracing cannot follow. In the shipped portable app every `/api/search-es` request therefore threw `ENOENT` and returned 500, so the Spanish Talking Dictionary returned nothing for every query. The fix must get the file into the package, and should make a future third data file fail loudly rather than silently.

---

## Task 3: Make dictionary search report failures and ignore stale responses (F3)

**Files:**
- Modify: `app/spanish-grown-ups/dictionary/page.tsx` (the state block, `onQueryChange`, the `useEffect`, and the message blocks in the JSX)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing. Internal component state only.

**Why there is no unit test here:** `vitest.config.mts` runs in the node environment with no jsdom, and this plan does not add one (see Global Constraints). The verification below drives the real component in a real browser through both failure modes, deterministically.

- [ ] **Step 1: Reproduce the silent failure**

Force the exact 500 that F1 produced, by hiding the data file from the dev server:

```bash
npm run dev
```

With the dev server up, in a second shell:

```bash
mv data/wikdict_es_en.tsv data/wikdict_es_en.tsv.hidden
```

Open `http://localhost:3000/spanish-grown-ups/dictionary`, type `water`, and watch.

Expected (the bug): "Searching…" appears and vanishes, then **nothing** — no results, no "No matches" line. The browser console shows an uncaught promise rejection. Note this down; it is what the fix must change.

- [ ] **Step 2: Reproduce the stale-response race**

Restore the file, then widen the network window so the race is hand-reachable:

```bash
mv data/wikdict_es_en.tsv.hidden data/wikdict_es_en.tsv
```

In DevTools → Network, set throttling to **Slow 3G**. Type `water`, wait ~1 s for the request to appear in the Network panel, then clear the search box entirely before the response lands.

Expected (the bug): the box is empty but a list of results appears under it.

- [ ] **Step 3: Add the error state and the request-ordering guard**

In `app/spanish-grown-ups/dictionary/page.tsx`, replace the state block with:

```tsx
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
```

Replace `onQueryChange` with:

```tsx
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
```

Replace the whole `useEffect` with:

```tsx
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
```

- [ ] **Step 4: Show the error, and stop the two messages colliding**

Replace the existing "no matches" block with these two blocks:

```tsx
      {error && !loading && (
        <p className="mt-6 text-center text-zinc-500">
          Couldn&apos;t reach the dictionary. Check your connection and try
          again.
        </p>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <p className="mt-6 text-center text-zinc-500">
          No matches for &ldquo;{query}&rdquo; — try a simpler word.
        </p>
      )}
```

- [ ] **Step 5: Verify the failure path**

```bash
mv data/wikdict_es_en.tsv data/wikdict_es_en.tsv.hidden
```

Reload the page, type `water`.

Expected: "Couldn't reach the dictionary. Check your connection and try again." No uncaught rejection in the console.

Then restore and confirm the happy path still works:

```bash
mv data/wikdict_es_en.tsv.hidden data/wikdict_es_en.tsv
```

Reload, type `water` → `agua` appears. Type `zzzqx` → "No matches for "zzzqx"" appears, and the connection message does **not**.

- [ ] **Step 6: Verify the race is closed**

With Network throttling still at **Slow 3G**: type `water`, wait for the request to appear, clear the box before it lands.

Expected: the box stays empty and no results appear.

Then type `wat`, and before it resolves type `dog`.

Expected: the final list is the results for `dog`, and it does not flicker back to `wat`'s results afterwards.

Turn throttling off. Confirm `git status --short` shows no leftover `.hidden` file.

- [ ] **Step 7: Run the whole suite and the type check**

```bash
npm test
npx tsc --noEmit
```

Expected: `122 passed`; `tsc` reports only the two known `.next/**/validator.ts` errors from Global Constraints.

- [ ] **Step 8: Commit**

```bash
git add app/spanish-grown-ups/dictionary/page.tsx
git commit -m "fix: report dictionary search failures and drop stale responses"
```

- [ ] **Step 9: Review gate.** Run **The Review Gate** above with this focus:

> **Review focus (F3):** `app/spanish-grown-ups/dictionary/page.tsx:73` — the debounced `async` callback had `try { … } finally { setLoading(false) }` and no `catch`. Any fetch failure (offline, or a 500 from the API) rejected inside a `setTimeout` callback, producing an unhandled rejection and a UI showing nothing at all: the spinner cleared, `searched` stayed `false`, so neither results nor a "no matches"/error message appeared — the search box just looked inert. The same block had no request-ordering guard: once the timer had fired, clearing the input (which sets `results: []`, `searched: false`) could not cancel the in-flight fetch, so results reappeared under an empty search box, and two overlapping requests could land out of order. Check especially that a non-2xx response is treated as a failure (fetch does not reject on 500) and that the error and "no matches" messages can never both render.

---

## Task 4: Stop a Castilian voice choice leaking into the kid path (F4)

**Files:**
- Modify: `lib/speech.ts` (add `pickVoice`; replace `bestVoiceFor` with `effectiveVoiceFor`; use `pickVoice` inside `speak`)
- Modify: `lib/__tests__/speech.test.ts` (append one `describe` block)
- Modify: `components/kid/ParentSettings.tsx:22-35`
- Modify: `components/VoicePicker.tsx` (the `CONFIG` map and the voice list item)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces, both exported from `lib/speech.ts`:
  - `pickVoice<T extends { name: string }>(voices: T[], preferredName?: string | null): T | undefined`
  - `effectiveVoiceFor(lang: string, prefer?: string[], avoid?: string[]): SpeechSynthesisVoice | undefined`
- **Removes:** `bestVoiceFor`. Verified before writing this plan — `components/kid/ParentSettings.tsx:28` is its *only* caller, and that caller is precisely the one this task proves was asking the wrong question. Leaving it exported would leave a near-duplicate of `effectiveVoiceFor` that differs only in the bug. Replace it; do not keep both.
- **Do not touch `hasVoiceFor`.** It is also uncalled, but it was uncalled before this task and removing it is unrelated scope.

- [ ] **Step 1: Write the failing test**

Append to `lib/__tests__/speech.test.ts`:

```ts
describe("pickVoice", () => {
  // Ranked best-first, the way voicesFor() returns them: the Latin
  // American voice this course wants, then the Castilian one it avoids.
  const voices = [
    { name: "Microsoft Dalia", lang: "es-MX" },
    { name: "Microsoft Helena", lang: "es-ES" },
  ];

  it("uses the saved preference even when it is not the best-ranked voice", () => {
    // This is the whole point: settings must be able to see the same
    // wrong-variety choice that speak() will actually make.
    expect(pickVoice(voices, "Microsoft Helena")?.name).toBe(
      "Microsoft Helena"
    );
  });

  it("falls back to the best-ranked voice when the saved one is uninstalled", () => {
    expect(pickVoice(voices, "Microsoft Gone")?.name).toBe("Microsoft Dalia");
  });

  it("falls back to the best-ranked voice when nothing is saved", () => {
    expect(pickVoice(voices, null)?.name).toBe("Microsoft Dalia");
    expect(pickVoice(voices)?.name).toBe("Microsoft Dalia");
  });

  it("returns undefined when the system has no voices at all", () => {
    expect(pickVoice([], "Microsoft Dalia")).toBeUndefined();
  });
});
```

Add `pickVoice` to the existing import at the top of the file:

```ts
import { bestCandidate, pickVoice, rankVoices, scoreMatch } from "@/lib/speech";
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run lib/__tests__/speech.test.ts
```

Expected: FAIL — `pickVoice is not a function` (it does not exist yet).

- [ ] **Step 3: Replace `bestVoiceFor` in `lib/speech.ts`**

Delete `bestVoiceFor` entirely — the whole function and its doc comment:

```ts
/**
 * The voice speak() would actually use for a language, so settings can
 * warn when the best available is still the wrong variety.
 */
export function bestVoiceFor(
  lang: string,
  prefer: string[] = [],
  avoid: string[] = []
): SpeechSynthesisVoice | undefined {
  return voicesFor(lang, prefer, avoid)[0];
}
```

Its doc comment already claimed to return "the voice speak() would actually use", which was the bug: it never read the saved preference. Put these two in its place:

```ts
/**
 * The voice a ranked list will actually be spoken with: the saved
 * preference if it is still installed, otherwise the best-ranked one.
 * Exists as one function so speak() and the settings warning can never
 * disagree about which voice is in use — they did, and settings reported
 * a Latin American voice while speak() used the Castilian one a parent
 * had picked.
 */
export function pickVoice<T extends { name: string }>(
  voices: T[],
  preferredName?: string | null
): T | undefined {
  return (
    (preferredName ? voices.find((v) => v.name === preferredName) : undefined) ??
    voices[0]
  );
}

/**
 * The voice speak() would actually use for a language, saved preference
 * included — what the learner will really hear, which is the only honest
 * thing to build a wrong-variety warning on. This replaces bestVoiceFor(),
 * which promised the same thing and delivered the ranking alone, so
 * settings reported a Latin American voice while the app spoke Castilian.
 */
export function effectiveVoiceFor(
  lang: string,
  prefer: string[] = [],
  avoid: string[] = []
): SpeechSynthesisVoice | undefined {
  return pickVoice(
    voicesFor(lang, prefer, avoid),
    getPreferredVoiceName(normTag(lang).split("-")[0])
  );
}
```

- [ ] **Step 4: Route `speak()` through `pickVoice`**

In `speak()`, replace the `wanted`/`chosen` block:

```ts
  const wanted =
    opts?.voiceName ?? getPreferredVoiceName(normTag(lang).split("-")[0]);
  const chosen =
    (wanted ? voices.find((v) => v.name === wanted) : undefined) ??
    voices[0] ??
```

with:

```ts
  const wanted =
    opts?.voiceName ?? getPreferredVoiceName(normTag(lang).split("-")[0]);
  const chosen =
    pickVoice(voices, wanted) ??
```

Leave the long trailing comment and the `(isMandarin ? undefined : voicesFor("en")[0])` fallback exactly as they are.

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run lib/__tests__/speech.test.ts
```

Expected: all pass, including the four new cases.

- [ ] **Step 6: Make the settings warning read the voice actually in use**

In `components/kid/ParentSettings.tsx`, change the import:

```tsx
import { effectiveVoiceFor, subscribeVoices } from "@/lib/speech";
```

and replace the `bestVoiceTag` block with:

```tsx
  // The tag of the voice speak() would actually use ("" = none at all),
  // the grown-up's saved choice included — a warning computed from the
  // automatic ranking alone said "es-MX" while the app spoke es-ES.
  // Voices load async in some browsers; the voiceschanged subscription
  // re-reads once they arrive. Server renders assume the right voice
  // exists so no warning flashes on a healthy machine.
  const voiceTag = useSyncExternalStore(
    subscribeVoices,
    () =>
      effectiveVoiceFor(
        language.speechLang,
        language.preferredVoices,
        language.wrongVarietyVoices
      )
        ?.lang.toLowerCase()
        .replace("_", "-") ?? "",
    () => language.speechLang.toLowerCase()
  );
  const voiceInstalled = voiceTag !== "";
  // The voice in use is a variety this course doesn't teach (a Castilian
  // voice reading the American Spanish course) — whether the system had
  // nothing better or a grown-up picked it in the voice picker.
  const wrongVariety = Boolean(
    language.wrongVarietyVoices?.some((t) => t.toLowerCase() === voiceTag)
  );
```

Then update the remaining references to the old variable name further down the file, and confirm the deleted function has no callers left anywhere:

```bash
grep -n "bestVoiceTag" components/kid/ParentSettings.tsx
grep -rn "bestVoiceFor" --include=*.ts --include=*.tsx . | grep -v node_modules
```

Expected: no matches from either. Rename any surviving `bestVoiceTag` to `voiceTag`; a surviving `bestVoiceFor` means step 3's deletion was incomplete and the build will fail.

- [ ] **Step 7: Mark wrong-variety voices in the picker**

In `components/VoicePicker.tsx`, add three fields to each `CONFIG` entry. For `zh`, after `noMale`:

```ts
    // Mandarin has no wrong-variety list: the course teaches Putonghua
    // and every zh voice is a reasonable reading of it.
    avoid: [] as string[],
    avoidBadge: "",
    avoidNote: "",
```

For `es`, after `noMale`:

```ts
    avoid: LANGUAGES.es.wrongVarietyVoices ?? [],
    avoidBadge: "Spain",
    avoidNote:
      " Voices marked Spain speak Castilian — “gracias” comes out “grathias” — which isn't the American Spanish this course teaches. Picking one changes the audio everywhere, the kids' lessons included.",
```

Inside the `voices.map` callback, add the check next to the existing `gender` line:

```tsx
                  const gender = guessVoiceGender(v.name);
                  const isSel = (selected ?? voices[0]?.name) === v.name;
                  // Ranked last by voicesFor(), but still selectable — a
                  // grown-up may genuinely want it. Say what it is first.
                  const wrongVariety = cfg.avoid.some(
                    (t) =>
                      t.toLowerCase() === v.lang.toLowerCase().replace("_", "-")
                  );
```

and render the badge inside the meta `<span>`, after `{gender ?? ""} {v.lang}`:

```tsx
                          {gender ?? ""} {v.lang}
                          {wrongVariety && ` · ⚠ ${cfg.avoidBadge}`}
```

Finally, extend the footnote paragraph so the note only appears when such a voice is listed. Replace:

```tsx
                {!hasMale && cfg.noMale}
```

with:

```tsx
                {!hasMale && cfg.noMale}
                {voices.some((v) =>
                  cfg.avoid.some(
                    (t) =>
                      t.toLowerCase() === v.lang.toLowerCase().replace("_", "-")
                  )
                ) && cfg.avoidNote}
```

- [ ] **Step 8: Verify in the browser**

```bash
npm run dev
```

This needs a Castilian voice installed. Check first — in the DevTools console on any page:

```js
speechSynthesis.getVoices().filter(v => v.lang.startsWith("es")).map(v => `${v.name} ${v.lang}`)
```

If no `es-ES` voice is listed, install one (Windows Settings → Time & Language → Language → add Spanish (Spain) with Speech, then restart the browser). If you cannot, say so at the review gate rather than marking this step done.

Then:
1. Go to `/spanish-grown-ups`, open the Voice picker. The `es-ES` voice shows `⚠ Spain`, and the note about Castilian appears under the list.
2. Tap the `es-ES` voice — it previews in Castilian.
3. Go to `/learn` on the Spanish course and play a word. It speaks in the Castilian voice (this is the pre-existing leak, now at least disclosed).
4. Open ⚙️ settings on the kid path. It now warns that the voice is the wrong variety — before this change it reported the voice as fine.
5. Back in the picker, choose the `es-MX` voice. The kid path and the settings warning both return to normal.

- [ ] **Step 9: Run the whole suite and the type check**

```bash
npm test
npx tsc --noEmit
```

Expected: `126 passed`; only the two known `.next/**/validator.ts` errors.

- [ ] **Step 10: Commit**

```bash
git add lib/speech.ts lib/__tests__/speech.test.ts components/kid/ParentSettings.tsx components/VoicePicker.tsx
git commit -m "fix: warn about the voice actually in use, not the best available"
```

- [ ] **Step 11: Review gate.** Run **The Review Gate** above with this focus:

> **Review focus (F4):** `lib/speech.ts:194` — `getPreferredVoiceName(normTag(lang).split("-")[0])` applies a persisted voice to *every* utterance in that language, not just Mandarin. The Spanish `VoicePicker` listed all `es-*` voices, Castilian ones included and unmarked, so a parent who tapped "Microsoft Helena — es-ES" in `/spanish-grown-ups` pinned it app-wide and the kid Spanish path then spoke Castilian ("grathias") — exactly what `wrongVarietyVoices` exists to prevent. Worse, the warning at `components/kid/ParentSettings.tsx:28` was computed from `bestVoiceFor(...)`, which reads only the automatic ranking and ignores the stored preference, so settings reported the voice as fine while `speak()` used the wrong-variety one. Check that `speak()` and the settings warning now derive from the same function, that `bestVoiceFor`'s remaining callers still want ranking-only semantics, and that `useSyncExternalStore`'s snapshot still returns a primitive (an object identity would loop).

---

## Task 5: Show the article that is actually correct for the headword (F7)

**Files:**
- Create: `lib/spanishNouns.ts`
- Create: `lib/__tests__/spanishNouns.test.ts`
- Modify: `app/spanish-grown-ups/dictionary/page.tsx` (delete the local `ARTICLE`, `EL_FEMININE`, `articleFor`, `POS_LABEL`, `spokenForm`; import them instead)

**Interfaces:**
- Consumes: nothing from earlier tasks. Task 3 already edited this page — rebase/merge cleanly on top of it.
- Produces, exported from `lib/spanishNouns.ts`:
  - `articleFor(word: string, pos: string): string | undefined`
  - `spokenForm(word: string, pos: string): string`
  - `posLabel(word: string, pos: string): string | undefined`

  Note the signature change: the page's old helpers took a `Result` object. The new ones take `(word, pos)` so the module stays free of the page's local `Result` interface.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/spanishNouns.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { articleFor, posLabel, spokenForm } from "../spanishNouns";

describe("articleFor", () => {
  it("gives plain masculine and feminine nouns their article", () => {
    expect(articleFor("libro", "nm")).toBe("el");
    expect(articleFor("casa", "nf")).toBe("la");
  });

  it("gives a stressed a- feminine noun its masculine article", () => {
    // "la agua" is wrong Spanish; the article changes, the gender doesn't.
    expect(articleFor("agua", "nf")).toBe("el");
    expect(articleFor("águila", "nf")).toBe("el");
  });

  it("treats an nmf headword whose feminine is a different word as masculine", () => {
    // WikDict tags perro/perra, actor/actriz and abuelo/abuela nmf, but
    // the headword it stores is only the masculine one — "el/la perro"
    // is not Spanish, and printing it also cost these 417 entries their
    // spoken article.
    expect(articleFor("perro", "nmf")).toBe("el");
    expect(articleFor("actor", "nmf")).toBe("el");
    expect(articleFor("abuelo", "nmf")).toBe("el");
  });

  it("keeps el/la for genuinely common-gender nouns", () => {
    // One spelling, either gender: el artista and la artista are both
    // right, so neither article can be dropped.
    expect(articleFor("activista", "nmf")).toBe("el/la");
    expect(articleFor("gimnasta", "nmf")).toBe("el/la");
    expect(articleFor("poeta", "nmf")).toBe("el/la");
  });

  it("gives non-nouns no article at all", () => {
    expect(articleFor("hola", "interj")).toBeUndefined();
    expect(articleFor("comer", "v")).toBeUndefined();
    expect(articleFor("rápido", "adj")).toBeUndefined();
  });
});

describe("spokenForm", () => {
  it("speaks a noun with its article, because the article is part of the word", () => {
    expect(spokenForm("casa", "nf")).toBe("la casa");
    expect(spokenForm("agua", "nf")).toBe("el agua");
    expect(spokenForm("perro", "nmf")).toBe("el perro");
  });

  it("speaks a common-gender noun bare", () => {
    // "el/la" is a written shorthand — read aloud it is nonsense.
    expect(spokenForm("activista", "nmf")).toBe("activista");
  });

  it("speaks a non-noun exactly as written", () => {
    expect(spokenForm("hola", "interj")).toBe("hola");
  });
});

describe("posLabel", () => {
  it("labels an nmf headword by what it actually is", () => {
    expect(posLabel("perro", "nmf")).toBe("noun (m.)");
    expect(posLabel("activista", "nmf")).toBe("noun (m./f.)");
  });

  it("labels the other tags from the fixed table", () => {
    expect(posLabel("casa", "nf")).toBe("noun (f.)");
    expect(posLabel("comer", "v")).toBe("verb");
  });

  it("returns undefined for a tag it has no label for", () => {
    expect(posLabel("algo", "")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run lib/__tests__/spanishNouns.test.ts
```

Expected: FAIL — `Cannot find module '../spanishNouns'`.

- [ ] **Step 3: Create `lib/spanishNouns.ts`**

```ts
// How a dictionary entry's part-of-speech tag becomes the article and
// label shown beside the word. Pure and separate from the page so the
// gender rules can be tested — the page cannot be, this repo's vitest
// setup has no DOM.

/**
 * Feminine nouns that begin with a STRESSED a-/ha- take "el" in the
 * singular (el agua, el águila) — "la agua" is wrong Spanish. Detecting
 * the stress needs syllabification, so the common cases are listed.
 */
const EL_FEMININE = new Set([
  "agua", "águila", "ala", "alba", "alga", "alma", "ama", "ancla", "ansia",
  "area", "área", "arma", "arpa", "asma", "asta", "aula", "ave", "aya",
  "haba", "habla", "hacha", "hada", "hambre", "haya",
]);

const ARTICLE: Record<string, string> = { nm: "el", nf: "la" };

const POS_LABEL: Record<string, string> = {
  nm: "noun (m.)",
  nf: "noun (f.)",
  n: "noun",
  prop: "name",
  adj: "adjective",
  v: "verb",
  adv: "adverb",
  loc: "phrase",
  interj: "interjection",
  saying: "saying",
};

/**
 * WikDict's nmf tag covers two different things, and only one of them is
 * common-gender. "activista" and "gimnasta" really do take either article
 * on the same spelling; "perro", "actor" and "abuelo" are masculine
 * headwords whose feminine is a different word (perra, actriz, abuela).
 * The invariable ones all end in -a, which is what this tests — 43 of the
 * 460 nmf entries. The other 417 were being shown as "el/la perro".
 */
const isCommonGender = (word: string) => /a$/.test(word);

/** The article to show beside a headword, or undefined for non-nouns. */
export function articleFor(word: string, pos: string): string | undefined {
  if (pos === "nf" && EL_FEMININE.has(word)) return "el";
  if (pos === "nmf") return isCommonGender(word) ? "el/la" : "el";
  return ARTICLE[pos];
}

/** What the 🔊 button says: "el perro", "la casa", or just the word. */
export function spokenForm(word: string, pos: string): string {
  const article = articleFor(word, pos);
  // el/la is a written shorthand, not sayable — speak those bare.
  return article && article !== "el/la" ? `${article} ${word}` : word;
}

/** The grey tag beside the headword, or undefined if there is none. */
export function posLabel(word: string, pos: string): string | undefined {
  // Matches articleFor: an nmf headword shown as "el perro" must not
  // then be labelled "noun (m./f.)".
  if (pos === "nmf") return isCommonGender(word) ? "noun (m./f.)" : "noun (m.)";
  return POS_LABEL[pos];
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run lib/__tests__/spanishNouns.test.ts
```

Expected: `11 passed`.

- [ ] **Step 5: Point the page at the new module**

In `app/spanish-grown-ups/dictionary/page.tsx`, delete the local `ARTICLE`, `EL_FEMININE`, `articleFor`, `POS_LABEL` and `spokenForm` definitions (everything between the `Result` interface and `export default function`, except the `const es = LANGUAGES.es;` line), and add the import:

```tsx
import { articleFor, posLabel, spokenForm } from "@/lib/spanishNouns";
```

Then update the three call sites. The speak button:

```tsx
            <SpeakButton
              text={spokenForm(r.word, r.pos)}
```

and the headword block:

```tsx
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
```

- [ ] **Step 6: Verify in the browser**

```bash
npm run dev
```

At `http://localhost:3000/spanish-grown-ups/dictionary`:

| Search | Expected display | Expected 🔊 |
|---|---|---|
| `perro` | **el** perro · noun (m.) | "el perro" |
| `actor` | **el** actor · noun (m.) | "el actor" |
| `abuelo` | **el** abuelo · noun (m.) | "el abuelo" |
| `activista` | **el/la** activista · noun (m./f.) | "activista" |
| `agua` | **el** agua · noun (f.) | "el agua" |
| `casa` | **la** casa · noun (f.) | "la casa" |
| `hola` | hola · interjection (no article) | "hola" |

- [ ] **Step 7: Run the whole suite and the type check**

```bash
npm test
npx tsc --noEmit
```

Expected: `137 passed`; only the two known `.next/**/validator.ts` errors.

- [ ] **Step 8: Commit**

```bash
git add lib/spanishNouns.ts lib/__tests__/spanishNouns.test.ts app/spanish-grown-ups/dictionary/page.tsx
git commit -m "fix: stop the dictionary teaching \"el/la perro\""
```

- [ ] **Step 9: Review gate.** Run **The Review Gate** above with this focus:

> **Review focus (F7):** `app/spanish-grown-ups/dictionary/page.tsx:17` mapped `ARTICLE.nmf` to `"el/la"` for all 460 `nmf` rows. WikDict uses `nmf` for two different things: genuinely common-gender nouns (`activista`, `gimnasta`, `poeta` — 43 rows, all ending in `-a`) and masculine headwords whose feminine form is a different word (`perro`→`perra`, `actor`→`actriz`, `abuelo`→`abuela` — 417 rows). The result was a teaching app displaying "el/la perro", "el/la actor", "el/la abuelo". `spokenForm` correctly declined to speak an "el/la" form, so those 417 nouns also lost their spoken article. Check that the `-a` heuristic does not misfire on the `nf`/`nm`/non-noun paths, that the part-of-speech label agrees with the article shown, and that no call site of the old `Result`-taking helpers was left behind.

---

## Task 6: Stop the listening quiz printing its own answer (F5)

**Files:**
- Create: `lib/spanishStress.ts`
- Create: `lib/__tests__/spanishStress.test.ts`
- Modify: `app/spanish-grown-ups/spelling/page.tsx` (delete the local `QUIZ` and `wordOf`; import them, and render bare syllables on the buttons)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces, exported from `lib/spanishStress.ts`:
  - `interface StressWord { syllables: string[]; stress: number }`
  - `QUIZ: StressWord[]`
  - `wordOf(q: StressWord): string`
  - `bare(syllable: string): string`
  - `stressByRule(syllables: string[]): number`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/spanishStress.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bare, QUIZ, stressByRule, wordOf } from "../spanishStress";

describe("bare", () => {
  it("strips the accent that would give the answer away", () => {
    expect(bare("lé")).toBe("le");
    expect(bare("zón")).toBe("zon");
    expect(bare("mú")).toBe("mu");
    expect(bare("fá")).toBe("fa");
    expect(bare("ár")).toBe("ar");
  });

  it("leaves an unaccented syllable alone", () => {
    expect(bare("ca")).toBe("ca");
    expect(bare("cue")).toBe("cue");
  });

  it("leaves ñ alone — it is a letter, not an accent", () => {
    expect(bare("ño")).toBe("ño");
    expect(bare("ñá")).toBe("ña");
  });
});

describe("stressByRule", () => {
  it("stresses the second-to-last syllable when the word ends in a vowel, n or s", () => {
    expect(stressByRule(["ca", "sa"])).toBe(0);
    expect(stressByRule(["ven", "ta", "na"])).toBe(1);
    expect(stressByRule(["e", "xa", "men"])).toBe(1);
  });

  it("stresses the last syllable when the word ends in any other consonant", () => {
    expect(stressByRule(["co", "mer"])).toBe(1);
    expect(stressByRule(["ciu", "dad"])).toBe(1);
    expect(stressByRule(["fe", "liz"])).toBe(1);
  });

  it("lets an accent mark override both rules", () => {
    expect(stressByRule(["te", "lé", "fo", "no"])).toBe(1);
    expect(stressByRule(["co", "ra", "zón"])).toBe(2);
    expect(stressByRule(["ár", "bol"])).toBe(0);
  });
});

describe("QUIZ", () => {
  it("annotates every word the way the three rules say", () => {
    // The quiz teaches the rules, so its answer key had better be the
    // rules. This catches a typo'd stress index that no amount of
    // playing the quiz by hand would reliably surface.
    for (const q of QUIZ) {
      expect({ word: wordOf(q), stress: q.stress }).toEqual({
        word: wordOf(q),
        stress: stressByRule(q.syllables),
      });
    }
  });

  it("has no one-syllable words, which have nothing to choose between", () => {
    for (const q of QUIZ) {
      expect(q.syllables.length).toBeGreaterThan(1);
    }
  });

  it("still contains the accented words the quiz depends on", () => {
    const words = QUIZ.map(wordOf);
    for (const w of ["teléfono", "corazón", "música", "fácil", "papá", "árbol"]) {
      expect(words).toContain(w);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run lib/__tests__/spanishStress.test.ts
```

Expected: FAIL — `Cannot find module '../spanishStress'`.

- [ ] **Step 3: Create `lib/spanishStress.ts`**

Move the pool over verbatim — the twelve annotations were checked in review and must not change:

```ts
// The "Find the Stress" quiz pool and the rules behind it. Pure and
// separate from the page so the answer key can be tested against the
// three rules the page teaches.

export interface StressWord {
  /** The word split into syllables, accents intact. */
  syllables: string[];
  /** Index of the stressed syllable. */
  stress: number;
}

export const QUIZ: StressWord[] = [
  { syllables: ["ca", "sa"], stress: 0 },
  { syllables: ["co", "mer"], stress: 1 },
  { syllables: ["es", "cue", "la"], stress: 1 },
  { syllables: ["te", "lé", "fo", "no"], stress: 1 },
  { syllables: ["co", "ra", "zón"], stress: 2 },
  { syllables: ["mú", "si", "ca"], stress: 0 },
  { syllables: ["ven", "ta", "na"], stress: 1 },
  { syllables: ["fá", "cil"], stress: 0 },
  { syllables: ["ciu", "dad"], stress: 1 },
  { syllables: ["pa", "pá"], stress: 1 },
  { syllables: ["ár", "bol"], stress: 0 },
  { syllables: ["fe", "liz"], stress: 1 },
];

export const wordOf = (q: StressWord): string => q.syllables.join("");

const ACCENTED = "áéíóú";

/**
 * The syllable as it appears on a quiz button. The accent mark IS the
 * answer, so printing it turned a listening exercise into a reading one
 * — half the pool was solvable without ever playing the audio. Only the
 * five accented vowels are folded; ñ is a letter, not a stress mark, and
 * has to survive.
 */
export const bare = (syllable: string): string =>
  syllable.replace(/[áéíóú]/g, (c) => "aeiou"[ACCENTED.indexOf(c)]);

/**
 * Where the three rules put the stress, derived rather than looked up.
 * The quiz's own answer key is tested against this.
 */
export function stressByRule(syllables: string[]): number {
  const accented = syllables.findIndex((s) => /[áéíóú]/.test(s));
  if (accented >= 0) return accented; // rule 3: the accent mark wins
  const last = syllables[syllables.length - 1];
  // rule 1 (vowel, n or s) vs rule 2 (any other consonant)
  return /[aeiouns]$/i.test(last) ? syllables.length - 2 : syllables.length - 1;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run lib/__tests__/spanishStress.test.ts
```

Expected: `9 passed`.

- [ ] **Step 5: Point the page at the new module and hide the accents**

In `app/spanish-grown-ups/spelling/page.tsx`, delete the local `QUIZ` array (including its `// Quiz pool:` comment) and the `wordOf` arrow, then add the import beside the others:

```tsx
import { bare, QUIZ, wordOf, type StressWord } from "@/lib/spanishStress";
```

The `quiz` state was typed off the deleted local const (`useState<(typeof QUIZ)[number] | null>`), which would now resolve through the import and work by accident. Name the type instead:

```tsx
  const [quiz, setQuiz] = useState<StressWord | null>(null);
```

Then render the button label bare — this is the fix itself:

```tsx
                    lang="es-MX"
                  >
                    {bare(syl)}
                  </button>
```

Leave the reveal line untouched: it uses `quiz.syllables` with accents intact and upper-cases the answer, which is exactly what should happen *after* the guess.

- [ ] **Step 6: Verify in the browser**

```bash
npm run dev
```

At `http://localhost:3000/spanish-grown-ups/spelling`, scroll to "🎧 Find the Stress" and press "▶ Start quiz" repeatedly until each of the six accented words has come up (`teléfono`, `corazón`, `música`, `fácil`, `papá`, `árbol`).

Expected each time:
- the buttons read `te` `le` `fo` `no` — **no** accent anywhere;
- "🔊 Hear it again" still says *te-LÉ-fo-no* with the accent audible;
- after guessing, the reveal line shows `te-LÉ-fo-no` with the accent restored.

Also confirm an unaccented word (`ventana`, `ciudad`) is unchanged.

- [ ] **Step 7: Run the whole suite and the type check**

```bash
npm test
npx tsc --noEmit
```

Expected: `146 passed`; only the two known `.next/**/validator.ts` errors.

- [ ] **Step 8: Commit**

```bash
git add lib/spanishStress.ts lib/__tests__/spanishStress.test.ts app/spanish-grown-ups/spelling/page.tsx
git commit -m "fix: stop the stress quiz printing its own answer"
```

- [ ] **Step 9: Review gate.** Run **The Review Gate** above with this focus:

> **Review focus (F5):** `app/spanish-grown-ups/spelling/page.tsx:221` — the "Find the Stress" *listening* quiz rendered each syllable as written text, accent mark included. Six of the twelve pool words carry one (`te-lé-fo-no`, `co-ra-zón`, `mú-si-ca`, `fá-cil`, `pa-pá`, `ár-bol`), so half the quiz was answerable by sight without ever playing the audio — defeating the stated purpose ("Hearing it is what makes the accent rules stick"). The fix must strip accents from the button labels only: the spoken word and the post-guess reveal line both still need them. Check that the accent-stripping cannot damage `ñ`, and that the twelve stress annotations moved across unchanged.

---

## Task 7: Retire the "coming soon" copy (F6)

Last, because it is the only task with no behavioural risk, and because the reviewer can then confirm the five tools it now advertises really do all exist.

**Files:**
- Modify: `components/PathChooser.tsx:38-46` (the `GROWN_UP_DOORS` entry and the block comment above the doors)
- Modify: `components/SpanishNavBar.tsx:8-14` (the file comment)
- Modify: `app/spanish-grown-ups/page.tsx:10-15` (the file comment)

**Interfaces:**
- Consumes: nothing. Produces: nothing. Copy and comments only.

- [ ] **Step 1: Confirm every advertised section really exists**

```bash
ls app/spanish-grown-ups/
```

Expected: `dictionary/ flashcards/ layout.tsx page.tsx practice/ sounds/ spelling/` — five tools plus the hub. The new copy below claims exactly these; if one is missing, stop and fix the copy to match reality instead.

- [ ] **Step 2: Update the front door**

In `components/PathChooser.tsx`, change the Spanish grown-up door's description:

```tsx
  {
    href: "/spanish-grown-ups",
    title: "For grown-ups · Spanish",
    desc: "Sounds, dictionary, accents, flashcards, mic practice",
  },
```

and replace the block comment above the doors in the JSX:

```tsx
      {/* The grown-up doors — clear, but deliberately quieter. Both
          languages now have a full toolkit; the lessons themselves live
          in the kid path, which is why each door's list starts with the
          tools rather than with "lessons". */}
```

- [ ] **Step 3: Update the two stale file comments**

In `components/SpanishNavBar.tsx`, replace the doc comment:

```tsx
/**
 * NavBar's Spanish twin: same sticky bar and pill buttons, emerald
 * accent. Lessons is the one link that leaves the section — the kid path
 * already teaches Spanish, so it pins the language first; the rest are
 * the five grown-up tools, sourced from SPANISH_SECTIONS.
 */
```

In `app/spanish-grown-ups/page.tsx`, replace the doc comment:

```tsx
/**
 * The grown-up landing page for Spanish — the same shape as
 * /mandarin-grown-ups. The lessons live in the kid path (which teaches
 * Spanish too); the five tools are sourced from SPANISH_SECTIONS so the
 * cards and the navbar always agree.
 */
```

- [ ] **Step 4: Verify nothing else still says it**

```bash
grep -rn -i "coming soon\|coming-soon\|more coming" --include=*.ts --include=*.tsx --include=*.md . | grep -v node_modules
```

Expected: no output.

- [ ] **Step 5: Verify in the browser**

```bash
npm run dev
```

At `http://localhost:3000`, the Spanish grown-up door reads "Sounds, dictionary, accents, flashcards, mic practice". Follow it and click every navbar pill — each of the five lands on a real, working page, not a placeholder.

- [ ] **Step 6: Run the whole suite and the type check**

```bash
npm test
npx tsc --noEmit
```

Expected: `146 passed`; only the two known `.next/**/validator.ts` errors.

- [ ] **Step 7: Commit**

```bash
git add components/PathChooser.tsx components/SpanishNavBar.tsx app/spanish-grown-ups/page.tsx
git commit -m "docs: the Spanish toolkit is no longer coming soon"
```

- [ ] **Step 8: Review gate.** Run **The Review Gate** above with this focus:

> **Review focus (F6):** `components/PathChooser.tsx:43` read "Lessons and first words with audio — more coming", and the block comment above the grown-up doors still said the full toolkit "only exists for Mandarin". Comments at `components/SpanishNavBar.tsx:12` and `app/spanish-grown-ups/page.tsx:14` still said the other sections "link to their coming-soon pages". PR #11 ships all five tools, so the front door undersold the feature it had just added. Verify the new copy names only sections that actually exist under `app/spanish-grown-ups/`, and that no "coming soon" claim survives anywhere in the tree.

---

## Final verification

Run once, after all seven review gates have returned clean.

- [ ] **Step 1: Full suite from a clean state**

```bash
rm -rf .next
npm test
npx tsc --noEmit
npm run lint
```

Expected: `146 passed`, 0 failed; `tsc` clean (the two known validator errors are gone once `.next` is removed); lint clean.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: build succeeds and `.next/standalone/server.js` exists.

- [ ] **Step 3: Portable package, end to end**

```bash
powershell -ExecutionPolicy Bypass -File scripts/build-portable.ps1
```

Launch `dist-portable/BeginnersMandarin/BeginnersMandarin.exe` and, at `http://127.0.0.1:3210`, walk the whole Spanish toolkit: search `perro` in the dictionary (it says "el perro"), take a stress quiz round on an accented word (the buttons are bare), and open the voice picker (a Castilian voice, if installed, is marked ⚠ Spain). Stop it with `Stop Beginners Mandarin.bat`.

This is the single check that would have caught F1, F7 and F5 together in the artefact users actually receive.

- [ ] **Step 4: Confirm the seven commits are separate and readable**

```bash
git log --oneline master..HEAD
```

Expected: the original PR commit plus seven fix commits, one per finding, in the order of this plan.

- [ ] **Step 5: Push to PR #11**

```bash
git push origin pr-11:spanish-grown-ups
gh pr view 11 --json statusCheckRollup
```

Then comment on the PR summarising which finding each commit closes.
