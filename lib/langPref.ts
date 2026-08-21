"use client";

import { createClientStore } from "./clientStore";
import { isLangCode, type LangCode } from "./languages";

const KEY = "kid-lang-v1";

/**
 * Which language the kid path is learning. Mandarin by default — the
 * app's original course. The chooser lives on the front door and in the
 * grown-up settings; lessons themselves never ask.
 */
function read(): LangCode {
  try {
    const v = localStorage.getItem(KEY);
    return isLangCode(v) ? v : "zh";
  } catch {
    return "zh";
  }
}

const store = createClientStore<LangCode>(read, "zh");

export const subscribeKidLang = store.subscribe;
export const getKidLangSnapshot = store.getSnapshot;
export const getKidLangServerSnapshot = store.getServerSnapshot;

export function setKidLang(lang: LangCode): void {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // preference just won't persist
  }
  store.set(lang);
}
