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

/**
 * Fold a BCP-47 tag to a comparable form: lowercase, and "_" region
 * separators (some browsers report "es_ES") normalised to "-". Exported
 * so every place that compares two tags — the picker components and
 * the settings sheet included — folds them the same way; a comparison
 * that normalises only one side of a match can silently never fire.
 */
export const normTag = (s: string) => s.toLowerCase().replace("_", "-");

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

/**
 * The tag of the best-ranked voice for a language on its own — the same
 * ranking effectiveVoiceFor() draws from, but blind to any saved
 * preference. Diffing this against effectiveVoiceFor()'s tag is how the
 * kid-path warning tells "nothing better is installed" apart from "a
 * grown-up picked the wrong one on purpose" in the voice picker.
 */
export function rankedVoiceTag(
  lang: string,
  prefer: string[] = [],
  avoid: string[] = []
): string {
  const v = voicesFor(lang, prefer, avoid)[0];
  return v ? normTag(v.lang) : "";
}

export type VoiceWarningKind = "none" | "install" | "picker";

/**
 * Which wrong-variety warning (if any) a kid-path parent needs, given the
 * tag speak() would actually use and the tag the ranking alone would have
 * picked. They differ only when a saved preference overrides a ranking
 * that would have picked correctly — installing a voice pack cannot fix
 * that case, only reopening the voice picker can, so the two need
 * different remedies. Pure: takes tags, not voices, so it never touches
 * window and can be unit tested directly.
 */
export function voiceWarningKind(
  chosenTag: string,
  rankedTag: string,
  avoid: string[]
): VoiceWarningKind {
  const a = avoid.map(normTag);
  const isAvoided = (tag: string) => tag !== "" && a.includes(normTag(tag));
  if (!isAvoided(chosenTag)) return "none";
  return isAvoided(rankedTag) ? "install" : "picker";
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
  const synth = window.speechSynthesis;
  // Cancelling while something is queued and speaking again in the same
  // tick silently drops the new utterance on Android Chrome — the
  // longstanding cancel/speak race. Remember whether we actually
  // interrupted anything; utter() below delays only in that case, so
  // the common first tap still speaks inside its user gesture (which
  // iOS requires for the first utterance).
  const wasBusy = synth.speaking || synth.pending;
  synth.cancel();
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
  utter(synth, u, wasBusy);
}

/**
 * Hand an utterance to the synthesizer in a way real phones accept:
 * wait a beat after an actual cancel() (Android Chrome drops a same-tick
 * speak), and resume() right after — some Android versions start the
 * queue paused and stay silent forever without it. Desktop browsers are
 * indifferent to both.
 */
function utter(
  synth: SpeechSynthesis,
  u: SpeechSynthesisUtterance,
  delay: boolean
) {
  const go = () => {
    synth.speak(u);
    synth.resume();
  };
  if (delay) setTimeout(go, 60);
  else go();
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
    // Mobile browsers create the context suspended until a gesture;
    // the mic tap that leads here counts, but only if we ask.
    if (ctx.state === "suspended") void ctx.resume();
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
  // Recognition needs a secure context (https or localhost). Over
  // plain-HTTP LAN — a phone testing against a dev PC — the
  // constructor exists but the microphone can never open: start() is
  // accepted and no event ever fires, so the UI would pulse at
  // "getting ready…" until the watchdog. Report unsupported instead,
  // and every mic surface shows its honest fallback. The explicit
  // `=== false` keeps test DOMs (no isSecureContext at all) supported.
  if (window.isSecureContext === false) return undefined;
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

// --- ?micdebug -----------------------------------------------------------
// An on-screen recognition event trace, because the machine where the
// mic misbehaves rarely has a console open (and a phone never does).
// Enabled by ?micdebug in the URL; nobody types it by accident. The
// trace records every raw recognizer event with a timestamp, so a
// failing retry can say exactly HOW it failed: a session that opens
// and dies without ever reporting sound is the browser's session race,
// one that hears speech and ends fast is endpointing, and so on.

let micTrace: string[] = [];
const micTraceListeners = new Set<() => void>();
const EMPTY_TRACE: string[] = [];

export function micDebugEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.search.includes("micdebug")
  );
}

function trace(line: string) {
  if (!micDebugEnabled()) return;
  const stamp = `${(performance.now() / 1000).toFixed(1)}s`;
  // Console too — on a desktop both records are useful.
  console.log(`[micdebug] ${stamp} ${line}`);
  micTrace = [...micTrace.slice(-11), `${stamp} ${line}`];
  for (const l of micTraceListeners) l();
}

export function subscribeMicTrace(cb: () => void): () => void {
  micTraceListeners.add(cb);
  return () => {
    micTraceListeners.delete(cb);
  };
}

export const getMicTraceSnapshot = () => micTrace;
export const getMicTraceServerSnapshot = () => EMPTY_TRACE;

/**
 * How long one attempt keeps the microphone armed before conceding that
 * nothing was said. Individual browser sessions die much sooner than
 * this for reasons that are not the learner's fault — a ?micdebug trace
 * on the real machine showed Edge firing "no-speech" ~3s after start
 * even though soundstart AND speechstart had fired, right as a child
 * pausing to gather courage began to speak; Chrome can also start a
 * retry against its half-torn-down previous session and die on the
 * first audio. So any session that ends without producing text is
 * silently replaced until this budget runs out. Real recognition (text
 * arrived) always settles immediately. Sits under the callers' 12s
 * watchdogs, which are the true ceiling.
 */
