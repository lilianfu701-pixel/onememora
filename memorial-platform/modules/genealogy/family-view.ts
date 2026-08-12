import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { deceasedPeople, familyPeople, memorials, memorialNames } from "@/db/schema";
import type { Tree, TreeEdge, TreeNode } from "./tree";
import type { Gender, Kinship } from "./kinship";
import { buildGraph, classifyKinship } from "./kinship";
import { immediateLinks } from "./links";

/**
 * The family tree a memorial shows, assembled at read time from two sources
 * without writing anything back:
 *
 *  - the deceased's own registered relatives (`memorial_relatives`), whose
 *    types already carry gender and seniority — a "father" is male, an
 *    "older_brother" is male and older — so the tree needs no separate guess;
 *  - the confirmed links to other memorials, which contribute a clickable node
 *    and, where a relative names the same person, are merged onto it.
 *
 * Nothing is persisted: editing the relatives list rebuilds the tree next load,
 * so the two never drift. Kinship terms are then derived over the whole thing
 * by {@link classifyKinship}, which is why a grandparent listed without the
 * connecting parent still gets a `withheld` anchor between it and the root —
 * that anchor is what makes "祖父" come out paternal rather than unplaced.
 */

const ROOT_ID = "root";

export type RelativeRow = {
  id: string;
  name: string;
  relationshipToDeceased: string;
  isDeceased: boolean;
  showFullName: boolean;
};

export type LinkedMemorial = {
  personId: string;
  name: string;
  slug: string;
  role: "parent" | "child" | "partner";
  gender: Gender;
  birthYear: number | null;
  deathYear: number | null;
  lifeStatus: "living" | "deceased" | "unknown";
};

export type RootInfo = {
  name: string;
  birthYear: number | null;
  deathYear: number | null;
};

type DisplayNode = {
  id: string;
  name: string;
  slug: string | null;
  birthYear: number | null;
  deathYear: number | null;
  lifeStatus: "living" | "deceased" | "unknown";
};

const MALE = new Set([
  "father",
  "husband",
  "ex_husband",
  "son",
  "older_brother",
  "younger_brother",
  "paternal_grandfather",
  "maternal_grandfather",
]);
const FEMALE = new Set([
  "mother",
  "wife",
  "ex_wife",
  "daughter",
  "older_sister",
  "younger_sister",
  "paternal_grandmother",
  "maternal_grandmother",
]);

function genderOfType(type: string): Gender {
  if (MALE.has(type)) return "male";
  if (FEMALE.has(type)) return "female";
  return "unknown";
}

function birthYearForSeniority(type: string): number | null {
  // Relatives carry no birth year, but "older"/"younger" is enough for the
  // sibling terms — encode it as a sentinel year on either side of the root's.
  if (type === "older_brother" || type === "older_sister") return 1;
  if (type === "younger_brother" || type === "younger_sister") return 3;
  return null;
}

