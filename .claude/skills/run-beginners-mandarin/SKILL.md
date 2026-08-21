---
name: run-beginners-mandarin
description: Build, run, test, and drive the Beginners-Mandarin Next.js app. Use when asked to start the app, run the dev server, take a screenshot of a page, smoke-test the kid lesson path, or confirm a change works in the running app.
---

A Next.js 16 web app (kid language-learning path + grown-up tools),
developed on Windows. Drive it by starting the dev server and running
`.claude/skills/run-beginners-mandarin/driver.mjs` — a playwright-core
script that uses the machine's installed Edge/Chrome headless (no
browser download). All paths are relative to the repo root.

## Prerequisites

Windows with Node 24+ and Microsoft Edge (preinstalled on Windows;
the driver auto-detects Edge or Chrome in the standard locations).
There is no `chromium-cli` on this machine — the driver fills that role.

## Setup

```powershell
npm install
```

`playwright-core` is a devDependency; nothing in this skill may add a
*runtime* dependency (the portable Windows build must stay lean).

## Run (agent path)

Start the dev server in the background, wait for it to serve:

```bash
npm run dev &
timeout 60 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

Then drive it:

```bash
node .claude/skills/run-beginners-mandarin/driver.mjs smoke
node .claude/skills/run-beginners-mandarin/driver.mjs shot learn
```

| command | what it does |
|---|---|
| `smoke` | One real kid-path flow on `/learn/i-am`: warm-up MATCH → solve it by tapping tiles → advance → reload resumes mid-lesson → grown-ups Reset erases the bookmark. Prints `PASS`/`FAIL` per check, exits non-zero on any `FAIL`. |
| `shot <route>` | Screenshot any route — pass it **without** the leading slash (`shot learn`, `shot mandarin-grown-ups`). Omit for the home page. |

Screenshots land in `.claude/skills/run-beginners-mandarin/shots/`
(gitignored). **Look at them** — a blank frame means the page didn't
render. `APP_URL` overrides the base URL (default
`http://localhost:3000`).

Stop the server by killing the port's listener (PowerShell):

```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess -Force
```

## Run (human path)

`npm run dev`, then browse http://localhost:3000. Testing on a real
phone over LAN needs extra setup (allowed dev origins, an insecure-
origin flag for the mic) — see `docs/HANDOFF-2026-08-21-fit-to-viewport.md`.

## Build

Stop the dev server first — it shares `.next/` with the build and the
build goes stale/flaky if both run. Restart it afterwards.

```powershell
npm run build
npx tsc --noEmit   # needs the prior build (Next generates .next/types/)
```

## Test

```powershell
npm test
```

174 tests in 13 files, all passing, ~1s.

## Gotchas

- **Playwright auto-dismisses native dialogs**, so `confirm()` returns
  false and the grown-ups "Reset progress" button silently does
  nothing. Override it first: `page.evaluate(() => { window.confirm =
  () => true; })` (the driver's smoke does this).
- **After a reload mid-lesson the app paints step one, then swaps to
  the resumed step** once `useSyncExternalStore` reads localStorage.
  Wait for the expected step's instruction pill; `networkidle` and
  fixed sleeps race the swap.
- **Git Bash mangles absolute routes**: `shot /learn` arrives as
  `C:/Program Files/Git/learn` (MSYS path conversion). Pass routes
  without the leading slash; the driver detects the mangled form and
  says so.
- **`next dev` rewrites the block at the top of `AGENTS.md`.** Commit
  the change with your work; deleting it only recreates the diff.
- **Plain `node` cannot import `lib/*.ts`** — the modules use
  extensionless imports Node can't resolve. To poke pure logic
  (e.g. `buildSteps`), write a throwaway file under `lib/__tests__/`
  and run it with `npx vitest run <file>`; don't fight the resolver.
- **Headless speech**: localhost is a secure context so the speech
  APIs exist and nothing throws, but there's no audio or mic — SAY
  steps show a Skip button, which is enough to advance.
- The kid-path state lives in localStorage under `mandarin-kid-v1`
  (progress) and `mandarin-kid-resume-v1` (mid-lesson bookmark). The
  driver launches a fresh browser context per run, so every run
  starts clean.

## Troubleshooting

- **`Nothing serving at http://localhost:3000`** (from the driver):
  the dev server isn't up — start it as above.
- **`page.goto: Cannot navigate to invalid URL … Program Files/Git…`**:
  you passed a route with a leading slash from Git Bash. Drop the
  slash or set `MSYS_NO_PATHCONV=1`.
- **`No Edge/Chrome found in the standard install locations`**: edit
  the `BROWSERS` list at the top of the driver with the machine's
  browser path.
