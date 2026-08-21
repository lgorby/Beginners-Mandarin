// The American (Latin American) Spanish course for the kid path. Data
// only — lib/curriculum.ts stamps the language on and merges courses.
//
// Same pedagogy as the Mandarin course — pictured words laddering into
// spoken sentences, with multiplier lessons — but shaped by Spanish
// grammar. Verbs conjugate by person, so each verb is taught in the form
// the sentences actually use (bebo = "I drink"), and sentences never
// swap the subject out from under a conjugated verb. The question
// multiplier is "quieres": Spanish asks yes/no questions by intonation
// alone, so one word plus a rising voice turns anything into an offer.
//
// Type-only imports keep this file runtime-standalone, so
// scripts/fetch-pics.mjs can import it directly under Node.

import type { Course, CourseWord, Sentence } from "../curriculum";

const w = (
  text: string,
  id: string,
  en: string,
  emoji: string,
  art: CourseWord["art"]
): CourseWord => ({ text, id, en, emoji, art });

const omj = (hex: string): CourseWord["art"] => ({ from: "openmoji", hex });
// Reuses a hand-authored Mandarin picture: the concept is identical and
// the drawing carries no language.
const copy = (of: string): CourseWord["art"] => ({ from: "copy", of });

const words: CourseWord[] = [
  // Lesson 1
  w("hola", "hola", "hello", "👋", omj("1F44B")),
  w("mamá", "mama", "Mom", "👩‍🍼", omj("1F469-200D-1F37C")),
  w("papá", "papa", "Dad", "👨‍🍼", omj("1F468-200D-1F37C")),
  // Lesson 2
  w("yo", "yo", "I / me", "🙋", copy("wo")),
  w("soy", "soy", "I am", "✅", omj("2705")),
  w("estudiante", "estudiante", "student", "🎒", omj("1F392")),
  // Lesson 3
  w("un", "un", "a / one", "1️⃣", omj("0031-FE0F-20E3")),
  w("gato", "gato", "cat", "🐱", omj("1F431")),
  w("perro", "perro", "dog", "🐶", omj("1F436")),
  // Lesson 4
  w("bebo", "bebo", "I drink", "🥤", omj("1F964")),
  w("agua", "agua", "water", "💧", omj("1F4A7")),
  w("té", "te", "tea", "🍵", omj("1F375")),
  // Lesson 5
  w("como", "como", "I eat", "😋", copy("chi")),
  w("arroz", "arroz", "rice", "🍚", omj("1F35A")),
  w("manzanas", "manzanas", "apples", "🍎", omj("1F34E")),
  // Lesson 6
  w("quiero", "quiero", "I want", "🤲", omj("1F932")),
  w("quieres", "quieres", "do you want…?", "❔", copy("ma")),
  w("tú", "tu", "you", "👉", copy("ni")),
  // Lesson 7
  w("él", "el", "he", "👨", omj("1F468")),
  w("ella", "ella", "she", "👩", omj("1F469")),
  w("es", "es", "is", "🟰", omj("1F7F0")),
  w("maestro", "maestro", "teacher", "🧑‍🏫", omj("1F9D1-200D-1F3EB")),
  // Lesson 8
  w("grande", "grande", "big", "🐘", copy("da")),
  w("pequeño", "pequeno", "small", "🐭", copy("xiao")),
  // Lesson 9
  w("no", "no", "not / no", "❌", omj("274C")),
  // Lesson 10
  w("voy", "voy", "I go", "🚶", omj("1F6B6")),
  w("a la escuela", "a-la-escuela", "to school", "🏫", omj("1F3EB")),
  w("a casa", "a-casa", "home", "🏠", omj("1F3E0")),
  // Standalone phrases — taught whole, never entering the ladder.
  w("gracias", "gracias", "thank you", "🙏", omj("1F64F")),
  w("adiós", "adios", "goodbye", "👋", omj("1F44B")),
];

const s = (words: string[], en: string): Sentence => ({ words, en });

export const esCourse: Course = {
  words,
  /** Order is array position. There is deliberately no `number` field. */
  lessons: [
    {
      id: "hola",
      title: "Hello",
      icon: "hola",
      newWords: ["hola", "mamá", "papá"],
      build: s(["hola", "mamá"], "Hello, Mom!"),
      swaps: [s(["hola", "papá"], "Hello, Dad!")],
    },
    {
      id: "yo-soy",
      title: "I am",
      icon: "estudiante",
      newWords: ["yo", "soy", "estudiante"],
      build: s(["yo", "soy", "estudiante"], "I am a student."),
      // Pretend play: the child announces themselves as Mom.
      swaps: [s(["yo", "soy", "mamá"], "I am Mom!")],
    },
    {
      id: "un-gato",
      title: "A cat",
      icon: "gato",
      newWords: ["un", "gato", "perro"],
      build: s(["un", "gato"], "a cat"),
      swaps: [s(["un", "perro"], "a dog")],
    },
    {
      id: "bebo",
      title: "I drink",
      icon: "té",
      newWords: ["bebo", "agua", "té"],
      build: s(["yo", "bebo", "té"], "I drink tea."),
      swaps: [s(["yo", "bebo", "agua"], "I drink water.")],
    },
    {
      id: "como",
      title: "I eat",
      icon: "manzanas",
      newWords: ["como", "arroz", "manzanas"],
      build: s(["yo", "como", "arroz"], "I eat rice."),
      swaps: [s(["yo", "como", "manzanas"], "I eat apples.")],
    },
    {
      // Multiplier: quieres + rising intonation makes anything an offer.
      id: "quiero",
      title: "Do you want…?",
      icon: "quieres",
      newWords: ["quiero", "quieres", "tú"],
      build: s(["yo", "quiero", "té"], "I want tea."),
      swaps: [
        s(["tú", "quieres", "té"], "Do you want tea?"),
        s(["yo", "quiero", "agua"], "I want water."),
      ],
    },
    {
      // Multiplier: él/ella + es swaps the subject on what's known.
      id: "el-y-ella",
      title: "He & she",
      icon: "ella",
      newWords: ["él", "ella", "es", "maestro"],
      build: s(["ella", "es", "estudiante"], "She is a student."),
      swaps: [
        s(["él", "es", "estudiante"], "He is a student."),
        s(["él", "es", "maestro"], "He is a teacher."),
      ],
    },
    {
      id: "grande",
      title: "Big & small",
      icon: "grande",
      newWords: ["grande", "pequeño"],
      // Spanish puts the adjective after the noun — the ladder teaches
      // that order by building it.
      build: s(["un", "gato", "grande"], "a big cat"),
      swaps: [
        s(["un", "gato", "pequeño"], "a small cat"),
        s(["un", "perro", "pequeño"], "a small dog"),
      ],
    },
    {
      // Multiplier: negates everything already learned.
      id: "no",
      title: "Saying no",
      icon: "no",
      newWords: ["no"],
      build: s(["yo", "no", "como", "arroz"], "I don't eat rice."),
      swaps: [
        s(["yo", "no", "bebo", "té"], "I don't drink tea."),
        s(["yo", "no", "quiero", "agua"], "I don't want water."),
      ],
    },
    {
      id: "voy",
      title: "Going",
      icon: "a la escuela",
      newWords: ["voy", "a la escuela", "a casa"],
      build: s(["yo", "voy", "a la escuela"], "I go to school."),
      swaps: [
        s(["yo", "voy", "a casa"], "I go home."),
        s(["yo", "no", "voy", "a la escuela"], "I don't go to school."),
      ],
    },
  ],
};
