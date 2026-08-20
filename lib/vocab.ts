// Curated absolute-beginner vocabulary (HSK-1 based), with emoji visuals.
// Pinyin is stored in CC-CEDICT numbered form and converted for display.

export interface VocabWord {
  /** Simplified characters */
  zh: string;
  /** Numbered pinyin, e.g. "ni3 hao3" */
  pinyin: string;
  en: string;
  emoji: string;
  category: string;
}

export interface ExampleSentence {
  zh: string;
  pinyin: string;
  en: string;
}

export const VOCAB: VocabWord[] = [
  // Greetings & basics
  { zh: "你好", pinyin: "ni3 hao3", en: "hello", emoji: "👋", category: "greetings" },
  { zh: "谢谢", pinyin: "xie4 xie5", en: "thank you", emoji: "🙏", category: "greetings" },
  { zh: "不客气", pinyin: "bu4 ke4 qi5", en: "you're welcome", emoji: "😊", category: "greetings" },
  { zh: "再见", pinyin: "zai4 jian4", en: "goodbye", emoji: "👋", category: "greetings" },
  { zh: "对不起", pinyin: "dui4 bu5 qi3", en: "sorry", emoji: "😔", category: "greetings" },
  { zh: "没关系", pinyin: "mei2 guan1 xi5", en: "it's okay / no problem", emoji: "🤝", category: "greetings" },
  { zh: "请", pinyin: "qing3", en: "please", emoji: "🤲", category: "greetings" },
  { zh: "是", pinyin: "shi4", en: "to be / yes", emoji: "✅", category: "greetings" },
  { zh: "不", pinyin: "bu4", en: "no / not", emoji: "❌", category: "greetings" },

  // Pronouns & people
  { zh: "我", pinyin: "wo3", en: "I / me", emoji: "🙋", category: "people" },
  { zh: "你", pinyin: "ni3", en: "you", emoji: "👉", category: "people" },
  { zh: "他", pinyin: "ta1", en: "he / him", emoji: "👨", category: "people" },
  { zh: "她", pinyin: "ta1", en: "she / her", emoji: "👩", category: "people" },
  { zh: "我们", pinyin: "wo3 men5", en: "we / us", emoji: "👥", category: "people" },
  { zh: "朋友", pinyin: "peng2 you5", en: "friend", emoji: "🤗", category: "people" },
  { zh: "老师", pinyin: "lao3 shi1", en: "teacher", emoji: "🧑‍🏫", category: "people" },
  { zh: "学生", pinyin: "xue2 sheng5", en: "student", emoji: "🧑‍🎓", category: "people" },
  { zh: "妈妈", pinyin: "ma1 ma5", en: "mom", emoji: "👩‍👧", category: "family" },
  { zh: "爸爸", pinyin: "ba4 ba5", en: "dad", emoji: "👨‍👧", category: "family" },
  { zh: "儿子", pinyin: "er2 zi5", en: "son", emoji: "👦", category: "family" },
  { zh: "女儿", pinyin: "nu:3 er2", en: "daughter", emoji: "👧", category: "family" },
  { zh: "家", pinyin: "jia1", en: "home / family", emoji: "🏠", category: "family" },

  // Numbers
  { zh: "一", pinyin: "yi1", en: "one", emoji: "1️⃣", category: "numbers" },
  { zh: "二", pinyin: "er4", en: "two", emoji: "2️⃣", category: "numbers" },
  { zh: "三", pinyin: "san1", en: "three", emoji: "3️⃣", category: "numbers" },
  { zh: "四", pinyin: "si4", en: "four", emoji: "4️⃣", category: "numbers" },
  { zh: "五", pinyin: "wu3", en: "five", emoji: "5️⃣", category: "numbers" },
  { zh: "六", pinyin: "liu4", en: "six", emoji: "6️⃣", category: "numbers" },
  { zh: "七", pinyin: "qi1", en: "seven", emoji: "7️⃣", category: "numbers" },
  { zh: "八", pinyin: "ba1", en: "eight", emoji: "8️⃣", category: "numbers" },
  { zh: "九", pinyin: "jiu3", en: "nine", emoji: "9️⃣", category: "numbers" },
  { zh: "十", pinyin: "shi2", en: "ten", emoji: "🔟", category: "numbers" },
  { zh: "几", pinyin: "ji3", en: "how many", emoji: "❓", category: "numbers" },

  // Food & drink
  { zh: "水", pinyin: "shui3", en: "water", emoji: "💧", category: "food" },
  { zh: "茶", pinyin: "cha2", en: "tea", emoji: "🍵", category: "food" },
  { zh: "咖啡", pinyin: "ka1 fei1", en: "coffee", emoji: "☕", category: "food" },
  { zh: "米饭", pinyin: "mi3 fan4", en: "rice", emoji: "🍚", category: "food" },
  { zh: "面条", pinyin: "mian4 tiao2", en: "noodles", emoji: "🍜", category: "food" },
  { zh: "苹果", pinyin: "ping2 guo3", en: "apple", emoji: "🍎", category: "food" },
  { zh: "菜", pinyin: "cai4", en: "vegetable / dish", emoji: "🥬", category: "food" },
  { zh: "吃", pinyin: "chi1", en: "to eat", emoji: "😋", category: "food" },
  { zh: "喝", pinyin: "he1", en: "to drink", emoji: "🥤", category: "food" },

  // Verbs
  { zh: "去", pinyin: "qu4", en: "to go", emoji: "🚶", category: "verbs" },
  { zh: "来", pinyin: "lai2", en: "to come", emoji: "🏃", category: "verbs" },
  { zh: "看", pinyin: "kan4", en: "to look / watch / read", emoji: "👀", category: "verbs" },
  { zh: "听", pinyin: "ting1", en: "to listen", emoji: "👂", category: "verbs" },
  { zh: "说", pinyin: "shuo1", en: "to speak / say", emoji: "🗣️", category: "verbs" },
  { zh: "读", pinyin: "du2", en: "to read", emoji: "📖", category: "verbs" },
  { zh: "写", pinyin: "xie3", en: "to write", emoji: "✍️", category: "verbs" },
  { zh: "爱", pinyin: "ai4", en: "to love", emoji: "❤️", category: "verbs" },
  { zh: "喜欢", pinyin: "xi3 huan5", en: "to like", emoji: "😍", category: "verbs" },
  { zh: "有", pinyin: "you3", en: "to have", emoji: "🈶", category: "verbs" },
  { zh: "买", pinyin: "mai3", en: "to buy", emoji: "🛒", category: "verbs" },
  { zh: "学习", pinyin: "xue2 xi2", en: "to study", emoji: "📚", category: "verbs" },
  { zh: "睡觉", pinyin: "shui4 jiao4", en: "to sleep", emoji: "😴", category: "verbs" },
  { zh: "叫", pinyin: "jiao4", en: "to be called", emoji: "📛", category: "verbs" },

  // Time
  { zh: "今天", pinyin: "jin1 tian1", en: "today", emoji: "📅", category: "time" },
  { zh: "明天", pinyin: "ming2 tian1", en: "tomorrow", emoji: "🌅", category: "time" },
  { zh: "昨天", pinyin: "zuo2 tian1", en: "yesterday", emoji: "🌙", category: "time" },
  { zh: "现在", pinyin: "xian4 zai4", en: "now", emoji: "⏰", category: "time" },
  { zh: "年", pinyin: "nian2", en: "year", emoji: "🗓️", category: "time" },
  { zh: "月", pinyin: "yue4", en: "month / moon", emoji: "🌕", category: "time" },
  { zh: "日", pinyin: "ri4", en: "day / sun", emoji: "☀️", category: "time" },
  { zh: "点", pinyin: "dian3", en: "o'clock", emoji: "🕐", category: "time" },

  // Places & things
  { zh: "中国", pinyin: "Zhong1 guo2", en: "China", emoji: "🇨🇳", category: "places" },
  { zh: "美国", pinyin: "Mei3 guo2", en: "USA", emoji: "🇺🇸", category: "places" },
  { zh: "学校", pinyin: "xue2 xiao4", en: "school", emoji: "🏫", category: "places" },
  { zh: "商店", pinyin: "shang1 dian4", en: "shop / store", emoji: "🏪", category: "places" },
  { zh: "饭馆", pinyin: "fan4 guan3", en: "restaurant", emoji: "🍽️", category: "places" },
  { zh: "书", pinyin: "shu1", en: "book", emoji: "📕", category: "things" },
  { zh: "钱", pinyin: "qian2", en: "money", emoji: "💰", category: "things" },
  { zh: "电脑", pinyin: "dian4 nao3", en: "computer", emoji: "💻", category: "things" },
  { zh: "手机", pinyin: "shou3 ji1", en: "cell phone", emoji: "📱", category: "things" },
  { zh: "猫", pinyin: "mao1", en: "cat", emoji: "🐱", category: "animals" },
  { zh: "狗", pinyin: "gou3", en: "dog", emoji: "🐶", category: "animals" },

  // Descriptions
  { zh: "好", pinyin: "hao3", en: "good", emoji: "👍", category: "adjectives" },
  { zh: "大", pinyin: "da4", en: "big", emoji: "🐘", category: "adjectives" },
  { zh: "小", pinyin: "xiao3", en: "small", emoji: "🐭", category: "adjectives" },
  { zh: "多", pinyin: "duo1", en: "many / much", emoji: "📚", category: "adjectives" },
  { zh: "少", pinyin: "shao3", en: "few / little", emoji: "🤏", category: "adjectives" },
  { zh: "热", pinyin: "re4", en: "hot", emoji: "🥵", category: "adjectives" },
  { zh: "冷", pinyin: "leng3", en: "cold", emoji: "🥶", category: "adjectives" },
  { zh: "高兴", pinyin: "gao1 xing4", en: "happy", emoji: "😄", category: "adjectives" },
  { zh: "漂亮", pinyin: "piao4 liang5", en: "pretty / beautiful", emoji: "✨", category: "adjectives" },

  // Question words
  { zh: "什么", pinyin: "shen2 me5", en: "what", emoji: "❓", category: "questions" },
  { zh: "谁", pinyin: "shei2", en: "who", emoji: "🤷", category: "questions" },
  { zh: "哪儿", pinyin: "na3 r5", en: "where", emoji: "📍", category: "questions" },
  { zh: "怎么", pinyin: "zen3 me5", en: "how", emoji: "🤔", category: "questions" },
  { zh: "吗", pinyin: "ma5", en: "(yes/no question particle)", emoji: "❔", category: "questions" },
];

export function byCategory(category: string): VocabWord[] {
  return VOCAB.filter((w) => w.category === category);
}

export function findWord(zh: string): VocabWord | undefined {
  return VOCAB.find((w) => w.zh === zh);
}
