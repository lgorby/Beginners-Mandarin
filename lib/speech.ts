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

// --- Speech recognition -------------------------------------------------

type RecognitionCtor = new () => SpeechRecognition;

export function getRecognizer(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "zh-CN";
  rec.interimResults = false;
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