const RETRY_BUDGET_MS = 10_000;
/** Loop guard for a pathological recognizer that ends instantly. */
const MAX_RESTARTS = 6;

/** Errors a fresh session cannot fix — report at once, never restart. */
const FATAL_ERRORS = ["not-allowed", "service-not-allowed", "audio-capture"];

export interface RecognitionSession {
  /** Graceful stop: whatever was heard still settles, callbacks fire. */
  stop(): void;
  /** Silent teardown: no callback fires after this. */
  abort(): void;
}

/**
 * Wire one recognition attempt and start it. Collects the best candidate
 * across every event and reports it through settle() after the session
 * ends (score -1 = no text at all). error() gets raw error codes plus
 * "nomatch", and never "aborted" (that's our own teardown, not a failure).
 * Returns null if the session could not start.
 *
 * An attempt is one LOGICAL session: when the underlying recognizer dies
 * without producing any text (see RETRY_BUDGET_MS), a fresh one starts
 * silently in its place — the caller's UI keeps listening and the
 * learner never meets the browser's short fuses. abort() guarantees
 * silence, so a superseded attempt can never touch the UI of the
 * attempt that replaced it; stop() ends the attempt gracefully with no
 * further restarts.
 *
 * `newRecognizer` and `now` are injectable for tests only.
 */
export function recognizeAttempt(
  lang: string,
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
  },
  newRecognizer: (lang: string) => SpeechRecognition | null = getRecognizer,
  now: () => number = Date.now
): RecognitionSession | null {
  const seen = new Set<string>();
  let best = {
    transcript: "",
    score: -1,
    heardSound: false,
    candidates: [] as string[],
  };
  let rec: SpeechRecognition | null = null;
  let aborted = false;
  let stopped = false;
  let fatal = false;
  // Transient errors are held back until the attempt truly finishes: an
  // error that a silent restart is about to supersede must not flash
  // "I didn't hear you" at a learner who is mid-word.
  let pendingError: string | null = null;
  let restarts = 0;
  let startedAt = 0;

  const finish = () => {
    if (pendingError) cb.error(pendingError);
    cb.ended();
    cb.settle(best);
  };

  const wire = (r: SpeechRecognition, n: number) => {
    r.onstart = () => {
      trace(`#${n} session open`);
      if (!aborted) cb.phase?.("session");
    };
    r.onaudiostart = () => {
      trace(`#${n} mic open`);
      if (!aborted) cb.phase?.("mic");
    };
    r.onsoundstart = () => {
      trace(`#${n} sound heard`);
      if (aborted) return;
      best = { ...best, heardSound: true };
      cb.phase?.("sound");
    };
    r.onspeechstart = () => {
      trace(`#${n} speech heard`);
      if (aborted) return;
      best = { ...best, heardSound: true };
      cb.phase?.("speech");
    };
    r.onresult = (e) => {
      if (aborted) return;
      for (const c of transcriptCandidates(e)) seen.add(c);
      best = { ...best, candidates: [...seen] };
      const c = bestCandidate(target, e);
      trace(`#${n} result "${c.transcript.slice(0, 14)}" score ${c.score}`);
      if (c.score > best.score)
        best = { ...best, transcript: c.transcript, score: c.score };
    };
    r.onnomatch = () => {
      trace(`#${n} nomatch`);
      if (!aborted) pendingError = "nomatch";
    };
    r.onerror = (e) => {
      trace(`#${n} error ${e.error}`);
      if (aborted || e.error === "aborted") return;
      if (FATAL_ERRORS.includes(e.error)) {
        fatal = true;
        cb.error(e.error);
      } else {
        pendingError = e.error;
      }
    };
    r.onend = () => {
      if (aborted) {
        trace(`#${n} end (after abort)`);
        return;
      }
      const elapsed = now() - startedAt;
      const total = now() - attemptStart;
      const noText = best.candidates.length === 0;
      if (
        noText &&
        !fatal &&
        !stopped &&
        total < RETRY_BUDGET_MS &&
        restarts < MAX_RESTARTS
      ) {
        restarts += 1;
        pendingError = null; // superseded by the restart
        trace(`#${n} end after ${Math.round(elapsed)}ms → silent restart`);
        if (start()) return; // still listening — nobody is told
      }
      trace(
        `#${n} end after ${Math.round(elapsed)}ms → settle ` +
          `(score ${best.score}, heard ${best.heardSound})`,
      );
      finish();
    };
  };

  const start = (): boolean => {
    const r = newRecognizer(lang);
    if (!r) return false;
    wire(r, restarts);
    startedAt = now();
    trace(`#${restarts} start() ${lang}`);
    try {
      r.start();
    } catch {
      trace(`#${restarts} start() threw`);
      r.abort();
      return false;
    }
    rec = r;
    return true;
  };

  const attemptStart = now();
  if (!start()) return null;
  return {
    stop() {
      trace("caller stop()");
      stopped = true;
      try {
        rec?.stop();
      } catch {
        rec?.abort();
      }
    },
    abort() {
      trace("caller abort()");
      aborted = true;
      try {
        rec?.abort();
      } catch {
        // already dead — silence was the point
      }
    },
  };
}

/**
 * Speak an English instruction aloud, so the kid path is usable by a
 * child who cannot yet read. Separate from speak(), which is zh-CN.
 */
export function speakEnglish(text: string, opts?: { rate?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const wasBusy = synth.speaking || synth.pending;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = opts?.rate ?? 0.95;
  const english = synth.getVoices().find((v) => /^en([-_]|$)/i.test(v.lang));
  if (english) u.voice = english;
  utter(synth, u, wasBusy);
}
