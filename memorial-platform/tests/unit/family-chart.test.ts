import { describe, expect, it } from "vitest";
import { assembleFamilyView } from "@/modules/genealogy/family-view";
import type { RelativeRow } from "@/modules/genealogy/family-view";
import { buildFamilyChart } from "@/modules/genealogy/family-chart";
import type { ChartUnion } from "@/modules/genealogy/family-chart";

const root = { name: "本人", birthYear: 1960, deathYear: 2020 };

function rel(
  id: string,
  relationshipToDeceased: string,
  name: string,
): RelativeRow {
  return { id, name, relationshipToDeceased, isDeceased: false, showFullName: true };
}

function chartFrom(relatives: RelativeRow[]): ChartUnion[] {
  const view = assembleFamilyView({ root, relatives, linked: [] });
  if (!view) return [];
  return buildFamilyChart(view.tree, view.kinship);
}

function names(u: ChartUnion): string[] {
  return u.partners.map((p) => (p.withheld ? "···" : p.name));
}

describe("buildFamilyChart — couples and descent", () => {
  it("groups father and mother into one couple with the root beneath them", () => {
    const forest = chartFrom([
      rel("f", "father", "父"),
      rel("m", "mother", "母"),
    ]);
    // One top union: the parents' couple.
    expect(forest.length).toBe(1);
    const top = forest[0]!;
    expect(new Set(names(top))).toEqual(new Set(["父", "母"]));
    // The root descends from that couple.
    expect(top.children.length).toBe(1);
    expect(top.children[0]!.partners.some((p) => p.isRoot)).toBe(true);
  });

  it("keeps the root and spouse as a couple, children below them", () => {
    const forest = chartFrom([
      rel("f", "father", "父"),
      rel("w", "wife", "妻"),
      rel("s", "son", "子"),
      rel("d", "daughter", "女"),
    ]);
    const top = forest[0]!; // father (single parent) at the top
    expect(names(top)).toContain("父");
    const rootUnion = top.children[0]!;
    // Root couple = root + wife.
    expect(rootUnion.partners.map((p) => p.name)).toContain("妻");
    expect(rootUnion.partners.some((p) => p.isRoot)).toBe(true);
    // Two children descend from the root couple.
    expect(rootUnion.children.length).toBe(2);
  });

  it("places siblings under the shared parents, not beside the root", () => {
    const forest = chartFrom([
      rel("f", "father", "父"),
      rel("m", "mother", "母"),
      rel("ob", "older_brother", "兄"),
    ]);
    const parents = forest[0]!;
    // Root and the brother are both children of the parents couple.
    expect(parents.children.length).toBe(2);
    const kids = parents.children.flatMap(names);
    expect(kids).toContain("兄");
  });

  it("marks the married-in spouse distinctly from blood kin", () => {
    const forest = chartFrom([rel("w", "wife", "妻"), rel("s", "son", "子")]);
    const rootUnion = forest[0]!;
    const wife = rootUnion.partners.find((p) => p.name === "妻");
    const rootPerson = rootUnion.partners.find((p) => p.isRoot);
    expect(wife?.marriedIn).toBe(true);
    expect(rootPerson?.marriedIn).toBe(false);
  });
});

describe("buildFamilyChart — withheld anchor", () => {
  it("shows an unshown parent generation between grandparent and root", () => {
    const forest = chartFrom([rel("pgf", "paternal_grandfather", "祖")]);
    // Grandfather at top; his child is the withheld father anchor.
    const gp = forest[0]!;
    expect(names(gp)).toContain("祖");
    const anchorUnion = gp.children[0]!;
    expect(anchorUnion.partners.some((p) => p.withheld)).toBe(true);
    // The root descends from the anchor.
    expect(anchorUnion.children[0]!.partners.some((p) => p.isRoot)).toBe(true);
  });
});
