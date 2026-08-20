"use client";

// Browser speech helpers: Mandarin text-to-speech via speechSynthesis
// and speech recognition via the Web Speech API.

let cachedVoices: SpeechSynthesisVoice[] | null = null;

export function getMandarinVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const all = window.speechSynthesis.getVoices();
  if (all.length > 0) {
    cachedVoices = all.filter((v) => /^zh([-_]|$)/i.test(v.lang));
  }
  return cachedVoices ?? [];
}

// --- Voice preference (persisted, used by every speak() call) -----------

const VOICE_KEY = "mandarin-voice-v1";

export function getPreferredVoiceName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

export function setPreferredVoiceName(name: string) {
  try {
    localStorage.setItem(VOICE_KEY, name);
  } catch {
    // storage unavailable — preference just won't persist
  }
}

/**
 * Guess a voice's gender from its name. Reliable for Microsoft's Chinese
 * voices (male names start with Yun- or are Kangkang/Danny; female start
 * with Xiao- or are Huihui/Yaoyao/…) and Google's (female).
 */
export function guessVoiceGender(name: string): "male" | "female" | null {
  const n = name.toLowerCase();
  if (/(kangkang|danny|wanlung|zhiwei|yun[a-z]+)/.test(n)) return "male";
  if (/(xiao[a-z]+|huihui|yaoyao|hanhan|tracy|hiugaai|hiumaan|hsiao[a-z]+|google)/.test(n))
    return "female";
  return null;
}

/** Run cb once voices are available (they load async in some browsers). */
export function onVoicesReady(cb: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (window.speechSynthesis.getVoices().length > 0) {
    cb();
    return;
  }
  window.speechSynthesis.addEventListener("voiceschanged", cb, { once: true });
}

/** Speak Mandarin text aloud. rate < 1 slows it down for learners. */
export function speak(text: string, opts?: { rate?: number; voiceName?: string }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = opts?.rate ?? 0.85;
  const voices = getMandarinVoices();
  const wanted = opts?.voiceName ?? getPreferredVoiceName();
  const chosen =
    (wanted ? voices.find((v) => v.name === wanted) : undefined) ?? voices[0];
  if (chosen) u.voice = chosen;
  window.speechSynthesis.speak(u);
}

export function hasMandarinVoice(): boolean {
  return getMandarinVoices().length > 0;
}

/** Stop any speech immediately (e.g. before the microphone opens). */
export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

let dingCtx: AudioContext | null = null;

/**
 * A short listening cue, played the moment the microphone actually opens.
 * The recognizer takes a beat to connect after the tap — anyone speaking
 * on the tap loses the front of the word, so the ding says "now".
 */
export function ding() {
  if (typeof window === "undefined" || !window.AudioContext) return;
  try {
    dingCtx ??= new AudioContext();
    const ctx = dingCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // A missing cue must never break listening itself.
  }
}

// --- Speech recognition -------------------------------------------------

type RecognitionCtor = new () => SpeechRecognition;

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Whether this browser can score speech at all. Cheap enough to call on
 * every render, unlike getRecognizer(), which constructs a recognizer.
 */
export function hasSpeechRecognition(): boolean {
  return recognitionCtor() !== undefined;
}

export function getRecognizer(lang = "zh-CN"): SpeechRecognition | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = lang;
  // Edge's recognizer often returns an EMPTY final transcript; the text
  // only arrives through interim results, so they must be on.
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  return rec;
}

/** Strip punctuation/whitespace for comparing recognized speech to a target. */
export function normalizeZh(s: string): string {
  return s.replace(/[\s。，！？、．.,!?'"“”‘’]/g, "");
}

/**
 * Score recognized speech against the target phrase: percentage of target
 * characters matched in order (longest common subsequence).
 */
export function scoreMatch(target: string, heard: string): number {
  const a = normalizeZh(target);
  const b = normalizeZh(heard);
  if (!a.length) return 0;
  if (a === b) return 100;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return Math.round((dp[a.length][b.length] / a.length) * 100);
}

/**
 * The best transcript in a recognition event, scored against the target.
 * Considers every alternative of every result plus the joined stream,
 * because browsers disagree about where the text shows up: Chrome's first
 * alternative is often a homophone of the right answer (持 for 吃), and
 * Edge's final transcript is often empty with the real text only in the
 * interim results. Returns score -1 when the event carries no text at all.
 */
export function bestCandidate(
  target: string,
  e: { results: ArrayLike<ArrayLike<Pick<SpeechRecognitionAlternative, "transcript">>> }
): { transcript: string; score: number } {
  const candidates: string[] = [];
  let joined = "";
  for (let i = 0; i < e.results.length; i++) {
    const r = e.results[i];
    joined += r[0]?.transcript ?? "";
    for (let j = 0; j < r.length; j++) {
      if (r[j].transcript) candidates.push(r[j].transcript);
    }
  }
  if (joined) candidates.push(joined);
  let best = { transcript: "", score: -1 };
  for (const c of candidates) {
    const s = scoreMatch(target, c);
    if (s > best.score) best = { transcript: c, score: s };
  }
  return best;
}

/**
 * Wire one recognition attempt and start it. Collects the best candidate
 * across every event and reports it through settle() after the session
 * ends (score -1 = no text at all). error() gets raw error codes plus
 * "nomatch", and never "aborted" (that's our own teardown, not a failure).
 * Returns false if the session could not start.
 */
export function recognizeAttempt(
  rec: SpeechRecognition,
  target: string,
  cb: {
    settle: (best: {
      transcript: string;
      score: number;
      heardSound: boolean;
    }) => void;
    error: (code: string) => void;
    ended: () => void;
    /** Lifecycle, straight from the recognizer's own events — the only
     *  honest signal of whether a session really opened and heard you. */
    phase?: (p: "session" | "mic" | "sound" | "speech") => void;
  }
): boolean {
  let best = { transcript: "", score: -1, heardSound: false };
  rec.onstart = () => cb.phase?.("session");
  rec.onaudiostart = () => cb.phase?.("mic");
  rec.onsoundstart = () => {
    best = { ...best, heardSound: true };
    cb.phase?.("sound");
  };
  rec.onspeechstart = () => {
    best = { ...best, heardSound: true };
    cb.phase?.("speech");
  };
  rec.onresult = (e) => {
    const c = bestCandidate(target, e);
    if (c.score > best.score) best = { ...c, heardSound: best.heardSound };
  };
  rec.onnomatch = () => cb.error("nomatch");
  rec.onerror = (e) => {
    if (e.error !== "aborted") cb.error(e.error);
  };
  rec.onend = () => {
    cb.ended();
    cb.settle(best);
  };
  try {
    rec.start();
    return true;
  } catch {
    rec.abort();
    return false;
  }
}

/**
 * Speak an English instruction aloud, so the kid path is usable by a
 * child who cannot yet read. Separate from speak(), which is zh-CN.
 */
export function speakEnglish(text: string, opts?: { rate?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = opts?.rate ?? 0.95;
  const english = window.speechSynthesis
    .getVoices()
    .find((v) => /^en([-_]|$)/i.test(v.lang));
  if (english) u.voice = english;
  window.speechSynthesis.speak(u);
}
