"use client";

import { createClientStore } from "./clientStore";

const KEY = "mandarin-kid-pinyin-v1";

/**
 * Off by default: a young child can no more read "xǐhuan" than 喜欢, and
 * pinyin's q/x/zh actively mislead an English reader. A grown-up can turn
 * it on from the settings panel.
 */
function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

const store = createClientStore<boolean>(read, false);

export const subscribePinyin = store.subscribe;
export const getPinyinSnapshot = store.getSnapshot;
export const getPinyinServerSnapshot = store.getServerSnapshot;

export function setPinyinVisible(visible: boolean): void {
  try {
    localStorage.setItem(KEY, visible ? "1" : "0");
  } catch {
    // preference just won't persist
  }
  store.set(visible);
}
