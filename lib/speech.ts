"use client";

// Browser speech helpers: text-to-speech via speechSynthesis and speech
// recognition via the Web Speech API. Mandarin (zh-CN) is the default
// everywhere so the grown-up section never has to say so; the kid path
// passes each word's own language through.

import { scoreMatch } from "./match";

export { normalizeSpeech, scoreMatch } from "./match";

let cachedVoices: SpeechSynthesisVoice[] | null = null;

export function getMandarinVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const all = window.speechSynthesis.getVoices();
  if (all.length > 0) {
    cachedVoices = all.filter((v) => /^zh([-_]|$)/i.test(v.lang));
  }
  return cachedVoices ?? [];
}

const normTag = (s: string) => s.toLowerCase().replace("_", "-");

/**
 * Order voices best-first: `prefer` tags in their given order, then any
 * unlisted tag, then `avoid` tags last. Pure and exported for tests —
 * this ranking is why a Castilian voice can never beat a Latin American
 * one for the Spanish course.
 */
export function rankVoices<T extends { lang: string }>(
  voices: T[],
  prefer: string[],
  avoid: string[] = []
): T[] {
  const p = prefer.map(normTag);
  const a = avoid.map(normTag);
  const score = (v: T) => {
    const tag = normTag(v.lang);
    const i = p.indexOf(tag);
    if (i >= 0) return i;
    return a.includes(tag) ? p.length + 1 : p.length;
  };
  return [...voices].sort((x, y) => score(x) - score(y));
}

/**
 * Voices for a BCP-47 tag, best match first: the requested region, then
 * `prefer` in order, then other same-language regions, with `avoid`
 * varieties last. Unlike the Mandarin list this is not cached — it is
 * read at speak() time (and by the Spanish VoicePicker).
 */
export function voicesFor(
  lang: string,
  prefer: string[] = [],
  avoid: string[] = []
): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const prefix = normTag(lang).split("-")[0];
  const matches = window.speechSynthesis
    .getVoices()
    .filter((v) => {
      const tag = normTag(v.lang);
      return tag === prefix || tag.startsWith(`${prefix}-`);
    });
  return rankVoices(matches, [lang, ...prefer], avoid);
}

// --- Voice preference (persisted, used by every speak() call) -----------

// One preference per language, so picking a Spanish voice can never make
// a Chinese voice read Spanish (or vice versa). The zh key predates the
// per-language split — renaming it would drop saved choices.
const VOICE_KEYS: Record<string, string> = {
  zh: "mandarin-voice-v1",
  es: "spanish-voice-v1",
};

