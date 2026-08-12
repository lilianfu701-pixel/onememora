import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { deceasedPeople, familyLinks, familyPeople, memorials } from "@/db/schema";

/**
 * Derived kinship: what someone in the graph *is* to the person a page is
 * about, worked out from parent and partner edges rather than stored.
 *
 * The classification (how many generations up to a common ancestor, how many
 * back down, whether a marriage is crossed) is exact and needs nothing but the
 * edges. The Chinese term that classification earns — 伯 vs 叔, 祖父 vs 外祖父,
 * 堂 vs 表 — additionally needs gender, paternal/maternal side and birth order.
 * Those are optional in the data, so the descriptor carries what is known and
 * leaves the rest `"unknown"`; naming falls back to a term that is coarser but
 * never wrong. See {@link ./kinship-terms}.
 */

export type Gender = "male" | "female" | "unknown";
export type Side = "paternal" | "maternal" | "unknown";
export type Seniority = "older" | "younger" | "unknown";

export type Kinship =
  | { kind: "self" }
  /** A blood relative: `up` generations to the common ancestor, `down` back. */
  | {
      kind: "blood";
      up: number;
      down: number;
      gender: Gender;
      side: Side;
      seniority: Seniority;
    }
  /** The person's own husband or wife. */
  | { kind: "spouse"; gender: Gender }
  /** A blood relative's spouse (`via: "married_in"`) or a spouse's blood
   *  relative (`via: "of_spouse"`). `base` is the underlying blood tie. */
  | {
      kind: "affinal";
      via: "married_in" | "of_spouse";
      base: { up: number; down: number; gender: Gender; side: Side; seniority: Seniority };
      gender: Gender;
    }
  /** Reachable in the family but past the bound where a term stays meaningful. */
  | { kind: "distant" };

/** Generations up/down past which a single kinship term stops being useful. */
const MAX_GEN = 4;

type NodeMeta = { id: string; gender: Gender; birthYear: number | null };

export type Graph = {
  meta: Map<string, NodeMeta>;
  /** child id → parent ids. */
  parents: Map<string, string[]>;
  /** person id → partner ids (current partners only). */
  partners: Map<string, string[]>;
};

function pushInto(map: Map<string, string[]>, key: string, value: string): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

function normalizeGender(raw: string | null): Gender {
  if (raw === "male" || raw === "female") return raw;
  return "unknown";
}

function yearOf(dateString: string | null): number | null {
  if (!dateString) return null;
  const year = Number.parseInt(dateString.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

/**
 * Loads every confirmed edge and each node's gender and birth year. The graph
 * is small — one extended family — so it is read whole rather than crawled.
 */
async function loadGraph(): Promise<Graph> {
  const people = await db()
    .select({
      id: familyPeople.id,
      placeholderBirthYear: familyPeople.birthYear,
      gender: deceasedPeople.gender,
      birthDate: deceasedPeople.birthDate,
    })
    .from(familyPeople)
    .leftJoin(
      deceasedPeople,
      eq(deceasedPeople.id, familyPeople.deceasedPersonId),
    );

  const meta = new Map<string, NodeMeta>();
  for (const person of people) {
    meta.set(person.id, {
      id: person.id,
      gender: normalizeGender(person.gender),
      birthYear: person.placeholderBirthYear ?? yearOf(person.birthDate),
    });
  }

  const edges = await db()
    .select({
      kind: familyLinks.kind,
      personAId: familyLinks.personAId,
      personBId: familyLinks.personBId,
      dissolvedAt: familyLinks.dissolvedAt,
    })
    .from(familyLinks)
    .where(eq(familyLinks.status, "confirmed"));

  const parents = new Map<string, string[]>();
  const partners = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.kind === "parent") {
      // personA is the parent, personB the child.
      pushInto(parents, edge.personBId, edge.personAId);
    } else if (!edge.dissolvedAt) {
      // Ended partnerships are not walked: an ex-spouse's family is not kin.
      pushInto(partners, edge.personAId, edge.personBId);
      pushInto(partners, edge.personBId, edge.personAId);
    }
  }

  return { meta, parents, partners };
}

