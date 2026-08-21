// The Mandarin course for the kid path: every word, lesson, and sentence.
// Data only — lib/curriculum.ts stamps the language on and merges courses.
//
// Type-only imports keep this file runtime-standalone, so
// scripts/fetch-pics.mjs can import it directly under Node.

import type { Course, CourseWord, Sentence } from "../curriculum";

const w = (
  text: string,
  id: string,
  pinyin: string,
  en: string,
  emoji: string,
  art: CourseWord["art"]
): CourseWord => ({ text, id, pinyin, en, emoji, art });

const omj = (hex: string): CourseWord["art"] => ({ from: "openmoji", hex });
const custom: CourseWord["art"] = { from: "custom" };

const words: CourseWord[] = [
  // Lesson 1
  w("你", "ni", "ni3", "you", "👉", custom),
  w("好", "hao", "hao3", "good", "👍", omj("1F44D")),
  w("我", "wo", "wo3", "I / me", "🙋", custom),
  // Lesson 2
  w("是", "shi", "shi4", "to be", "✅", omj("2705")),
  w("学生", "xuesheng", "xue2 sheng5", "student", "🎒", omj("1F392")),
  w("老师", "laoshi", "lao3 shi1", "teacher", "🧑‍🏫", omj("1F9D1-200D-1F3EB")),
  // Lesson 3
  w("喜欢", "xihuan", "xi3 huan5", "to like", "😍", omj("1F60D")),
  w("猫", "mao", "mao1", "cat", "🐱", omj("1F431")),
  w("狗", "gou", "gou3", "dog", "🐶", omj("1F436")),
  // Lesson 4
  w("喝", "he", "he1", "to drink", "🥤", omj("1F964")),
  w("水", "shui", "shui3", "water", "💧", omj("1F4A7")),
  w("茶", "cha", "cha2", "tea", "🍵", omj("1F375")),
  // Lesson 5
  w("吃", "chi", "chi1", "to eat", "😋", custom),
  w("米饭", "mifan", "mi3 fan4", "rice", "🍚", omj("1F35A")),
  w("苹果", "pingguo", "ping2 guo3", "apple", "🍎", omj("1F34E")),
  // Lesson 6
  w("吗", "ma", "ma5", "(makes a question)", "❔", custom),
  // Lesson 7
  w("他", "ta-he", "ta1", "he", "👨", omj("1F468")),
  w("她", "ta-she", "ta1", "she", "👩", omj("1F469")),
  // Lesson 8
  w("大", "da", "da4", "big", "🐘", custom),
  w("小", "xiao", "xiao3", "small", "🐭", custom),
  // Lesson 9
  w("不", "bu", "bu4", "not", "❌", omj("274C")),
  // Lesson 10
  w("去", "qu", "qu4", "to go", "🚶", omj("1F6B6")),
  w("学校", "xuexiao", "xue2 xiao4", "school", "🏫", omj("1F3EB")),
  w("家", "jia", "jia1", "home", "🏠", omj("1F3E0")),
  // Standalone phrases — taught whole, never entering the ladder.
  w("谢谢", "xiexie", "xie4 xie5", "thank you", "🙏", omj("1F64F")),
  w("再见", "zaijian", "zai4 jian4", "goodbye", "👋", omj("1F44B")),
];

const s = (words: string[], en: string): Sentence => ({ words, en });

export const zhCourse: Course = {
  words,
  /** Order is array position. There is deliberately no `number` field. */
  lessons: [
    {
      id: "hello",
      title: "Hello",
      icon: "好",
      newWords: ["你", "好", "我"],
      build: s(["你", "好"], "Hello!"),
      swaps: [],
    },
    {
      id: "i-am",
      title: "I am",
      icon: "学生",
      newWords: ["是", "学生", "老师"],
      build: s(["我", "是", "学生"], "I am a student."),
      ladderEn: ["I am…"],
      swaps: [
        s(["我", "是", "老师"], "I am a teacher."),
        s(["你", "是", "老师"], "You are a teacher."),
      ],
    },
    {
      id: "i-like",
      title: "I like",
      icon: "猫",
      newWords: ["喜欢", "猫", "狗"],
      build: s(["我", "喜欢", "猫"], "I like cats."),
      ladderEn: ["I like…"],
      swaps: [
        s(["我", "喜欢", "狗"], "I like dogs."),
        s(["你", "喜欢", "猫"], "You like cats."),
      ],
    },
    {
      id: "i-drink",
      title: "I drink",
      icon: "茶",
      newWords: ["喝", "水", "茶"],
      build: s(["我", "喝", "茶"], "I drink tea."),
      ladderEn: ["I drink…"],
      swaps: [s(["我", "喝", "水"], "I drink water.")],
    },
    {
      id: "i-eat",
      title: "I eat",
      icon: "苹果",
      newWords: ["吃", "米饭", "苹果"],
      build: s(["我", "吃", "苹果"], "I eat apples."),
      ladderEn: ["I eat…"],
      swaps: [s(["我", "吃", "米饭"], "I eat rice.")],
    },
    {
      // Multiplier: turns every sentence already learned into a question.
      id: "asking",
      title: "Asking",
      icon: "吗",
      newWords: ["吗"],
      build: s(["你", "喜欢", "猫", "吗"], "Do you like cats?"),
      ladderEn: ["You like…", "You like cats…"],
      swaps: [
        s(["你", "喝", "茶", "吗"], "Do you drink tea?"),
        s(["你", "是", "学生", "吗"], "Are you a student?"),
      ],
    },
    {
      // Multiplier: swaps the subject on everything already learned.
      id: "he-she",
      title: "He & she",
      icon: "她",
      newWords: ["他", "她"],
      build: s(["她", "是", "老师"], "She is a teacher."),
      ladderEn: ["She is…"],
      swaps: [
        s(["他", "喜欢", "狗"], "He likes dogs."),
        s(["他", "吃", "苹果"], "He eats apples."),
      ],
    },
    {
      id: "big-small",
      title: "Big & small",
      icon: "大",
      newWords: ["大", "小"],
      build: s(["大", "猫"], "a big cat"),
      swaps: [s(["小", "猫"], "a small cat"), s(["小", "狗"], "a small dog")],
    },
    {
      // Multiplier: negates everything already learned.
      id: "saying-no",
      title: "Saying no",
      icon: "不",
      newWords: ["不"],
      build: s(["我", "不", "喜欢", "猫"], "I don't like cats."),
      ladderEn: ["I don't…", "I don't like…"],
      swaps: [
        s(["他", "不", "是", "老师"], "He is not a teacher."),
        s(["我", "不", "吃", "苹果"], "I don't eat apples."),
      ],
    },
    {
      id: "going",
      title: "Going",
      icon: "学校",
      newWords: ["去", "学校", "家"],
      build: s(["我", "去", "学校"], "I go to school."),
      ladderEn: ["I go…"],
      swaps: [
        s(["他", "去", "学校"], "He goes to school."),
        s(["我", "不", "去", "学校"], "I don't go to school."),
        s(["你", "去", "学校", "吗"], "Do you go to school?"),
      ],
    },
  ],
};
