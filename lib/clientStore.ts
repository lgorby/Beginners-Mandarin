"use client";

/**
 * A localStorage-backed store shaped for useSyncExternalStore.
 *
 * React components cannot read localStorage during a server render, and
 * reading it in a useEffect that calls setState is the pattern eslint
 * rejects (react-hooks/set-state-in-effect — see MicPractice.tsx:53).
 * useSyncExternalStore is the correct answer, but it compares snapshots
 * by reference, so returning a freshly-parsed object on every call would
 * re-render forever. Hence the cache: `set` and `invalidate` are the only
 * ways the snapshot changes.
 */
export function createClientStore<T>(read: () => T, serverValue: T) {
  let snapshot: T | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot(): T {
      if (snapshot === null) snapshot = read();
      return snapshot;
    },
    /** Server renders never touch storage; they get the neutral value. */
    getServerSnapshot(): T {
      return serverValue;
    },
    /** Record a value already written to storage. */
    set(value: T) {
      snapshot = value;
      emit();
    },
    /** Force the next read to hit storage again (used after a reset). */
    invalidate() {
      snapshot = null;
      emit();
    },
  };
}
