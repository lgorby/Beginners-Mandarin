// Drives the running app in a headless browser. Agent tooling, not
// product surface — see SKILL.md next to this file for how to use it.
//
//   node .claude/skills/run-beginners-mandarin/driver.mjs smoke
//   node .claude/skills/run-beginners-mandarin/driver.mjs shot /learn
//
// Assumes `npm run dev` is already serving on port 3000. Uses the
// machine's installed Edge/Chrome via playwright-core (a devDependency)
// — no browser download needed. Screenshots land in shots/ beside this
// file (gitignored).

import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const SHOTS = join(dirname(fileURLToPath(import.meta.url)), "shots");
mkdirSync(SHOTS, { recursive: true });

const BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];
const executablePath = BROWSERS.find((p) => existsSync(p));
if (!executablePath) {
  console.error("No Edge/Chrome found in the standard install locations.");
  process.exit(1);
}

try {
  await fetch(BASE);
} catch {
  console.error(`Nothing serving at ${BASE} — start it first: npm run dev`);
  process.exit(1);
}

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({
  viewport: { width: 900, height: 700 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

let failed = false;
const check = (label, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failed = true;
};
const shot = async (name) => {
  await page.screenshot({ path: join(SHOTS, `${name}.png`) });
  console.log(`shot  ${join(SHOTS, `${name}.png`)}`);
};
// The instruction pill is the one button holding the 🔊 replay icon.
const instruction = async () =>
  (await page.locator("button:has-text('🔊')").first().innerText())
    .replace(/[^\p{L} ]/gu, "")
    .trim();
const bookmark = () =>
  page.evaluate(() => localStorage.getItem("mandarin-kid-resume-v1"));

const [, , command = "smoke", arg] = process.argv;

if (command === "shot") {
  // Screenshot any route: node driver.mjs shot learn
  // No leading slash — Git Bash's MSYS layer rewrites "/learn" into a
  // Windows path ("C:/Program Files/Git/learn") before node sees it.
  if (/^[A-Za-z]:[\\/]/.test(arg ?? "")) {
    console.error(
      `The shell converted the route into "${arg}" — pass it without ` +
        "the leading slash (shot learn), or set MSYS_NO_PATHCONV=1.",
    );
    process.exit(1);
  }
  const route = (arg ?? "").replace(/^\/+/, "");
  await page.goto(`${BASE}/${route}`);
  await page.waitForLoadState("networkidle");
  await shot(route.replaceAll("/", "_") || "home");
} else if (command === "smoke") {
  // One real kid-path flow: warm-up MATCH → solve → advance → reload
  // resumes mid-lesson → reset erases the bookmark. Fresh context each
  // run, so localStorage always starts empty and the flow is stable.
  await page.goto(`${BASE}/learn/i-am`);
  await page.waitForSelector("div.flex.flex-wrap button[aria-label]", {
    timeout: 30000, // first compile of the route can be slow
  });
  check("lesson 2 opens with a warm-up MATCH",
    (await instruction()) === "Tap the right picture");
  await shot("1-warmup-match");

  // Solve the MATCH without knowing the answer: tap tiles until Next
  // enables. Wrong taps just show "Try again", they never block.
  const tiles = page.locator("div.flex.flex-wrap button[aria-label]");
  const next = page.locator("button:has-text('Next'):not([disabled])");
  for (let i = 0; i < (await tiles.count()); i++) {
    await tiles.nth(i).click();
    await page.waitForTimeout(200);
    if (await next.count()) break;
  }
  check("a tile solves the MATCH", (await next.count()) > 0);
  await next.click();

  await page.waitForTimeout(400);
  const step2 = await instruction();
  check("advancing moves to the next step", step2 !== "Tap the right picture");
  const saved = JSON.parse((await bookmark()) ?? "null");
  check("one step in, the bookmark holds step 1",
    saved?.lessonId === "i-am" && saved?.step === 1);
  await shot("2-next-step");

  // Reload mid-lesson: hydration paints step one, then the resume
  // store swaps to the saved step — wait for that pill, don't sleep.
  await page.reload();
  await page.waitForSelector(`button:has-text("${step2}")`, {
    timeout: 15000,
  });
  check("reload resumes at the same step", (await instruction()) === step2);
  await shot("3-after-reload");

  // Reset from the grown-ups panel. Playwright auto-dismisses native
  // dialogs (confirm() returns false), so override it first.
  await page.goto(`${BASE}/learn`);
  await page.waitForSelector("button[aria-label='Settings for grown-ups']");
  await page.evaluate(() => { window.confirm = () => true; });
  await page.click("button[aria-label='Settings for grown-ups']");
  await page.click("button:has-text('Reset progress')");
  await page.waitForTimeout(300);
  check("reset erases the bookmark", (await bookmark()) === null);
  await shot("4-after-reset");
} else {
  console.error(`Unknown command "${command}" — use: smoke | shot <route>`);
  failed = true;
}

check("no page errors", errors.length === 0);
if (errors.length) console.error(errors.join("\n"));
await browser.close();
process.exit(failed ? 1 : 0);
