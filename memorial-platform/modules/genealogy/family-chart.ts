import type { Tree, TreeNode } from "./tree";
import type { Gender, Kinship } from "./kinship";

/**
 * Turns the flat family graph into the nested shape a genealogical chart is
 * actually drawn from: a forest of {@link ChartUnion}s.
 *
 * A *union* is a couple (or a single parent) plus the children that descend
 * from them — the unit that makes a family chart read as families rather than a
 * pile of people in rows. Two people are one union when they are partners or
 * share a child (co-parents), so a "father" and a "mother" listed separately
 * still resolve to one couple with a marriage line, and their children hang off
 * that couple by a single descent line. Married-in spouses attach to their
 * partner's union instead of starting a lineage of their own.
 *
 * Conventions follow standard genealogical drawing: parents above children,
 * each generation on a row, siblings joined under their own parents, a marriage
 * line between partners, a descent line to the children. See the component that
 * renders this for the lines themselves.
 */

export type ChartPerson = {
  ref: number;
  personId: string | null;
  name: string;
  years: string | null;
  memorialSlug: string | null;
  gender: Gender;
  isRoot: boolean;
  /** A partner who married in, drawn distinctly from blood kin. */
  marriedIn: boolean;
  /** Someone whose identity is withheld — an unshown connecting generation. */
  withheld: boolean;
};

export type ChartUnion = {
  key: string;
  partners: ChartPerson[];
  children: ChartUnion[];
};

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

export function buildFamilyChart(
  tree: Tree,
  kinship: Map<string, Kinship>,
): ChartUnion[] {
  const nodeByRef = new Map<number, TreeNode>();
  for (const node of tree.nodes) nodeByRef.set(node.ref, node);

  const parentsByChild = new Map<number, number[]>();
  const childrenByParent = new Map<number, number[]>();
  for (const edge of tree.edges) {
    if (edge.kind === "parent") {
      push(parentsByChild, edge.toRef, edge.fromRef);
      push(childrenByParent, edge.fromRef, edge.toRef);
    }
  }

  // Union-find joins partners and co-parents into one couple.
  const rep = new Map<number, number>();
  for (const node of tree.nodes) rep.set(node.ref, node.ref);
  const find = (x: number): number => {
    let root = x;
    while (rep.get(root) !== root) root = rep.get(root) ?? root;
    let cur = x;
    while (rep.get(cur) !== root) {
      const next = rep.get(cur) ?? root;
      rep.set(cur, root);
      cur = next;
    }
    return root;
  };
  const join = (a: number, b: number): void => {
    rep.set(find(a), find(b));
  };
  for (const edge of tree.edges) {
    if (edge.kind === "partner") join(edge.fromRef, edge.toRef);
  }
  for (const parents of parentsByChild.values()) {
    for (let i = 1; i < parents.length; i += 1) {
      join(parents[0] as number, parents[i] as number);
    }
  }

  const members = new Map<number, number[]>();
  for (const node of tree.nodes) push(members, find(node.ref), node.ref);

  const hasParent = (ref: number): boolean =>
    (parentsByChild.get(ref)?.length ?? 0) > 0;

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
        marriedIn: false,
        withheld: true,
      };
    }
    const kin = kinship.get(node.personId);
    const years = [node.birthYear, node.deathYear]
      .filter((year) => year !== null)
      .join("–");
    return {
      ref,
      personId: node.personId,
      name: node.name,
      years: years.length > 0 ? years : null,
      memorialSlug: node.memorialSlug,
      gender: kin && "gender" in kin ? kin.gender : "unknown",
      isRoot,
      marriedIn: kin?.kind === "spouse" || kin?.kind === "affinal",
      withheld: false,
    };
  };

  // Blood/lineage member first, then male before female, then by ref, so a
  // couple reads consistently and the descent drops from between them.
  const orderPartners = (a: ChartPerson, b: ChartPerson): number => {
    if (a.marriedIn !== b.marriedIn) return a.marriedIn ? 1 : -1;
    const rank = (g: Gender) => (g === "male" ? 0 : g === "female" ? 1 : 2);
    return rank(a.gender) - rank(b.gender) || a.ref - b.ref;
  };

  const childRepsOf = (unionRep: number): number[] => {
    const seen = new Set<number>();
    for (const member of members.get(unionRep) ?? []) {
      for (const child of childrenByParent.get(member) ?? []) {
        seen.add(find(child));
      }
    }
    return [...seen];
  };

  const visited = new Set<number>();
  const build = (unionRep: number): ChartUnion | null => {
    if (visited.has(unionRep)) return null;
    visited.add(unionRep);
    const partners = (members.get(unionRep) ?? [])
      .map(toPerson)
      .sort(orderPartners);
    const children = childRepsOf(unionRep)
      .map(build)
      .filter((u): u is ChartUnion => u !== null)
      .sort(unionOrder);
    return { key: `u${unionRep}`, partners, children };
  };

  const topReps = [...members.keys()].filter((unionRep) =>
    (members.get(unionRep) ?? []).every((member) => !hasParent(member)),
  );

  return topReps
    .map(build)
    .filter((u): u is ChartUnion => u !== null)
    .sort(unionOrder);
}

/** Older families and members first; a stable, birth-order-ish ordering. */
function unionOrder(a: ChartUnion, b: ChartUnion): number {
  const key = (u: ChartUnion): number =>
    Math.min(...u.partners.map((p) => p.ref));
  return key(a) - key(b);
}
