import { describe, expect, it } from "vitest";
import {
  dueQueue,
  INTERVALS_DAYS,
  learnedCount,
  rateCard,
  type SrsStore,
} from "@/lib/srs";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("rateCard", () => {
  it("starts an unseen card in box 1 on good", () => {
    const next = rateCard({}, "你", "good", NOW);
    expect(next["你"]).toEqual({ box: 1, due: NOW + 1 * DAY });
  });

  it("jumps two boxes on easy", () => {
    const next = rateCard({}, "你", "easy", NOW);
    expect(next["你"]).toEqual({ box: 2, due: NOW + 3 * DAY });
  });

  it("advances one box on good and uses that box's interval", () => {
    const store: SrsStore = { 你: { box: 2, due: 0 } };
    expect(rateCard(store, "你", "good", NOW)["你"]).toEqual({
      box: 3,
      due: NOW + 7 * DAY,
    });
  });

  it("sends the card back to box 0, due in a minute, on again", () => {
    const store: SrsStore = { 你: { box: 4, due: 0 } };
    expect(rateCard(store, "你", "again", NOW)["你"]).toEqual({
      box: 0,
      due: NOW + 60_000,
    });
  });

  it("never advances past the last box", () => {
    const top = INTERVALS_DAYS.length - 1;
    const store: SrsStore = { 你: { box: top, due: 0 } };
    expect(rateCard(store, "你", "easy", NOW)["你"]).toEqual({
      box: top,
      due: NOW + INTERVALS_DAYS[top] * DAY,
    });
  });

  it("does not mutate the input store", () => {
    const store: SrsStore = { 你: { box: 1, due: 0 } };
    rateCard(store, "你", "good", NOW);
    expect(store["你"]).toEqual({ box: 1, due: 0 });
  });
});

describe("dueQueue", () => {
  const words = ["你", "好", "我", "是"];

  it("includes unseen cards and cards that are due", () => {
    const store: SrsStore = {
      你: { box: 1, due: NOW - 1 }, // due
      好: { box: 1, due: NOW + 1 }, // not yet
    };
    expect(dueQueue(store, words, NOW)).toEqual(["你", "我", "是"]);
  });

  it("puts seen due cards before new cards, oldest due first", () => {
    const store: SrsStore = {
      我: { box: 1, due: NOW - 5 },
      是: { box: 2, due: NOW - 50 },
    };
    expect(dueQueue(store, words, NOW)).toEqual(["是", "我", "你", "好"]);
  });

  it("caps the session length", () => {
    expect(dueQueue({}, words, NOW, 2)).toEqual(["你", "好"]);
  });

  it("is empty when everything is scheduled for later", () => {
    const store: SrsStore = Object.fromEntries(
      words.map((zh) => [zh, { box: 1, due: NOW + DAY }])
    );
    expect(dueQueue(store, words, NOW)).toEqual([]);
  });
});

describe("learnedCount", () => {
  it("counts cards that reached box 2", () => {
    const store: SrsStore = {
      你: { box: 0, due: 0 },
      好: { box: 1, due: 0 },
      我: { box: 2, due: 0 },
      是: { box: 5, due: 0 },
    };
    expect(learnedCount(store)).toBe(2);
  });
});
