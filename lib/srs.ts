"use client";

// Spaced repetition (Leitner boxes) for the grown-up flashcards.
//
// The pure functions take `now` and the word list as arguments so they
// are testable; the session store at the bottom binds them to VOCAB,
// localStorage, and the clock, shaped for useSyncExternalStore so the
// page never calls setState inside an effect.

import { createClientStore } from "./clientStore";
import { VOCAB } from "./vocab";

/** Box 0 = new/again; higher boxes are reviewed at longer intervals. */
export const INTERVALS_DAYS = [0, 1, 3, 7, 16, 35];
const STORAGE_KEY = "mandarin-srs-v1";
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

// --- The session store (client only) ------------------------------------

export interface SrsSession {
  /** False only for the server/hydration render. */
  ready: boolean;
  store: SrsStore;
  queue: string[];
}

function loadStore(): SrsStore {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as SrsStore;
  } catch {
    return {};
  }
}

function saveStore(s: SrsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // review still works this session; it just won't persist
  }
}

function readSession(): SrsSession {
  const store = loadStore();
  return {
    ready: true,
    store,
    queue: dueQueue(store, VOCAB.map((w) => w.zh), Date.now()),
  };
}

const session = createClientStore<SrsSession>(readSession, {
  ready: false,
  store: {},
  queue: [],
});

export const subscribeSrsSession = session.subscribe;
export const getSrsSessionSnapshot = session.getSnapshot;
export const getSrsSessionServerSnapshot = session.getServerSnapshot;

/** Grade the card at the head of the queue, persist, and advance. */
export function rateCurrentCard(grade: Grade): void {
  const s = session.getSnapshot();
  const zh = s.queue[0];
  if (!zh) return;
  const store = rateCard(s.store, zh, grade, Date.now());
  saveStore(store);
  const rest = s.queue.slice(1);
  // "Again" cards return to the end of today's queue.
  session.set({
    ready: true,
    store,
    queue: grade === "again" ? [...rest, zh] : rest,
  });
}
