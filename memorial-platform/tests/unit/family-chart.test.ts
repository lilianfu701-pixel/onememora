import { describe, expect, it } from "vitest";
import { assembleFamilyView } from "@/modules/genealogy/family-view";
import type { RelativeRow } from "@/modules/genealogy/family-view";
import { buildFamilyChart } from "@/modules/genealogy/family-chart";
import type { ChartPerson, ChartUnion } from "@/modules/genealogy/family-chart";

const root = { name: "本人", birthYear: 1960, deathYear: 2020 };

function rel(
  id: string,
  relationshipToDeceased: string,
  name: string,
  coParentId?: string,
): RelativeRow {
  return {
    id,
    name,
    relationshipToDeceased,
    isDeceased: false,
    showFullName: true,
    coParentId: coParentId ?? null,
  };
}

function chart(relatives: RelativeRow[]): ChartUnion[] {
  const view = assembleFamilyView({ root, relatives, linked: [] });
  return view ? buildFamilyChart(view.tree) : [];
}

const nameOf = (p: ChartPerson): string => (p.withheld ? "···" : p.name);

describe("buildFamilyChart — couples and descent", () => {
  it("makes the parents one couple with the root descending from them", () => {
    const [top] = chart([rel("f", "father", "父"), rel("m", "mother", "母")]);
    expect(top).toBeDefined();
    // Anchored on one parent, married to the other.
    expect(new Set([nameOf(top!.anchor), nameOf(top!.marriages[0]!.spouse!)])).toEqual(
      new Set(["父", "母"]),
    );
    expect(top!.marriages).toHaveLength(1);
    expect(top!.marriages[0]!.children.some((u) => u.anchor.isRoot)).toBe(true);
  });

  it("keeps the root's own marriage with its children beneath it", () => {
    const [top] = chart([
      rel("w", "wife", "妻"),
      rel("s", "son", "子"),
      rel("d", "daughter", "女"),
    ]);
    expect(top!.anchor.isRoot).toBe(true);
    expect(top!.marriages).toHaveLength(1);
    expect(nameOf(top!.marriages[0]!.spouse!)).toBe("妻");
    expect(top!.marriages[0]!.children).toHaveLength(2);
  });

  it("groups a sibling under the shared parents, beside the root", () => {
    const [top] = chart([
      rel("f", "father", "父"),
      rel("m", "mother", "母"),
      rel("ob", "older_brother", "兄"),
    ]);
    const kids = top!.marriages[0]!.children.map((u) => nameOf(u.anchor));
    expect(kids).toContain("兄");
    expect(top!.marriages[0]!.children.some((u) => u.anchor.isRoot)).toBe(true);
  });
});

describe("buildFamilyChart — remarriage (ex-spouse)", () => {
  it("splits children between the current and the ended marriage", () => {
    const [top] = chart([
      rel("w", "wife", "现妻"),
      rel("ex", "ex_wife", "前妻"),
      rel("s", "son", "长子", "w"),
      rel("d", "daughter", "小女", "ex"),
    ]);
    expect(top!.anchor.isRoot).toBe(true);
    expect(top!.marriages).toHaveLength(2);

    const current = top!.marriages.find((m) => !m.dissolved);
    const ended = top!.marriages.find((m) => m.dissolved);
    expect(nameOf(current!.spouse!)).toBe("现妻");
    expect(current!.children.map((u) => nameOf(u.anchor))).toEqual(["长子"]);
    expect(nameOf(ended!.spouse!)).toBe("前妻");
    expect(ended!.children.map((u) => nameOf(u.anchor))).toEqual(["小女"]);
  });

  it("puts the current marriage before the ended one", () => {
    const [top] = chart([
      rel("ex", "ex_wife", "前妻"),
      rel("w", "wife", "现妻"),
    ]);
    expect(top!.marriages[0]!.dissolved).toBe(false);
    expect(top!.marriages[1]!.dissolved).toBe(true);
  });
});

describe("buildFamilyChart — withheld anchor", () => {
  it("threads an unshown parent between a grandfather and the root", () => {
    const [top] = chart([rel("pgf", "paternal_grandfather", "祖")]);
    expect(nameOf(top!.anchor)).toBe("祖");
    const fatherUnion = top!.marriages[0]!.children[0]!;
    expect(fatherUnion.anchor.withheld).toBe(true);
    expect(fatherUnion.marriages[0]!.children[0]!.anchor.isRoot).toBe(true);
  });
});
