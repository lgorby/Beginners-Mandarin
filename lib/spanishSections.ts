// SSOT for the Spanish grown-up toolkit. Each section is a page at
// /spanish-grown-ups/[slug]; the lessons live separately at /learn (the
// kid path teaches Spanish too). The navbar and the landing-page cards
// both read from this map, so a section added here appears everywhere
// at once.

export interface SpanishSection {
  icon: string;
  /** Short navbar label. */
  label: string;
  /** Card / page title (without the card's step number). */
  title: string;
  /** Card description — what the tool will do. */
  desc: string;
}

export const SPANISH_SECTIONS = {
  sounds: {
    icon: "🔤",
    label: "Sounds",
    title: "Master the Sounds",
    desc: "The Spanish vowels and the letters that trip English speakers — rr, ñ, j — with audio.",
  },
  dictionary: {
    icon: "🔎",
    label: "Dictionary",
    title: "Talking Dictionary",
    desc: "Type any English word — get the Spanish with spoken Latin American audio.",
  },
  practice: {
    icon: "🎤",
    label: "Speak",
    title: "Speak Out Loud",
    desc: "Use your microphone — the app listens and checks your pronunciation.",
  },
  spelling: {
    icon: "✍️",
    label: "Spelling",
    title: "Accents & Spelling",
    desc: "Where the stress falls, when a word takes an accent mark, and ¿ ¡ punctuation.",
  },
  flashcards: {
    icon: "🃏",
    label: "Review",
    title: "Review Flashcards",
    desc: "Spaced-repetition review so what you learn actually sticks.",
  },
} satisfies Record<string, SpanishSection>;

export type SpanishSectionSlug = keyof typeof SPANISH_SECTIONS;

export function isSpanishSection(v: string): v is SpanishSectionSlug {
  return v in SPANISH_SECTIONS;
}
