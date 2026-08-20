"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to — the value is read once per render pass. */
const noopSubscribe = () => () => {};

/**
 * Read a browser-only value (feature detection, `window` capabilities)
 * without either of the usual mistakes:
 *
 *  - `setState` inside a mount effect, which React 19 rejects
 *    (react-hooks/set-state-in-effect) because it cascades renders;
 *  - a lazy `useState` initialiser, which runs during the server render
 *    too and hydrates to a different value.
 *
 * The server render and the hydration pass both see `serverValue`; React
 * then re-renders with the real one. `get` must return a primitive or a
 * stable reference, since snapshots are compared by identity.
 */
export function useClientValue<T>(get: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, get, () => serverValue);
}