function desensitize(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  const chars = [...trimmed];
  if (chars.length === 2) return `${chars[0]}*`;
  return `${chars[0]}${"*".repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

const PARENT_TYPES = new Set(["father", "mother", "parent"]);
const CHILD_TYPES = new Set(["son", "daughter", "child"]);
const PARTNER_TYPES = new Set(["husband", "wife", "spouse"]);
const SIBLING_TYPES = new Set([
  "older_brother",
  "younger_brother",
  "older_sister",
  "younger_sister",
  "sibling",
]);
const PATERNAL_GP = new Set(["paternal_grandfather", "paternal_grandmother"]);
const MATERNAL_GP = new Set(["maternal_grandfather", "maternal_grandmother"]);
const roleTypes: Record<LinkedMemorial["role"], Set<string>> = {
  parent: PARENT_TYPES,
  child: CHILD_TYPES,
  partner: PARTNER_TYPES,
};

/**
 * Assembles the tree and the kinship of each node to the root. Pure: every
 * input is passed in, so the shape can be exercised without a database.
 * Returns `null` when there is nobody but the root to draw.
 */
export function assembleFamilyView(input: {
  root: RootInfo;
  relatives: RelativeRow[];
  linked: LinkedMemorial[];
  seniorityRoot?: number;
}): { tree: Tree; kinship: Map<string, Kinship> } | null {
  const graphNodes: { id: string; gender: Gender; birthYear: number | null }[] = [
    { id: ROOT_ID, gender: "unknown", birthYear: input.seniorityRoot ?? 2 },
  ];
  const parentEdges: { parentId: string; childId: string }[] = [];
  const partnerEdges: { aId: string; bId: string }[] = [];
  const display = new Map<string, DisplayNode>([
    [
      ROOT_ID,
      {
        id: ROOT_ID,
        name: input.root.name,
        slug: null,
        birthYear: input.root.birthYear,
        deathYear: input.root.deathYear,
        lifeStatus: "deceased",
      },
    ],
  ]);
  const withheld = new Set<string>();
  /** Raw name → node id, so a linked memorial can find the relative it names. */
  const byRawName = new Map<string, string>();

  let fatherId: string | null = null;
  let motherId: string | null = null;
  let anchorSeq = 0;

  function addGraphNode(id: string, gender: Gender, birthYear: number | null): void {
    graphNodes.push({ id, gender, birthYear });
  }

  function addDisplay(id: string, node: DisplayNode): void {
    display.set(id, node);
  }

  function anchor(gender: Gender): string {
    const id = `anchor:${(anchorSeq += 1)}`;
    addGraphNode(id, gender, null);
    withheld.add(id);
    parentEdges.push({ parentId: id, childId: ROOT_ID });
    return id;
  }

  function fatherAnchor(): string {
    if (fatherId) return fatherId;
    fatherId = anchor("male");
    return fatherId;
  }
  function motherAnchor(): string {
    if (motherId) return motherId;
    motherId = anchor("female");
    return motherId;
  }

  // Parents first, so siblings and grandparents attach to a named parent
  // rather than minting an anchor that duplicates one listed later.
  const ordered = [...input.relatives].sort((a, b) => {
    const ap = PARENT_TYPES.has(a.relationshipToDeceased) ? 0 : 1;
    const bp = PARENT_TYPES.has(b.relationshipToDeceased) ? 0 : 1;
    return ap - bp;
  });

  for (const rel of ordered) {
    const type = rel.relationshipToDeceased;
    if (type === "ex_husband" || type === "ex_wife") continue; // out of scope for V1
    const id = `rel:${rel.id}`;
    const gender = genderOfType(type);
    const name = rel.showFullName ? rel.name : desensitize(rel.name);
    const lifeStatus = rel.isDeceased ? "deceased" : "living";

    if (PARENT_TYPES.has(type)) {
      addGraphNode(id, gender, null);
      parentEdges.push({ parentId: id, childId: ROOT_ID });
      if (type === "father") fatherId = id;
      else if (type === "mother") motherId = id;
    } else if (CHILD_TYPES.has(type)) {
      addGraphNode(id, gender, null);
      parentEdges.push({ parentId: ROOT_ID, childId: id });
    } else if (PARTNER_TYPES.has(type)) {
      addGraphNode(id, gender, null);
      partnerEdges.push({ aId: ROOT_ID, bId: id });
    } else if (SIBLING_TYPES.has(type)) {
      addGraphNode(id, gender, birthYearForSeniority(type));
      parentEdges.push({ parentId: fatherAnchor(), childId: id });
    } else if (PATERNAL_GP.has(type)) {
      addGraphNode(id, gender, null);
      parentEdges.push({ parentId: id, childId: fatherAnchor() });
    } else if (MATERNAL_GP.has(type)) {
      addGraphNode(id, gender, null);
      parentEdges.push({ parentId: id, childId: motherAnchor() });
    } else {
      continue; // unknown relationship string — leave it out rather than guess
    }

    addDisplay(id, { id, name, slug: null, birthYear: null, deathYear: null, lifeStatus });
    byRawName.set(rel.name.trim(), id);
  }

  // Fold confirmed memorial links in: merge onto the relative that names the
  // same person (giving it a clickable slug and real dates), else add fresh.
  for (const link of input.linked) {
    const existingId = byRawName.get(link.name.trim());
    if (existingId && roleTypes[link.role].has(displayType(existingId, ordered))) {
      const node = display.get(existingId);
      if (node) {
        node.slug = link.slug;
        node.birthYear = link.birthYear;
        node.deathYear = link.deathYear;
        node.lifeStatus = link.lifeStatus;
      }
      const gnode = graphNodes.find((g) => g.id === existingId);
      if (gnode && gnode.gender === "unknown") gnode.gender = link.gender;
      continue;
    }

    const id = `mem:${link.personId}`;
    addGraphNode(id, link.gender, link.birthYear);
    if (link.role === "parent") parentEdges.push({ parentId: id, childId: ROOT_ID });
    else if (link.role === "child") parentEdges.push({ parentId: ROOT_ID, childId: id });
    else partnerEdges.push({ aId: ROOT_ID, bId: id });
    addDisplay(id, {
      id,
      name: link.name,
      slug: link.slug,
      birthYear: link.birthYear,
      deathYear: link.deathYear,
      lifeStatus: link.lifeStatus,
    });
  }

  if (display.size <= 1) return null;

  // Numeric refs in insertion order; the root's ref anchors the layout.
  const refOf = new Map<string, number>();
  graphNodes.forEach((node, index) => refOf.set(node.id, index));

  const nodes: TreeNode[] = graphNodes.map((node) => {
    const ref = refOf.get(node.id) ?? 0;
    if (withheld.has(node.id)) return { visible: false, ref };
    const d = display.get(node.id);
    return {
      visible: true,
      ref,
      personId: node.id,
      name: d?.name ?? "",
      lifeStatus: d?.lifeStatus ?? "unknown",
      birthYear: d?.birthYear ?? null,
      deathYear: d?.deathYear ?? null,
      memorialSlug: d?.slug ?? null,
    };
  });

  const edges: TreeEdge[] = [
    ...parentEdges.map((edge) => ({
      kind: "parent" as const,
      fromRef: refOf.get(edge.parentId) ?? 0,
      toRef: refOf.get(edge.childId) ?? 0,
    })),
    ...partnerEdges.map((edge) => ({
      kind: "partner" as const,
      fromRef: refOf.get(edge.aId) ?? 0,
      toRef: refOf.get(edge.bId) ?? 0,
    })),
  ];

  const graph = buildGraph({ nodes: graphNodes, parentEdges, partnerEdges });
  const kinship = new Map<string, Kinship>();
  for (const node of graphNodes) {
    if (withheld.has(node.id) || node.id === ROOT_ID) continue;
    kinship.set(node.id, classifyKinship(ROOT_ID, node.id, graph));
  }

  return { tree: { rootRef: refOf.get(ROOT_ID) ?? 0, nodes, edges }, kinship };
}

/** The relationship string a relative node was built from, for role matching. */
function displayType(nodeId: string, relatives: RelativeRow[]): string {
  const relId = nodeId.startsWith("rel:") ? nodeId.slice(4) : null;
  return relatives.find((r) => r.id === relId)?.relationshipToDeceased ?? "";
}

/**
 * Loads the confirmed memorial links of the person behind `memorialId`,
 * resolved to name, slug, gender and years for the tree.
 */
async function linkedMemorialsOf(memorialId: string): Promise<LinkedMemorial[]> {
  const [memorial] = await db()
    .select({ deceasedPersonId: memorials.deceasedPersonId })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!memorial) return [];

  const [person] = await db()
    .select({ id: familyPeople.id })
    .from(familyPeople)
    .where(eq(familyPeople.deceasedPersonId, memorial.deceasedPersonId));
  if (!person) return [];

  const links = await immediateLinks(person.id);
  const result: LinkedMemorial[] = [];
  for (const link of links) {
    const [row] = await db()
      .select({
        slug: memorials.slug,
        name: memorialNames.value,
        gender: deceasedPeople.gender,
        birthDate: deceasedPeople.birthDate,
        deathDate: deceasedPeople.deathDate,
      })
      .from(familyPeople)
      .innerJoin(deceasedPeople, eq(deceasedPeople.id, familyPeople.deceasedPersonId))
      .innerJoin(memorials, eq(memorials.deceasedPersonId, deceasedPeople.id))
      .leftJoin(
        memorialNames,
        and(
          eq(memorialNames.memorialId, memorials.id),
          eq(memorialNames.type, "primary"),
        ),
      )
      .where(eq(familyPeople.id, link.otherPersonId));
    if (!row || !row.name) continue;
    result.push({
      personId: link.otherPersonId,
      name: row.name,
      slug: row.slug,
      role: link.role,
      gender: row.gender === "male" || row.gender === "female" ? row.gender : "unknown",
      birthYear: yearOf(row.birthDate),
      deathYear: yearOf(row.deathDate),
      lifeStatus: row.deathDate ? "deceased" : "unknown",
    });
  }
  return result;
}

function yearOf(dateString: string | null): number | null {
  if (!dateString) return null;
  const year = Number.parseInt(dateString.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

/** Reads the data the assembler needs, then builds the view for a memorial. */
export async function familyViewForMemorial(
  memorialId: string,
  root: RootInfo,
  relatives: RelativeRow[],
): Promise<{ tree: Tree; kinship: Map<string, Kinship> } | null> {
  const linked = await linkedMemorialsOf(memorialId);
  return assembleFamilyView({ root, relatives, linked });
}