export function getPreferredVoiceName(langPrefix = "zh"): string | null {
  const key = VOICE_KEYS[langPrefix];
  if (!key || typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setPreferredVoiceName(name: string, langPrefix = "zh") {
  const key = VOICE_KEYS[langPrefix];
  if (!key) return;
  try {
    localStorage.setItem(key, name);
  } catch {
    // storage unavailable — preference just won't persist
  }
}

/**
 * Guess a voice's gender from its name. Reliable for Microsoft's Chinese
 * voices (male names start with Yun- or are Kangkang/Danny; female start
 * with Xiao- or are Huihui/Yaoyao/…), Microsoft's Spanish voices (given
 * names like Raul/Sabina, including the Edge neural set), and Google's
 * (female).
 */
export function guessVoiceGender(name: string): "male" | "female" | null {
  const n = name.toLowerCase();
  if (
    /(kangkang|danny|wanlung|zhiwei|yun[a-z]+|raul|pablo|jorge|alonso|alvaro|álvaro|tomas|tomás|gonzalo|luciano|gerardo|liberto|saul|saúl)/.test(
      n
    )
  )
    return "male";
  if (
    /(xiao[a-z]+|huihui|yaoyao|hanhan|tracy|hiugaai|hiumaan|hsiao[a-z]+|sabina|helena|laura|dalia|paloma|elvira|camila|salome|salomé|elena|ximena|larissa|catalina|sofia|sofía|google)/.test(
      n
    )
  )
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

/**
 * Whether ANY voice for a BCP-47 tag's language is installed. Voices
 * load async in some browsers — pair with subscribeVoices via
 * useSyncExternalStore to re-read when they arrive.
 */
export function hasVoiceFor(lang: string): boolean {
  return voicesFor(lang).length > 0;
}

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

/** Subscribe to the voice list changing, shaped for useSyncExternalStore. */
export function subscribeVoices(cb: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return () => {};
  }
  window.speechSynthesis.addEventListener("voiceschanged", cb);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", cb);
}

/**
 * Speak learner-language text aloud — Mandarin unless `lang` says
 * otherwise. rate < 1 slows it down for learners. onDone fires when the
 * utterance finishes OR is interrupted — callers must check they still
 * want to act (e.g. the hands-free mic open). Each language's persisted
 * voice preference (if any) applies only to that language.
 */
export function speak(
  text: string,
  opts?: {
    rate?: number;
    voiceName?: string;
    onDone?: () => void;
    lang?: string;
    /** Voice tags to try after `lang` itself (regional preference). */
    voicePrefer?: string[];
    /** Voice tags to use only as a last resort (wrong variety). */
    voiceAvoid?: string[];
  }
) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const lang = opts?.lang ?? "zh-CN";
  const isMandarin = /^zh/i.test(lang);
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = opts?.rate ?? 0.85;
  const voices = isMandarin
    ? getMandarinVoices()
    : voicesFor(lang, opts?.voicePrefer, opts?.voiceAvoid);
  const wanted =
    opts?.voiceName ?? getPreferredVoiceName(normTag(lang).split("-")[0]);
  const chosen =
    pickVoice(voices, wanted) ??
    // No voice for this language at all. Never leave the choice to the
    // browser: its default can be ANY installed language, and a Chinese
    // default reading Spanish came out as convincing-sounding Mandarin
    // (a real bug report). An English voice mangles the accent but stays
    // recognisably the right words. Mandarin keeps the old behaviour —
    // hanzi through an English voice is worse than the default, and the
    // grown-up VoicePicker already surfaces missing zh voices.
    (isMandarin ? undefined : voicesFor("en")[0]);
  if (chosen) u.voice = chosen;
  if (opts?.onDone) {
    u.onend = opts.onDone;
    u.onerror = opts.onDone;
  }
  window.speechSynthesis.speak(u);
}

/**
 * Whether the microphone is already allowed, without prompting. The
 * hands-free mic open must never be the thing that triggers a permission
 * dialog — that first grant needs a deliberate tap.
 */
export async function micPermissionGranted(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.permissions) return false;
  try {
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return status.state === "granted";
  } catch {
    return false;
  }
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


/**
 * The best transcript in a recognition event, scored against the target.
 * Considers every alternative of every result plus the joined stream,
 * because browsers disagree about where the text shows up: Chrome's first
 * alternative is often a homophone of the right answer (持 for 吃), and
 * Edge's final transcript is often empty with the real text only in the
 * interim results. Returns score -1 when the event carries no text at all.
 */
type RecognitionResults = {
  results: ArrayLike<ArrayLike<Pick<SpeechRecognitionAlternative, "transcript">>>;
};

/** Every non-empty transcript an event carries, plus the joined stream. */
export function transcriptCandidates(e: RecognitionResults): string[] {
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
  return candidates;
}

export function bestCandidate(
  target: string,
  e: RecognitionResults
): { transcript: string; score: number } {
  let best = { transcript: "", score: -1 };
  for (const c of transcriptCandidates(e)) {
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
      /** Everything the recognizer transcribed, for deeper rescoring. */
      candidates: string[];
    }) => void;
    error: (code: string) => void;
    ended: () => void;
    /** Lifecycle, straight from the recognizer's own events — the only
     *  honest signal of whether a session really opened and heard you. */
    phase?: (p: "session" | "mic" | "sound" | "speech") => void;
  }
): boolean {
  const seen = new Set<string>();
  let best = {
    transcript: "",
    score: -1,
    heardSound: false,
    candidates: [] as string[],
  };
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
    for (const c of transcriptCandidates(e)) seen.add(c);
    best = { ...best, candidates: [...seen] };
    const c = bestCandidate(target, e);
    if (c.score > best.score)
      best = { ...best, transcript: c.transcript, score: c.score };
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
