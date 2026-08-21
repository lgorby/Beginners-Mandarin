import { describe, expect, it } from "vitest";
import { articleFor, posLabel, spokenForm } from "../spanishNouns";

describe("articleFor", () => {
  it("gives plain masculine and feminine nouns their article", () => {
    expect(articleFor("libro", "nm")).toBe("el");
    expect(articleFor("casa", "nf")).toBe("la");
  });

  it("gives a stressed a- feminine noun its masculine article", () => {
    // "la agua" is wrong Spanish; the article changes, the gender doesn't.
    expect(articleFor("agua", "nf")).toBe("el");
    expect(articleFor("águila", "nf")).toBe("el");
  });

  it("treats an nmf headword whose feminine is a different word as masculine", () => {
    // WikDict tags perro/perra, actor/actriz and abuelo/abuela nmf, but
    // the headword it stores is only the masculine one — "el/la perro"
    // is not Spanish, and printing it also cost these 417 entries their
    // spoken article.
    expect(articleFor("perro", "nmf")).toBe("el");
    expect(articleFor("actor", "nmf")).toBe("el");
    expect(articleFor("abuelo", "nmf")).toBe("el");
  });

  it("keeps el/la for genuinely common-gender nouns", () => {
    // One spelling, either gender: el artista and la artista are both
    // right, so neither article can be dropped.
    expect(articleFor("activista", "nmf")).toBe("el/la");
    expect(articleFor("gimnasta", "nmf")).toBe("el/la");
    expect(articleFor("poeta", "nmf")).toBe("el/la");
  });

  it("keeps el/la for common-gender nouns ending in -nte", () => {
    // "el cliente" and "la cliente" are both standard Spanish — these
    // -nte nouns are invariable just like the -a ones above.
    expect(articleFor("cliente", "nmf")).toBe("el/la");
    expect(articleFor("cantante", "nmf")).toBe("el/la");
    expect(articleFor("gerente", "nmf")).toBe("el/la");
  });

  it("keeps el/la for common-gender nouns ending in -ense", () => {
    // Nationality/origin adjectives-turned-nouns in -ense don't change
    // for gender either: el nicaragüense, la nicaragüense.
    expect(articleFor("nicaragüense", "nmf")).toBe("el/la");
  });

  it("treats elefante and infante as masculine despite ending in -nte", () => {
    // These two form their feminine by changing the word (la elefanta,
    // la infanta), so unlike cliente/cantante they are not common-gender.
    expect(articleFor("elefante", "nmf")).toBe("el");
    expect(articleFor("infante", "nmf")).toBe("el");
  });

  it("gives non-nouns no article at all", () => {
    expect(articleFor("hola", "interj")).toBeUndefined();
    expect(articleFor("comer", "v")).toBeUndefined();
    expect(articleFor("rápido", "adj")).toBeUndefined();
  });
});

describe("spokenForm", () => {
  it("speaks a noun with its article, because the article is part of the word", () => {
    expect(spokenForm("casa", "nf")).toBe("la casa");
    expect(spokenForm("agua", "nf")).toBe("el agua");
    expect(spokenForm("perro", "nmf")).toBe("el perro");
  });

  it("speaks a common-gender noun bare", () => {
    // "el/la" is a written shorthand — read aloud it is nonsense.
    expect(spokenForm("activista", "nmf")).toBe("activista");
    expect(spokenForm("cliente", "nmf")).toBe("cliente");
  });

  it("speaks elefante and infante with their masculine article", () => {
    // Not common-gender, so unlike "cliente" these keep a spoken article.
    expect(spokenForm("elefante", "nmf")).toBe("el elefante");
    expect(spokenForm("infante", "nmf")).toBe("el infante");
  });

  it("speaks a non-noun exactly as written", () => {
    expect(spokenForm("hola", "interj")).toBe("hola");
  });
});

describe("posLabel", () => {
  it("labels an nmf headword by what it actually is", () => {
    expect(posLabel("perro", "nmf")).toBe("noun (m.)");
    expect(posLabel("activista", "nmf")).toBe("noun (m./f.)");
    expect(posLabel("cliente", "nmf")).toBe("noun (m./f.)");
    expect(posLabel("cantante", "nmf")).toBe("noun (m./f.)");
    // elefante/infante end in -nte but aren't common-gender — the label
    // must agree with the "el elefante" article, not the -nte pattern.
    expect(posLabel("elefante", "nmf")).toBe("noun (m.)");
    expect(posLabel("infante", "nmf")).toBe("noun (m.)");
  });

  it("labels the other tags from the fixed table", () => {
    expect(posLabel("casa", "nf")).toBe("noun (f.)");
    expect(posLabel("comer", "v")).toBe("verb");
  });

  it("returns undefined for a tag it has no label for", () => {
    expect(posLabel("algo", "")).toBeUndefined();
  });
});
