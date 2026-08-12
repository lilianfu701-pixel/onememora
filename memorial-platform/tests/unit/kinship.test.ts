import { describe, expect, it } from "vitest";
import { buildGraph, classifyKinship } from "@/modules/genealogy/kinship";
import { kinshipLabel } from "@/modules/genealogy/kinship-terms";

/**
 * A three-generation family used across the cases:
 *
 *            yeye(m,1930) ── nainai(f,1934)      laoye(m,1932) ── laolao(f,1936)
 *                    │                                   │
 *        ┌───────────┼───────────┐                       │
 *     bofu(m,1955)  father(m,1958) ── mother(f,1960) ─────┘
 *        │                         │
 *     tang(m,1985)               ROOT(m,1988) ── wife(f,1990)
 *                                  │
 *                                son(m,2012)
 *
 * bofu is the father's OLDER brother (伯父); tang is bofu's son (堂兄, older).
 */
function family() {
  return buildGraph({
    nodes: [
      { id: "yeye", gender: "male", birthYear: 1930 },
      { id: "nainai", gender: "female", birthYear: 1934 },
      { id: "laoye", gender: "male", birthYear: 1932 },
      { id: "laolao", gender: "female", birthYear: 1936 },
      { id: "bofu", gender: "male", birthYear: 1955 },
      { id: "father", gender: "male", birthYear: 1958 },
      { id: "mother", gender: "female", birthYear: 1960 },
      { id: "root", gender: "male", birthYear: 1988 },
      { id: "wife", gender: "female", birthYear: 1990 },
      { id: "tang", gender: "male", birthYear: 1985 },
      { id: "son", gender: "male", birthYear: 2012 },
    ],
    parentEdges: [
      { parentId: "yeye", childId: "bofu" },
      { parentId: "nainai", childId: "bofu" },
      { parentId: "yeye", childId: "father" },
      { parentId: "nainai", childId: "father" },
      { parentId: "laoye", childId: "mother" },
      { parentId: "laolao", childId: "mother" },
      { parentId: "father", childId: "root" },
      { parentId: "mother", childId: "root" },
      { parentId: "bofu", childId: "tang" },
      { parentId: "root", childId: "son" },
    ],
    partnerEdges: [
      { aId: "yeye", bId: "nainai" },
      { aId: "laoye", bId: "laolao" },
      { aId: "father", bId: "mother" },
      { aId: "root", bId: "wife" },
    ],
  });
}

const zh = (target: string) =>
  kinshipLabel(classifyKinship("root", target, family()), "zh-CN");
const en = (target: string) =>
  kinshipLabel(classifyKinship("root", target, family()), "en");

describe("kinship classification — Chinese terms", () => {
  it("names direct ancestors and the paternal/maternal split", () => {
    expect(zh("father")).toBe("父亲");
    expect(zh("mother")).toBe("母亲");
    expect(zh("yeye")).toBe("祖父"); // father's father
    expect(zh("nainai")).toBe("祖母");
    expect(zh("laoye")).toBe("外祖父"); // mother's father
    expect(zh("laolao")).toBe("外祖母");
  });

  it("distinguishes 伯父 (father's older brother) by birth order", () => {
    expect(zh("bofu")).toBe("伯父");
  });

  it("names a paternal cousin as 堂, elder by birth year", () => {
    expect(zh("tang")).toBe("堂兄"); // bofu's son, born 1985 < root 1988
  });

  it("names descendants", () => {
    expect(zh("son")).toBe("儿子");
  });

  it("names the spouse and in-laws", () => {
    expect(zh("wife")).toBe("妻子");
    // laoye is the wife? no — laoye is root's own maternal grandfather above.
  });

  it("returns null for self", () => {
    expect(zh("root")).toBeNull();
  });
});

describe("kinship classification — spouse's family (affinal)", () => {
  it("names a spouse's parent as parent-in-law", () => {
    const g = buildGraph({
      nodes: [
        { id: "root", gender: "male" },
        { id: "spouse", gender: "female" },
        { id: "fil", gender: "male" },
      ],
      parentEdges: [{ parentId: "fil", childId: "spouse" }],
      partnerEdges: [{ aId: "root", bId: "spouse" }],
    });
    expect(kinshipLabel(classifyKinship("root", "fil", g), "zh-CN")).toBe(
      "岳父／公公",
    );
  });

  it("names a child's spouse as 儿媳 / 女婿", () => {
    const g = buildGraph({
      nodes: [
        { id: "root", gender: "male" },
        { id: "son", gender: "male" },
        { id: "sonwife", gender: "female" },
      ],
      parentEdges: [{ parentId: "root", childId: "son" }],
      partnerEdges: [{ aId: "son", bId: "sonwife" }],
    });
    expect(kinshipLabel(classifyKinship("root", "sonwife", g), "zh-CN")).toBe(
      "儿媳",
    );
  });
});

describe("kinship classification — structural fallback", () => {
  it("stays side-neutral when a parent's gender is unknown", () => {
    // Uncle reachable only through a genderless parent → no 伯/叔/舅.
    const g = buildGraph({
      nodes: [
        { id: "root" },
        { id: "parent" }, // gender unknown
        { id: "gp" },
        { id: "uncle", gender: "male" },
      ],
      parentEdges: [
        { parentId: "parent", childId: "root" },
        { parentId: "gp", childId: "parent" },
        { parentId: "gp", childId: "uncle" },
      ],
      partnerEdges: [],
    });
    expect(kinshipLabel(classifyKinship("root", "uncle", g), "zh-CN")).toBe(
      "父母的兄弟",
    );
  });
});

describe("kinship classification — English is coarse", () => {
  it("collapses the uncle terms to one word", () => {
    expect(en("bofu")).toBe("Uncle");
    expect(en("yeye")).toBe("Grandfather");
    expect(en("laoye")).toBe("Grandfather"); // no paternal/maternal split
    expect(en("tang")).toBe("Cousin");
    expect(en("son")).toBe("Son");
  });
});
