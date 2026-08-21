"use client";

// Spaced repetition (Leitner boxes) for the grown-up flashcards.
//
// The pure functions take `now` and the word list as arguments so they
// are testable; the session factory at the bottom binds them to a word
// list, a localStorage key, and the clock, shaped for
// useSyncExternalStore so a page never calls setState inside an effect.
// One session per language — each deck has its own key and progress.

import { createClientStore } from "./clientStore";
import { WORDS } from "./curriculum";
import { VOCAB } from "./vocab";

/** Box 0 = new/again; higher boxes are reviewed at longer intervals. */
export const INTERVALS_DAYS = [0, 1, 3, 7, 16, 35];
/** Cap per session, so a review stays short. */
const SESSION_CAP = 20;

export interface CardState {
  box: number;
  due: number; // epoch ms
}

export type SrsStore = Record<string, CardState>;
export type Grade = "again" | "good" | "easy";

/** One grading step: pure — the caller supplies the clock. */
export function rateCard(
  store: SrsStore,
  zh: string,
  grade: Grade,
  now: number
): SrsStore {
  const prev = store[zh] ?? { box: 0, due: 0 };
  const box =
    grade === "again"
      ? 0
      : Math.min(
          prev.box + (grade === "easy" ? 2 : 1),
          INTERVALS_DAYS.length - 1
        );
  const due =
    grade === "again"
      ? now + 60_000 // see it again this session
      : now + INTERVALS_DAYS[box] * 24 * 60 * 60 * 1000;
  return { ...store, [zh]: { box, due } };
}

/**
 * Today's queue: cards already seen and due (oldest due first), then new
 * cards, capped. Review-before-new is the standard SRS ordering — the
 * old inline version documented it but never actually sorted.
 */
export function dueQueue(
  store: SrsStore,
  words: string[],
  now: number,
  cap = SESSION_CAP
): string[] {
  const seen = words
    .filter((zh) => store[zh] && store[zh].due <= now)
    .sort((a, b) => store[a].due - store[b].due);
  const fresh = words.filter((zh) => !store[zh]);
  return [...seen, ...fresh].slice(0, cap);
}

/** A card is "learned" once it has survived into box 2 or beyond. */
export function learnedCount(store: SrsStore): number {
  return Object.values(store).filter((c) => c.box >= 2).length;
}

// --- The session stores (client only) -----------------------------------

export interface SrsSession {
  /** False only for the server/hydration render. */
  ready: boolean;
  store: SrsStore;
  queue: string[];
}

export interface SrsSessionApi {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => SrsSession;
  getServerSnapshot: () => SrsSession;
  /** Grade the card at the head of the queue, persist, and advance. */
  rateCurrent: (grade: Grade) => void;
}

function createSrsSession(storageKey: string, words: string[]): SrsSessionApi {
  const loadStore = (): SrsStore => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "{}") as SrsStore;
    } catch {
      return {};
    }
  };

  const saveStore = (s: SrsStore): void => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      // review still works this session; it just won't persist
    }
  };

  const readSession = (): SrsSession => {
    const store = loadStore();
    return { ready: true, store, queue: dueQueue(store, words, Date.now()) };
  };

  const session = createClientStore<SrsSession>(readSession, {
    ready: false,
    store: {},
    queue: [],
  });

  return {
    subscribe: session.subscribe,
    getSnapshot: session.getSnapshot,
    getServerSnapshot: session.getServerSnapshot,
    rateCurrent(grade) {
      const s = session.getSnapshot();
      const word = s.queue[0];
      if (!word) return;
      const store = rateCard(s.store, word, grade, Date.now());
      saveStore(store);
      const rest = s.queue.slice(1);
      // "Again" cards return to the end of today's queue.
      session.set({
        ready: true,
        store,
        queue: grade === "again" ? [...rest, word] : rest,
      });
    },
  };
}

const mandarinSrs = createSrsSession(
  "mandarin-srs-v1",
  VOCAB.map((w) => w.zh)
);

export const spanishSrs = createSrsSession(
  "spanish-srs-v1",
  // The Spanish course's words, in the order the lessons teach them.
  Object.values(WORDS)
    .filter((w) => w.lang === "es")
    .map((w) => w.text)
);

// The Mandarin flashcards page predates the factory; its names stay.
export const subscribeSrsSession = mandarinSrs.subscribe;
export const getSrsSessionSnapshot = mandarinSrs.getSnapshot;
export const getSrsSessionServerSnapshot = mandarinSrs.getServerSnapshot;
export const rateCurrentCard = mandarinSrs.rateCurrent;
