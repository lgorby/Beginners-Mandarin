// Measures whether each page fits its viewport, across the four screen
// sizes the layout targets. No automated test can catch a layout
// regression, but this catches the one thing that matters here: a box
// the user would have to scroll.
//
// "Fits" means the window does not scroll AND no inner region overflows.
// Content that outgrows its box pages instead of scrolling
// (components/Paged.tsx): a paged box counts as fitting — nothing moves
// and everything is reachable through its ‹ › controls — and is shown
// as "pages" for information. Two things are regressions and fail the
// run: a scrolling WINDOW (the one-viewport shell in app/layout.tsx is
// broken), and a paged box that overflows WITHOUT rendering its
// controls (content would be unreachable).
//
// Usage (two terminals, or background the first):
//
//   npm run build
//   cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
//   cd .next/standalone && PORT=3311 HOSTNAME=127.0.0.1 node server.js
//
//   "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" \
//     --headless=new --remote-debugging-port=9222 --disable-gpu \
//     --user-data-dir=%TEMP%\fitcheck about:blank
//
//   APP=http://127.0.0.1:3311 node scripts/fit-check.mjs
//
// Chrome works in place of Edge. Nothing here is installed by the repo:
// it drives the browser over CDP with Node's built-in WebSocket.

const CDP = process.env.CDP || "http://127.0.0.1:9222";
const APP = process.env.APP || "http://127.0.0.1:3311";

// 1366x640 is a 1366x768 laptop after browser chrome — the tightest
// common case, tighter than most phones in portrait.
const VIEWPORTS = [
  { name: "desktop 1920x1080", w: 1920, h: 1080 },
  { name: "laptop  1366x640 ", w: 1366, h: 640 },
  { name: "phone   390x844  ", w: 390, h: 844 },
  { name: "phoneL  844x390  ", w: 844, h: 390 },
];

// `click` runs after load, to reach a state a URL cannot.
const PAGES = [
  { path: "/", label: "front door" },
  { path: "/learn", label: "kid map" },
  { path: "/learn/hello", label: "kid MEET step" },
  {
    path: "/learn/hello",
    label: "kid SAY step",
    click: `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Next')?.click()`,
  },
  { path: "/mandarin-grown-ups", label: "zh hub" },
  { path: "/tones", label: "zh tones" },
  { path: "/lessons", label: "zh lesson list" },
  { path: "/lessons/greetings", label: "zh lesson" },
  { path: "/dictionary", label: "zh dictionary" },
  { path: "/practice", label: "zh practice" },
  { path: "/strokes", label: "zh strokes" },
  { path: "/characters", label: "zh characters" },
  { path: "/flashcards", label: "zh flashcards" },
  { path: "/spanish-grown-ups", label: "es hub" },
  { path: "/spanish-grown-ups/sounds", label: "es sounds" },
  { path: "/spanish-grown-ups/spelling", label: "es spelling" },
  { path: "/spanish-grown-ups/dictionary", label: "es dictionary" },
  { path: "/spanish-grown-ups/practice", label: "es practice" },
  { path: "/spanish-grown-ups/flashcards", label: "es flashcards" },
  { path: "/mic-test", label: "mic test" },
];

const MEASURE = `(() => {
  const out = { page: 0, scrollers: [], hScroll: 0, paged: [], broken: [] };
  const de = document.scrollingElement || document.documentElement;
  out.page = Math.max(0, de.scrollHeight - window.innerHeight);
  out.hScroll = Math.max(0, de.scrollWidth - window.innerWidth);
  const desc = (el) => {
    const cls = (el.className && typeof el.className === 'string')
      ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.')
      : '';
    return el.tagName.toLowerCase() + cls;
  };
  for (const el of document.querySelectorAll('*')) {
    const over = el.scrollHeight - el.clientHeight;
    if (over <= 2) continue;
    if (el.clientHeight === 0) continue;
    if (el.hasAttribute('data-paged')) {
      // An overflowing Paged viewport must show its controls, or the
      // rest of its content is unreachable.
      const root = el.closest('[data-paged-root]');
      const target = root && root.querySelector('[data-pager]') ? 'paged' : 'broken';
      out[target].push({ el: desc(el), over });
      continue;
    }
    if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY)) continue;
    out.scrollers.push({ el: desc(el), over });
  }
  return JSON.stringify(out);
})()`;

let msgId = 0;
function rpc(ws, method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== id) return;
      ws.removeEventListener("message", onMsg);
      m.error
        ? reject(new Error(method + ": " + m.error.message))
        : resolve(m.result);
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targets = await (await fetch(CDP + "/json/list")).json();
const target = targets.find((t) => t.type === "page");
if (!target) throw new Error("No page target at " + CDP + " — is the browser running with --remote-debugging-port?");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
await rpc(ws, "Page.enable");
await rpc(ws, "Runtime.enable");

let clean = 0;
let paged = 0;
let total = 0;
let windowScrolls = 0;
let brokenPagers = 0;
const problems = [];

for (const vp of VIEWPORTS) {
  await rpc(ws, "Emulation.setDeviceMetricsOverride", {
    width: vp.w,
    height: vp.h,
    deviceScaleFactor: 1,
    mobile: vp.w < vp.h && vp.w < 500,
  });
  console.log("\n=== " + vp.name + " ===");
  for (const p of PAGES) {
    await rpc(ws, "Page.navigate", { url: APP + p.path });
    await sleep(700);
    if (p.click) {
      await rpc(ws, "Runtime.evaluate", { expression: p.click });
      await sleep(500);
    }
    const res = await rpc(ws, "Runtime.evaluate", {
      expression: MEASURE,
      returnByValue: true,
    });
    const m = JSON.parse(res.result.value);
    total++;
    const bits = [];
    if (m.page > 2) {
      bits.push("WINDOW SCROLLS by " + m.page + "px");
      windowScrolls++;
    }
    if (m.hScroll > 2) bits.push("H-SCROLL by " + m.hScroll + "px");
    for (const b of m.broken) {
      bits.push("PAGED BOX WITHOUT CONTROLS " + b.el + " +" + b.over + "px");
      brokenPagers++;
    }
    for (const s of m.scrollers) bits.push(s.el + " +" + s.over + "px");
    const pageNote = m.paged.length
      ? "  (pages: " + m.paged.map((s) => s.el + " +" + s.over + "px").join("; ") + ")"
      : "";
    if (bits.length === 0) {
      clean++;
      if (m.paged.length) {
        paged++;
        console.log("  pages  " + p.label.padEnd(16) + p.path + pageNote);
      } else {
        console.log("  fits   " + p.label.padEnd(16) + p.path);
      }
    } else {
      console.log("  scroll " + p.label.padEnd(16) + p.path + "  ->  " + bits.join("; ") + pageNote);
      problems.push(vp.name.trim() + " | " + p.label + " | " + bits.join("; "));
    }
  }
}

console.log("\n" + clean + "/" + total + " page-viewport combinations fit with no scrolling at all (" + paged + " of them via ‹ › pages).");
console.log(windowScrolls + " scroll the window (must be 0 — see app/layout.tsx).");
console.log(brokenPagers + " paged boxes overflow without controls (must be 0 — see components/Paged.tsx).");
if (problems.length) {
  console.log("\nScrolling remains here:");
  for (const p of problems) console.log("  - " + p);
}
ws.close();
process.exitCode = windowScrolls === 0 && brokenPagers === 0 ? 0 : 1;