type Ancestor = {
  depth: number;
  /** The root's own parent on the path to this ancestor (undefined at depth 0). */
  firstParent: string | undefined;
  /** This ancestor's child on the path back down to the root. */
  via: string | undefined;
};

/**
 * Every ancestor of `start` (including `start` at depth 0), each tagged with
 * how it was reached: the root's parent that begins the path, and the node one
 * step back down. Both are what the naming rules read to tell a paternal term
 * from a maternal one.
 */
function ancestryOf(start: string, graph: Graph): Map<string, Ancestor> {
  const found = new Map<string, Ancestor>([
    [start, { depth: 0, firstParent: undefined, via: undefined }],
  ]);
  let frontier: string[] = [start];

  for (let depth = 0; depth < MAX_GEN && frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (const nodeId of frontier) {
      const here = found.get(nodeId);
      if (!here) continue;
      for (const parentId of graph.parents.get(nodeId) ?? []) {
        if (found.has(parentId)) continue;
        found.set(parentId, {
          depth: depth + 1,
          firstParent: depth === 0 ? parentId : here.firstParent,
          via: nodeId,
        });
        next.push(parentId);
      }
    }
    frontier = next;
  }

  return found;
}

function genderOf(id: string | undefined, graph: Graph): Gender {
  if (!id) return "unknown";
  return graph.meta.get(id)?.gender ?? "unknown";
}

/** Seniority of `a` relative to `b` by birth year, when both are known. */
function seniorityByYear(
  a: string | undefined,
  b: string | undefined,
  graph: Graph,
): Seniority {
  const ya = a ? graph.meta.get(a)?.birthYear ?? null : null;
  const yb = b ? graph.meta.get(b)?.birthYear ?? null : null;
  if (ya === null || yb === null) return "unknown";
  if (ya < yb) return "older";
  if (ya > yb) return "younger";
  return "unknown";
}

/** Nearest common ancestor of two people, with the up/down distances to it. */
function meet(
  rootId: string,
  targetId: string,
  graph: Graph,
): { commonId: string; up: number; down: number; rootAnc: Map<string, Ancestor>; targetAnc: Map<string, Ancestor> } | null {
  const rootAnc = ancestryOf(rootId, graph);
  const targetAnc = ancestryOf(targetId, graph);

  let best: { commonId: string; up: number; down: number } | null = null;
  for (const [id, ra] of rootAnc) {
    const ta = targetAnc.get(id);
    if (!ta) continue;
    if (!best || ra.depth + ta.depth < best.up + best.down) {
      best = { commonId: id, up: ra.depth, down: ta.depth };
    }
  }

  if (!best) return null;
  return { ...best, rootAnc, targetAnc };
}

/** The blood relationship from `rootId` to `targetId`, if there is one. */
function bloodTie(
  rootId: string,
  targetId: string,
  graph: Graph,
): { up: number; down: number; gender: Gender; side: Side; seniority: Seniority } | null {
  const m = meet(rootId, targetId, graph);
  if (!m) return null;

  const { up, down, rootAnc, targetAnc, commonId } = m;
  const gender = genderOf(targetId, graph);

  // Which of the root's parents the path climbs through decides paternal vs
  // maternal for anything above the root; for descendants it is the root's
  // child that the line runs down through.
  let side: Side = "unknown";
  if (up >= 1) {
    side = genderToSide(genderOf(rootAnc.get(commonId)?.firstParent, graph));
  } else if (down >= 1) {
    // commonId is the root; its child toward the target sets the side.
    side = genderToSide(genderOf(targetAnc.get(commonId)?.via, graph));
  }

  // Elder/younger only carries meaning for a few terms. Same-generation kin
  // (siblings, cousins) rank by their own birth years; a parent's sibling
  // (伯 vs 叔) ranks against the root's parent instead.
  let seniority: Seniority = "unknown";
  if (up === down) {
    seniority = seniorityByYear(targetId, rootId, graph);
  } else if (up === 2 && down === 1) {
    seniority = seniorityByYear(targetId, rootAnc.get(commonId)?.firstParent, graph);
  }

  return { up, down, gender, side, seniority };
}

