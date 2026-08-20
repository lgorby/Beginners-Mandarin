// Beginner lesson plan. Each lesson introduces a small set of words,
// a grammar point explained in plain English, and example sentences
// the learner can listen to and repeat with the microphone.

import { ExampleSentence, VOCAB, VocabWord } from "./vocab";

export interface Lesson {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  words: string[]; // zh keys into VOCAB
  grammar: { point: string; explanation: string }[];
  sentences: ExampleSentence[];
}

export const LESSONS: Lesson[] = [
  {
    id: "greetings",
    number: 1,
    title: "Hello & Thank You",
    subtitle: "Your first words in Mandarin",
    words: ["你好", "谢谢", "不客气", "再见", "我", "你"],
    grammar: [
      {
        point: "你好 literally means 'you good'",
        explanation:
          "Mandarin greetings are simple word combinations: 你 (you) + 好 (good) = hello. There is no verb 'to be' needed.",
      },
    ],
    sentences: [
      { zh: "你好！", pinyin: "ni3 hao3", en: "Hello!" },
      { zh: "谢谢你！", pinyin: "xie4 xie5 ni3", en: "Thank you!" },
      { zh: "不客气。", pinyin: "bu4 ke4 qi5", en: "You're welcome." },
      { zh: "再见！", pinyin: "zai4 jian4", en: "Goodbye!" },
    ],
  },
  {
    id: "introductions",
    number: 2,
    title: "What's Your Name?",
    subtitle: "Introduce yourself",
    words: ["叫", "什么", "是", "老师", "学生", "朋友"],
    grammar: [
      {
        point: "我叫… = 'I am called…'",
        explanation:
          "To say your name: 我叫 + name. To ask someone's name: 你叫什么? (literally 'you called what?'). Question words stay in place in Mandarin — no word-order change.",
      },
    ],
    sentences: [
      { zh: "你叫什么？", pinyin: "ni3 jiao4 shen2 me5", en: "What's your name?" },
      { zh: "我叫李明。", pinyin: "wo3 jiao4 Li3 Ming2", en: "My name is Li Ming." },
      { zh: "我是学生。", pinyin: "wo3 shi4 xue2 sheng5", en: "I am a student." },
      { zh: "她是老师。", pinyin: "ta1 shi4 lao3 shi1", en: "She is a teacher." },
    ],
  },
  {
    id: "numbers",
    number: 3,
    title: "Numbers 1–10",
    subtitle: "Count in Mandarin",
    words: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "几"],
    grammar: [
      {
        point: "Numbers build logically",
        explanation:
          "11 is 十一 (ten-one), 20 is 二十 (two-ten), 99 is 九十九 (nine-ten-nine). Learn 1–10 and you can count to 99.",
      },
    ],
    sentences: [
      { zh: "一、二、三。", pinyin: "yi1 er4 san1", en: "One, two, three." },
      { zh: "我有三本书。", pinyin: "wo3 you3 san1 ben3 shu1", en: "I have three books." },
      { zh: "你有几个朋友？", pinyin: "ni3 you3 ji3 ge4 peng2 you5", en: "How many friends do you have?" },
    ],
  },
  {
    id: "family",
    number: 4,
    title: "My Family",
    subtitle: "Talk about the people at home",
    words: ["妈妈", "爸爸", "儿子", "女儿", "家", "我们", "他", "她"],
    grammar: [
      {
        point: "No verb conjugation — ever",
        explanation:
          "我是, 你是, 他是 — the verb 是 never changes. Mandarin verbs have exactly one form regardless of who or when.",
      },
    ],
    sentences: [
      { zh: "这是我妈妈。", pinyin: "zhe4 shi4 wo3 ma1 ma5", en: "This is my mom." },
      { zh: "我爸爸是老师。", pinyin: "wo3 ba4 ba5 shi4 lao3 shi1", en: "My dad is a teacher." },
      { zh: "我们是朋友。", pinyin: "wo3 men5 shi4 peng2 you5", en: "We are friends." },
    ],
  },
  {
    id: "food",
    number: 5,
    title: "Eating & Drinking",
    subtitle: "Order food and drinks",
    words: ["吃", "喝", "水", "茶", "咖啡", "米饭", "面条", "苹果"],
    grammar: [
      {
        point: "Subject + Verb + Object, just like English",
        explanation:
          "我喝茶 = I drink tea. Mandarin's basic word order matches English, which makes simple sentences easy.",
      },
    ],
    sentences: [
      { zh: "我喝茶。", pinyin: "wo3 he1 cha2", en: "I drink tea." },
      { zh: "你吃米饭吗？", pinyin: "ni3 chi1 mi3 fan4 ma5", en: "Do you eat rice?" },
      { zh: "我喜欢喝咖啡。", pinyin: "wo3 xi3 huan5 he1 ka1 fei1", en: "I like drinking coffee." },
    ],
  },
  {
    id: "questions",
    number: 6,
    title: "Asking Questions",
    subtitle: "The magic particle 吗",
    words: ["吗", "谁", "哪儿", "怎么", "好", "有"],
    grammar: [
      {
        point: "Add 吗 to make any statement a question",
        explanation:
          "你好 (you are well) + 吗 = 你好吗? (are you well?). No word-order change, no helper verbs — just add 吗 at the end.",
      },
    ],
    sentences: [
      { zh: "你好吗？", pinyin: "ni3 hao3 ma5", en: "How are you?" },
      { zh: "他是谁？", pinyin: "ta1 shi4 shei2", en: "Who is he?" },
      { zh: "你去哪儿？", pinyin: "ni3 qu4 na3 r5", en: "Where are you going?" },
    ],
  },
  {
    id: "likes",
    number: 7,
    title: "Likes & Loves",
    subtitle: "Say what you enjoy",
    words: ["喜欢", "爱", "看", "听", "书", "猫", "狗"],
    grammar: [
      {
        point: "喜欢 + noun or verb",
        explanation:
          "我喜欢猫 (I like cats), 我喜欢看书 (I like reading books). 喜欢 works with both things and activities.",
      },
    ],
    sentences: [
      { zh: "我喜欢猫。", pinyin: "wo3 xi3 huan5 mao1", en: "I like cats." },
      { zh: "他爱看书。", pinyin: "ta1 ai4 kan4 shu1", en: "He loves reading books." },
      { zh: "你喜欢听什么？", pinyin: "ni3 xi3 huan5 ting1 shen2 me5", en: "What do you like listening to?" },
    ],
  },
  {
    id: "time",
    number: 8,
    title: "Days & Time",
    subtitle: "Talk about when",
    words: ["今天", "明天", "昨天", "现在", "年", "月", "日", "点"],
    grammar: [
      {
        point: "Time goes before the verb",
        explanation:
          "我今天去学校 = 'I today go to school'. Time words come right after the subject (or at the very start), never at the end like English.",
      },
    ],
    sentences: [
      { zh: "今天很热。", pinyin: "jin1 tian1 hen3 re4", en: "Today is hot." },
      { zh: "我明天去学校。", pinyin: "wo3 ming2 tian1 qu4 xue2 xiao4", en: "I'm going to school tomorrow." },
      { zh: "现在几点？", pinyin: "xian4 zai4 ji3 dian3", en: "What time is it now?" },
    ],
  },
  {
    id: "places",
    number: 9,
    title: "Going Places",
    subtitle: "Where in the world",
    words: ["去", "来", "中国", "美国", "学校", "商店", "饭馆"],
    grammar: [
      {
        point: "去 + place = go to a place",
        explanation:
          "No preposition needed: 我去中国 = I go (to) China. 去学校 = go (to) school.",
      },
    ],
    sentences: [
      { zh: "我去中国。", pinyin: "wo3 qu4 Zhong1 guo2", en: "I'm going to China." },
      { zh: "你来我家吗？", pinyin: "ni3 lai2 wo3 jia1 ma5", en: "Are you coming to my home?" },
      { zh: "我们去饭馆吃饭。", pinyin: "wo3 men5 qu4 fan4 guan3 chi1 fan4", en: "We're going to a restaurant to eat." },
    ],
  },
  {
    id: "descriptions",
    number: 10,
    title: "Describing Things",
    subtitle: "Big, small, hot, cold",
    words: ["大", "小", "多", "少", "热", "冷", "高兴", "漂亮", "买", "钱"],
    grammar: [
      {
        point: "很 connects nouns to adjectives",
        explanation:
          "Don't say 我是高兴 — say 我很高兴 (I [very] happy). 很 acts like 'is' before adjectives and barely means 'very' here.",
      },
    ],
    sentences: [
      { zh: "我很高兴。", pinyin: "wo3 hen3 gao1 xing4", en: "I am happy." },
      { zh: "这个很漂亮。", pinyin: "zhe4 ge5 hen3 piao4 liang5", en: "This is pretty." },
      { zh: "今天很冷。", pinyin: "jin1 tian1 hen3 leng3", en: "Today is cold." },
    ],
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonWords(lesson: Lesson): VocabWord[] {
  return lesson.words
    .map((zh) => VOCAB.find((w) => w.zh === zh))
    .filter((w): w is VocabWord => Boolean(w));
}
