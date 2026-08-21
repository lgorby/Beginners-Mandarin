import { describe, expect, it } from "vitest";
import {
  bestCandidate,
  normTag,
  pickVoice,
  rankVoices,
  scoreMatch,
  voiceWarningKind,
} from "@/lib/speech";

describe("normTag", () => {
  // The one predicate every BCP-47 comparison in the app goes through —
  // VoicePicker and the kid-path settings sheet included — so a tag
  // written with an underscore (some browsers report "es_ES") still
  // matches one written with a hyphen.
  it("lowercases the tag", () => {
    expect(normTag("ES-mx")).toBe("es-mx");
  });

  it("folds an underscore region separator to a hyphen", () => {
    expect(normTag("es_ES")).toBe("es-es");
  });

  it("agrees on both spellings of the same tag", () => {
    expect(normTag("es_ES")).toBe(normTag("ES-es"));
  });
});

describe("scoreMatch", () => {
  it("gives 100 for an exact match", () => {
    expect(scoreMatch("你好", "你好")).toBe(100);
  });

  it("ignores punctuation and spacing", () => {
    expect(scoreMatch("我喝茶。", "我 喝 茶")).toBe(100);
  });

  it("gives partial credit for a partial sentence", () => {
    expect(scoreMatch("我喝茶", "我茶")).toBe(67);
  });

  it("gives 0 when nothing matches", () => {
    expect(scoreMatch("吃", "持")).toBe(0);
  });

  it("ignores case and accents so Spanish transcripts never lose points to spelling", () => {
    expect(scoreMatch("¿tú quieres té?", "Tu quieres te")).toBe(100);
  });

  it("scores a partial Spanish sentence partially", () => {
    expect(scoreMatch("yo bebo agua", "yo agua")).toBeLessThan(100);
    expect(scoreMatch("yo bebo agua", "yo agua")).toBeGreaterThan(40);
  });
});

describe("bestCandidate", () => {
  // A recognition event: each inner array is one result's alternatives.
  const ev = (...results: string[][]) => ({
    results: results.map((alts) => alts.map((transcript) => ({ transcript }))),
  });

  it("prefers a later alternative that matches the target", () => {
    expect(bestCandidate("吃", ev(["持", "吃"]))).toEqual({
      transcript: "吃",
      score: 100,
    });
  });

  it("falls back to the first alternative when none match", () => {
    expect(bestCandidate("吃", ev(["持", "迟"]))).toEqual({
      transcript: "持",
      score: 0,
    });
  });

  it("joins the stream when the final transcript is empty (Edge)", () => {
    expect(bestCandidate("你好", ev(["你"], ["好"], [""]))).toEqual({
      transcript: "你好",
      score: 100,
    });
  });

  it("reports an event with no text as score -1", () => {
    expect(bestCandidate("吃", ev([""]))).toEqual({
      transcript: "",
      score: -1,
    });
  });
});

describe("rankVoices", () => {
  // The Spanish course's real configuration: es-MX first, then other
  // Latin American tags, Castilian dead last.
  const PREFER = ["es-MX", "es-US", "es-419"];
  const AVOID = ["es-ES"];
  const v = (lang: string) => ({ lang });
  const langs = (voices: { lang: string }[]) => voices.map((x) => x.lang);

  it("puts a Latin American voice above a Castilian one", () => {
    expect(langs(rankVoices([v("es-ES"), v("es-US")], PREFER, AVOID))).toEqual([
      "es-US",
      "es-ES",
    ]);
  });

  it("prefers the exact requested region above all", () => {
    expect(
      langs(rankVoices([v("es-ES"), v("es-US"), v("es-MX")], PREFER, AVOID))
    ).toEqual(["es-MX", "es-US", "es-ES"]);
  });

  it("ranks an unlisted region above an avoided one", () => {
    expect(langs(rankVoices([v("es-ES"), v("es-AR")], PREFER, AVOID))).toEqual([
      "es-AR",
      "es-ES",
    ]);
  });

  it("still returns an avoided voice when it is all there is", () => {
    expect(langs(rankVoices([v("es-ES")], PREFER, AVOID))).toEqual(["es-ES"]);
  });

  it("compares tags case-insensitively and across _ vs -", () => {
    expect(langs(rankVoices([v("es_es"), v("ES-us")], PREFER, AVOID))).toEqual([
      "ES-us",
      "es_es",
    ]);
  });
});

describe("pickVoice", () => {
  // Ranked best-first, the way voicesFor() returns them: the Latin
  // American voice this course wants, then the Castilian one it avoids.
  const voices = [
    { name: "Microsoft Dalia", lang: "es-MX" },
    { name: "Microsoft Helena", lang: "es-ES" },
  ];

  it("uses the saved preference even when it is not the best-ranked voice", () => {
    // This is the whole point: settings must be able to see the same
    // wrong-variety choice that speak() will actually make.
    expect(pickVoice(voices, "Microsoft Helena")?.name).toBe(
      "Microsoft Helena"
    );
  });

  it("falls back to the best-ranked voice when the saved one is uninstalled", () => {
    expect(pickVoice(voices, "Microsoft Gone")?.name).toBe("Microsoft Dalia");
  });

  it("falls back to the best-ranked voice when nothing is saved", () => {
    expect(pickVoice(voices, null)?.name).toBe("Microsoft Dalia");
    expect(pickVoice(voices)?.name).toBe("Microsoft Dalia");
  });

  it("returns undefined when the system has no voices at all", () => {
    expect(pickVoice([], "Microsoft Dalia")).toBeUndefined();
  });
});

describe("voiceWarningKind", () => {
  const AVOID = ["es-ES"];

  it("warns nothing when the chosen voice isn't a wrong variety", () => {
    expect(voiceWarningKind("es-MX", "es-MX", AVOID)).toBe("none");
  });

  it("warns nothing when no voice is installed at all", () => {
    // The separate "no voice installed" notice covers this case; this
    // function must not also fire for it.
    expect(voiceWarningKind("", "", AVOID)).toBe("none");
  });

  it("says install a voice pack when even the best ranking is wrong-variety", () => {
    // Nothing better is on the system — a saved preference can't be the
    // cause, since the ranking would have picked the same voice anyway.
    expect(voiceWarningKind("es-ES", "es-ES", AVOID)).toBe("install");
  });

  it("says open the voice picker when a saved preference overrode a better ranking", () => {
    // The ranking would have picked es-MX; only a saved preference could
    // have produced the Castilian choice actually in use.
    expect(voiceWarningKind("es-ES", "es-MX", AVOID)).toBe("picker");
  });

  it("compares tags case-insensitively and across _ vs -", () => {
    expect(voiceWarningKind("ES_es", "es-MX", AVOID)).toBe("picker");
  });

  it("never warns when the language has no wrong-variety voices (Mandarin)", () => {
    expect(voiceWarningKind("zh-TW", "zh-CN", [])).toBe("none");
  });
});