function genderToSide(gender: Gender): Side {
  if (gender === "male") return "paternal";
  if (gender === "female") return "maternal";
  return "unknown";
}

function withinBound(up: number, down: number): boolean {
  return up <= MAX_GEN && down <= MAX_GEN && up + down <= MAX_GEN + 1;
}

/**
 * Classifies `targetId` relative to `rootId`: blood tie first, then the person's
 * own spouse, then one marriage hop either way (a relative's spouse, or a
 * spouse's relative). Anything further is left `distant`.
 */
function classify(rootId: string, targetId: string, graph: Graph): Kinship {
  if (rootId === targetId) return { kind: "self" };

  const blood = bloodTie(rootId, targetId, graph);
  if (blood && withinBound(blood.up, blood.down)) {
    return { kind: "blood", ...blood };
  }

  // The person's own partner.
  if ((graph.partners.get(rootId) ?? []).includes(targetId)) {
    return { kind: "spouse", gender: genderOf(targetId, graph) };
  }

  // A blood relative's spouse: target is married to someone the root has a
  // blood tie to (son's wife, brother's wife, …).
  for (const relativeId of graph.partners.get(targetId) ?? []) {
    const base = bloodTie(rootId, relativeId, graph);
    if (base && withinBound(base.up, base.down)) {
      return { kind: "affinal", via: "married_in", base, gender: genderOf(targetId, graph) };
    }
  }

  // A spouse's blood relative: target is blood kin of the root's partner
  // (parents-in-law, brother-in-law, …).
  for (const spouseId of graph.partners.get(rootId) ?? []) {
    const base = bloodTie(spouseId, targetId, graph);
    if (base && withinBound(base.up, base.down)) {
      return { kind: "affinal", via: "of_spouse", base, gender: genderOf(targetId, graph) };
    }
  }

  return { kind: "distant" };
}

/** Classifies `targetId` relative to `rootId` over a prepared graph. */
export function classifyKinship(
  rootId: string,
  targetId: string,
  graph: Graph,
): Kinship {
  return classify(rootId, targetId, graph);
}

/**
 * Builds a graph from plain edge lists, for callers that already hold the data
 * (chiefly tests). Production reads it from the database in {@link loadGraph}.
 */
export function buildGraph(input: {
  nodes: { id: string; gender?: Gender; birthYear?: number | null }[];
  parentEdges: { parentId: string; childId: string }[];
  partnerEdges: { aId: string; bId: string }[];
}): Graph {
  const meta = new Map<string, NodeMeta>();
  for (const node of input.nodes) {
    meta.set(node.id, {
      id: node.id,
      gender: node.gender ?? "unknown",
      birthYear: node.birthYear ?? null,
    });
  }

  const parents = new Map<string, string[]>();
  for (const edge of input.parentEdges) {
    pushInto(parents, edge.childId, edge.parentId);
  }

  const partners = new Map<string, string[]>();
  for (const edge of input.partnerEdges) {
    pushInto(partners, edge.aId, edge.bId);
    pushInto(partners, edge.bId, edge.aId);
  }

  return { meta, parents, partners };
}

/**
 * The kinship of every graph member to the person behind `memorialId`, keyed by
 * `familyPeople.id`. Returns an empty map when the memorial has no node yet —
 * the ordinary case for a memorial nobody has linked.
 */
export async function kinshipFromMemorial(
  memorialId: string,
): Promise<Map<string, Kinship>> {
  const [memorial] = await db()
    .select({ deceasedPersonId: memorials.deceasedPersonId })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!memorial) return new Map();

  const [rootPerson] = await db()
    .select({ id: familyPeople.id })
    .from(familyPeople)
    .where(eq(familyPeople.deceasedPersonId, memorial.deceasedPersonId));
  if (!rootPerson) return new Map();

  const graph = await loadGraph();
  const result = new Map<string, Kinship>();
  for (const id of graph.meta.keys()) {
    result.set(id, classify(rootPerson.id, id, graph));
  }
  return result;
}
