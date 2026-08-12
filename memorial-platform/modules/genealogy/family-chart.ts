import type { Tree, TreeNode } from "./tree";
import type { Gender } from "./kinship";

/**
 * Turns the flat family graph into the nested shape a genealogical chart is
 * drawn from: a forest of {@link ChartUnion}s.
 *
 * Each union is centred on an *anchor* — the person on the line of descent —
 * and lists that person's *marriages*. A marriage carries its spouse, whether
 * it has ended (an ex-spouse), and the children born to it. Modelling
 * marriages rather than one flat couple is what lets a person hold two
 * marriages at once and keeps each set of children under the right one.
 *
 * Two people count as a marriage when they are partners or share a child, so a
 * "father" and "mother" entered separately still resolve to one couple. A
 * child with no stated other-parent falls to the anchor's current marriage.
 */

export type ChartPerson = {
  ref: number;
  personId: string | null;
  name: string;
  years: string | null;
  memorialSlug: string | null;
  gender: Gender;
  isRoot: boolean;
  /** Someone whose identity is withheld — an unshown connecting generation. */
  withheld: boolean;
};

export type ChartMarriage = {
  spouse: ChartPerson | null;
  /** The marriage has ended: the spouse is an ex-spouse. */
  dissolved: boolean;
  children: ChartUnion[];
};

export type ChartUnion = {
  key: string;
  anchor: ChartPerson;
  marriages: ChartMarriage[];
};

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

export function buildFamilyChart(tree: Tree): ChartUnion[] {
  const nodeByRef = new Map<number, TreeNode>();
  for (const node of tree.nodes) nodeByRef.set(node.ref, node);

  const parentsByChild = new Map<number, number[]>();
  const childrenByParent = new Map<number, number[]>();
  /** ref → (partner ref → whether that marriage has ended). */
  const partnerInfo = new Map<number, Map<number, boolean>>();
  for (const edge of tree.edges) {
    if (edge.kind === "parent") {
      push(parentsByChild, edge.toRef, edge.fromRef);
      push(childrenByParent, edge.fromRef, edge.toRef);
    } else {
      const dissolved = edge.dissolved === true;
      const a = partnerInfo.get(edge.fromRef) ?? new Map<number, boolean>();
      a.set(edge.toRef, dissolved);
      partnerInfo.set(edge.fromRef, a);
      const b = partnerInfo.get(edge.toRef) ?? new Map<number, boolean>();
      b.set(edge.fromRef, dissolved);
      partnerInfo.set(edge.toRef, b);
    }
  }

  const genderOf = (ref: number): Gender => {
    const node = nodeByRef.get(ref);
    if (node && node.visible !== false && node.gender) return node.gender;
    return "unknown";
  };

  const toPerson = (ref: number): ChartPerson => {
    const node = nodeByRef.get(ref);
    const isRoot = ref === tree.rootRef;
    if (!node || node.visible === false) {
      return {
        ref,
        personId: null,
        name: "",
        years: null,
        memorialSlug: null,
        gender: "unknown",
        isRoot,
        withheld: true,
      };
    }
    const years = [node.birthYear, node.deathYear]
      .filter((year) => year !== null)
      .join("–");
    return {
      ref,
      personId: node.personId,
      name: node.name,
      years: years.length > 0 ? years : null,
      memorialSlug: node.memorialSlug,
      gender: genderOf(ref),
      isRoot,
      withheld: false,
    };
  };

  // Walk up from the root to the top of its line — the anchor to draw from.
  // At a fork, follow the parent with deeper ancestry, then the father.
  const chooseParent = (ref: number): number | null => {
    const parents = parentsByChild.get(ref) ?? [];
    if (parents.length === 0) return null;
    return [...parents].sort((a, b) => {
      const da = (parentsByChild.get(a)?.length ?? 0) > 0 ? 0 : 1;
      const db = (parentsByChild.get(b)?.length ?? 0) > 0 ? 0 : 1;
      if (da !== db) return da - db;
      const ga = genderOf(a) === "male" ? 0 : 1;
      const gb = genderOf(b) === "male" ? 0 : 1;
      return ga - gb || a - b;
    })[0] as number;
  };

  let top = tree.rootRef;
  const climbed = new Set<number>([top]);
  for (;;) {
    const next = chooseParent(top);
    if (next === null || climbed.has(next)) break;
    climbed.add(next);
    top = next;
  }

  const visited = new Set<number>();

  const unionOrder = (a: ChartUnion, b: ChartUnion): number =>
    a.anchor.ref - b.anchor.ref;

  const marriagesOf = (anchorRef: number): ChartMarriage[] => {
    const kids = childrenByParent.get(anchorRef) ?? [];
    const byCoParent = new Map<number | null, number[]>();
    for (const child of kids) {
      const others = (parentsByChild.get(child) ?? []).filter(
        (p) => p !== anchorRef,
      );
      push(byCoParent, others.length > 0 ? (others[0] as number) : null, child);
    }

    const partners = partnerInfo.get(anchorRef) ?? new Map<number, boolean>();
    const nonEnded = [...partners.entries()]
      .filter(([, dissolved]) => !dissolved)
      .map(([ref]) => ref);

    // Children with no stated other-parent join the anchor's current marriage.
    const orphanKids = byCoParent.get(null) ?? [];
    const primary = orphanKids.length > 0 ? nonEnded[0] ?? null : null;

    const spouseRefs = new Set<number>();
    for (const co of byCoParent.keys()) if (co !== null) spouseRefs.add(co);
    for (const partner of partners.keys()) spouseRefs.add(partner);
    if (primary !== null) spouseRefs.add(primary);

    const asChildren = (refs: number[]): ChartUnion[] =>
      refs
        .filter((ref) => !visited.has(ref))
        .map(buildUnion)
        .sort(unionOrder);

    const marriages: ChartMarriage[] = [];
    for (const spouseRef of spouseRefs) {
      const own = [...(byCoParent.get(spouseRef) ?? [])];
      if (spouseRef === primary) own.push(...orphanKids);
      marriages.push({
        spouse: toPerson(spouseRef),
        dissolved: partners.get(spouseRef) ?? false,
        children: asChildren(own),
      });
    }
    if (primary === null && orphanKids.length > 0) {
      marriages.push({
        spouse: null,
        dissolved: false,
        children: asChildren(orphanKids),
      });
    }

    // Current marriages first, then ended ones.
    marriages.sort(
      (a, b) =>
        (a.dissolved ? 1 : 0) - (b.dissolved ? 1 : 0) ||
        (a.spouse?.ref ?? 0) - (b.spouse?.ref ?? 0),
    );
    return marriages;
  };

  function buildUnion(anchorRef: number): ChartUnion {
    visited.add(anchorRef);
    return {
      key: `u${anchorRef}`,
      anchor: toPerson(anchorRef),
      marriages: marriagesOf(anchorRef),
    };
  }

  return [buildUnion(top)];
}
