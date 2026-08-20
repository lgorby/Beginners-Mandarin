import { describe, expect, it } from "vitest";
import { pinyinFor } from "@/lib/dictionary";
import { scorePronunciation } from "@/lib/pronounce";

describe("pinyinFor", () => {
  it("reads a multi-character word as one word", () => {
    expect(pinyinFor("学生")).toEqual(["xue2", "sheng5"]);
  });

  it("falls back to characters around unknown text", () => {
    expect(pinyinFor("你好")).toEqual(["ni3", "hao3"]);
  });
});

describe("scorePronunciation", () => {
  it("gives 100 for the exact characters", () => {
    expect(scorePronunciation("你好", ["你好"])).toMatchObject({
      transcript: "你好",
      score: 100,
      toneHint: false,
    });
  });

  it("gives 100 for a same-sound same-tone homophone", () => {
    // 事 is shi4, exactly like the target 是 — the pronunciation was right.
    expect(scorePronunciation("是", ["事"])).toMatchObject({
      transcript: "事",
      score: 100,
      toneHint: false,
    });
  });

  it("credits the right syllable with the wrong tone, and flags it", () => {
    // 持 is chi2; the target 吃 is chi1: right sound, wrong tone.
    expect(scorePronunciation("吃", ["持"])).toMatchObject({
      transcript: "持",
      score: 70,
      toneHint: true,
      syllables: [{ pinyin: "chī", status: "sound" }],
    });
  });

  it("gives no sound credit to a different syllable", () => {
    // 七 is qi1 — not chi at all.
    expect(scorePronunciation("吃", ["七"]).score).toBe(0);
  });

  it("picks the best candidate of several", () => {
    expect(scorePronunciation("吃", ["七", "持", "吃"])).toMatchObject({
      transcript: "吃",
      score: 100,
      toneHint: false,
      syllables: [{ pinyin: "chī", status: "full" }],
    });
  });

  it("reports each syllable of a partial sentence", () => {
    // 我喝 covers two of three syllables with correct tones.
    expect(scorePronunciation("我喝茶", ["我喝"])).toMatchObject({
      score: 67,
      syllables: [
        { pinyin: "wǒ", status: "full" },
        { pinyin: "hē", status: "full" },
        { pinyin: "chá", status: "miss" },
      ],
    });
  });

  it("handles no usable candidates", () => {
    expect(scorePronunciation("你好", ["", " "])).toMatchObject({
      transcript: "",
      score: 0,
      syllables: [
        { pinyin: "nǐ", status: "miss" },
        { pinyin: "hǎo", status: "miss" },
      ],
    });
  });
});
