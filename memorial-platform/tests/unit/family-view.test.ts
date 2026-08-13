import { describe, expect, it } from "vitest";
import { assembleFamilyView } from "@/modules/genealogy/family-view";
import type { RelativeRow } from "@/modules/genealogy/family-view";
import { kinshipLabel } from "@/modules/genealogy/kinship-terms";

const root = { name: "本人", birthYear: 1960, deathYear: 2020 };

function rel(
  id: string,
  relationshipToDeceased: string,
  name: string,
): RelativeRow {
  return { id, name, relationshipToDeceased, isDeceased: false, showFullName: true };
}

/** Label of a node (by its relative id) relative to the root, in Chinese. */
function labelOf(
  view: NonNullable<ReturnType<typeof assembleFamilyView>>,
  relId: string,
): string | null {
  const kin = view.kinship.get(`rel:${relId}`);
  return kin ? kinshipLabel(kin, "zh-CN") : "MISSING";
}

describe("assembleFamilyView — direct relatives", () => {
  const view = assembleFamilyView({
    root,
    linked: [],
    relatives: [
      rel("f", "father", "父"),
      rel("m", "mother", "母"),
      rel("s", "son", "子"),
      rel("w", "wife", "妻"),
      rel("ob", "older_brother", "兄"),
    ],
  });

  it("builds a tree with every relative plus the root", () => {
    expect(view).not.toBeNull();
    // father, mother, son, wife, older_brother, root = 6 nodes.
    expect(view!.tree.nodes.length).toBe(6);
  });

  it("names each direct relative from its type", () => {
    expect(labelOf(view!, "f")).toBe("父亲");
    expect(labelOf(view!, "m")).toBe("母亲");
    expect(labelOf(view!, "s")).toBe("儿子");
    expect(labelOf(view!, "w")).toBe("妻子");
    expect(labelOf(view!, "ob")).toBe("哥哥"); // older brother
  });
});

describe("assembleFamilyView — grandparents anchor through a parent", () => {
  it("keeps a paternal grandfather paternal even with no father listed", () => {
    const view = assembleFamilyView({
      root,
      linked: [],
      relatives: [rel("pgf", "paternal_grandfather", "祖")],
    });
    expect(view).not.toBeNull();
    // grandfather + withheld father anchor + root = 3 nodes.
    expect(view!.tree.nodes.length).toBe(3);
    expect(view!.tree.nodes.some((n) => n.visible === false)).toBe(true);
    expect(labelOf(view!, "pgf")).toBe("祖父");
  });

  it("attaches the grandfather to a named father when present", () => {
    const view = assembleFamilyView({
      root,
      linked: [],
      relatives: [
        rel("f", "father", "父"),
        rel("pgf", "paternal_grandfather", "祖"),
      ],
    });
    // father + grandfather + root, no anchor needed = 3 nodes.
    expect(view!.tree.nodes.length).toBe(3);
    expect(view!.tree.nodes.every((n) => n.visible === true)).toBe(true);
    expect(labelOf(view!, "pgf")).toBe("祖父");
  });
});

describe("assembleFamilyView — merging a confirmed link onto a relative", () => {
  it("gives the named relative a clickable slug instead of duplicating them", () => {
    const view = assembleFamilyView({
      root,
      relatives: [rel("f", "father", "李存義")],
      linked: [
        {
          personId: "p1",
          name: "李存義",
          slug: "memorial-abc",
          role: "parent",
          gender: "male",
          birthYear: 1930,
          deathYear: 1995,
          lifeStatus: "deceased",
        },
      ],
    });
    // Merged, not doubled: father + root = 2 nodes.
    expect(view!.tree.nodes.length).toBe(2);
    const father = view!.tree.nodes.find(
      (n) => n.visible && n.personId === "rel:f",
    );
    expect(father?.visible && father.memorialSlug).toBe("memorial-abc");
    expect(labelOf(view!, "f")).toBe("父亲");
  });

  it("adds an unmatched link as its own node", () => {
    const view = assembleFamilyView({
      root,
      relatives: [],
      linked: [
        {
          personId: "p2",
          name: "外公",
          slug: "memorial-xyz",
          role: "parent",
          gender: "male",
          birthYear: 1928,
          deathYear: 2000,
          lifeStatus: "deceased",
        },
      ],
    });
    expect(view!.tree.nodes.length).toBe(2);
    const kin = view!.kinship.get("mem:p2");
    expect(kin && kinshipLabel(kin, "zh-CN")).toBe("父亲");
  });
});

describe("assembleFamilyView — collateral spouse", () => {
  it("names a sister's husband by the affinal term", () => {
    const view = assembleFamilyView({
      root,
      linked: [],
      relatives: [
        { id: "sis", relationshipToDeceased: "older_sister", name: "姐", isDeceased: false, showFullName: true },
        { id: "bil", relationshipToDeceased: "relative_spouse", name: "姐夫", isDeceased: false, showFullName: true, spouseOfId: "sis" },
      ],
    })!;
    // The sister's husband is her partner and reads as a sibling's spouse.
    expect(labelOf(view, "bil")).toBe("姐夫／妹夫");
  });

  it("names a son's wife 儿媳", () => {
    const view = assembleFamilyView({
      root,
      linked: [],
      relatives: [
        { id: "son", relationshipToDeceased: "son", name: "子", isDeceased: false, showFullName: true },
        { id: "dil", relationshipToDeceased: "relative_spouse", name: "媳", isDeceased: false, showFullName: true, spouseOfId: "son" },
      ],
    })!;
    expect(labelOf(view, "dil")).toBe("儿媳");
  });
});

describe("assembleFamilyView — pulls a linked memorial's family", () => {
  it("turns the father's brother into an uncle and his father into a grandfather", () => {
    const view = assembleFamilyView({
      root,
      relatives: [
        { id: "f", relationshipToDeceased: "father", name: "李存義", isDeceased: true, showFullName: true },
      ],
      linked: [
        {
          personId: "pf",
          name: "李存義",
          slug: "mem-f",
          role: "parent",
          gender: "male",
          birthYear: 1930,
          deathYear: 1990,
          lifeStatus: "deceased",
          relatives: [
            { id: "u", relationshipToDeceased: "older_brother", name: "李伯", isDeceased: true, showFullName: true },
            { id: "gf", relationshipToDeceased: "father", name: "李祖", isDeceased: true, showFullName: true },
          ],
        },
      ],
    })!;
    expect(labelOf(view, "u")).toBe("伯父");
    expect(labelOf(view, "gf")).toBe("祖父");
  });
});

describe("assembleFamilyView — nothing to draw", () => {
  it("returns null when the root has no relatives or links", () => {
    expect(assembleFamilyView({ root, relatives: [], linked: [] })).toBeNull();
  });
});
