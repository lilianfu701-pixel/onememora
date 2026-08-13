import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  deceasedPeople,
  familyPeople,
  memorials,
  memorialNames,
  memorialRelatives,
} from "@/db/schema";
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
  /** Which spouse-relative this child was born to, if the family said so. */
  coParentId?: string | null;
  /** For a collateral spouse, the relative they married into the family. */
  spouseOfId?: string | null;
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
  /** That memorial's own relatives, pulled in for the full family view. */
  relatives?: RelativeRow[];
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
  "paternal_grandson",
  "maternal_grandson",
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
  "paternal_granddaughter",
  "maternal_granddaughter",
]);
/** Two generations down: a grandchild, placed under one of the children. */
const GRANDCHILD_TYPES = new Set([
  "paternal_grandson",
  "paternal_granddaughter",
  "maternal_grandson",
  "maternal_granddaughter",
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
const EX_PARTNER_TYPES = new Set(["ex_husband", "ex_wife"]);
/** A relative who married a collateral relative (a sibling's or child's spouse). */
const RELATIVE_SPOUSE = "relative_spouse";

function oppositeGender(gender: Gender | undefined): Gender {
  if (gender === "male") return "female";
  if (gender === "female") return "male";
  return "unknown";
}
const SIBLING_TYPES = new Set([
  "older_brother",
  "younger_brother",
  "older_sister",
  "younger_sister",
  "sibling",
]);
const PATERNAL_GP = new Set(["paternal_grandfather", "paternal_grandmother"]);
const MATERNAL_GP = new Set(["maternal_grandfather", "maternal_grandmother"]);

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
  const partnerEdges: { aId: string; bId: string; dissolved: boolean }[] = [];
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
  const byRawName = new Map<string, string>([[input.root.name.trim(), ROOT_ID]]);
  /** Every edge already added, so pulling a linked family in never doubles one. */
  const edgeKeys = new Set<string>();
  /** A relative's own id → the node it resolved to (deduped by name). */
  const relIdToNode = new Map<string, string>();

  let anchorSeq = 0;

  function addParentEdge(parentId: string, childId: string): void {
    if (parentId === childId) return;
    const key = `p:${parentId}>${childId}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    parentEdges.push({ parentId, childId });
  }

  function addPartnerEdge(aId: string, bId: string, dissolved: boolean): void {
    if (aId === bId) return;
    const [x, y] = aId < bId ? [aId, bId] : [bId, aId];
    const key = `m:${x}-${y}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    partnerEdges.push({ aId, bId, dissolved });
  }

  /** Reuses a node with the same name if there is one; otherwise makes it. */
  function resolveNode(
    rawName: string,
    freshId: string,
    gender: Gender,
    birthYear: number | null,
    lifeStatus: DisplayNode["lifeStatus"],
    displayName: string,
  ): string {
    const key = rawName.trim();
    const existing = byRawName.get(key);
    if (existing) {
      const node = graphNodes.find((g) => g.id === existing);
      if (node && node.gender === "unknown" && gender !== "unknown") {
        node.gender = gender;
      }
      return existing;
    }
    graphNodes.push({ id: freshId, gender, birthYear });
    display.set(freshId, {
      id: freshId,
      name: displayName,
      slug: null,
      birthYear: null,
      deathYear: null,
      lifeStatus,
    });
    byRawName.set(key, freshId);
    return freshId;
  }

  /**
   * Adds one person's relatives around `centerId` — the same star the root
   * gets, reused so a linked memorial contributes its parents (grandparents),
   * siblings (aunts and uncles) and children into one shared graph, merging by
   * name where the two families already name the same person.
   */
  function addStar(centerId: string, relatives: RelativeRow[]): void {
    let starFather: string | null = null;
    let starMother: string | null = null;
    const anchorNode = (gender: Gender): string => {
      const id = `anchor:${(anchorSeq += 1)}`;
      graphNodes.push({ id, gender, birthYear: null });
      withheld.add(id);
      addParentEdge(id, centerId);
      return id;
    };
    const starFatherAnchor = (): string => (starFather ??= anchorNode("male"));
    const starMotherAnchor = (): string => (starMother ??= anchorNode("female"));
    // A stand-in child, so a grandchild with no named parent still lands one
    // generation below the children rather than beside them.
    let starChild: string | null = null;
    const starChildAnchor = (): string => {
      if (starChild) return starChild;
      const id = `anchor:${(anchorSeq += 1)}`;
      graphNodes.push({ id, gender: "unknown", birthYear: null });
      withheld.add(id);
      addParentEdge(centerId, id);
      starChild = id;
      return id;
    };

    const ordered = [...relatives].sort((a, b) => {
      const ap = PARENT_TYPES.has(a.relationshipToDeceased) ? 0 : 1;
      const bp = PARENT_TYPES.has(b.relationshipToDeceased) ? 0 : 1;
      return ap - bp;
    });

    const coParents: { childNode: string; coParentRelId: string }[] = [];
    const spouses: { spouseNode: string; relativeRelId: string }[] = [];

    for (const rel of ordered) {
      const type = rel.relationshipToDeceased;
      const freshId = `rel:${rel.id}`;
      const gender = genderOfType(type);
      const displayName = rel.showFullName ? rel.name : desensitize(rel.name);
      const lifeStatus = rel.isDeceased ? "deceased" : "living";
      let nid: string;

      if (PARENT_TYPES.has(type)) {
        nid = resolveNode(rel.name, freshId, gender, null, lifeStatus, displayName);
        addParentEdge(nid, centerId);
        if (type === "father") starFather = nid;
        else if (type === "mother") starMother = nid;
      } else if (CHILD_TYPES.has(type)) {
        nid = resolveNode(rel.name, freshId, gender, null, lifeStatus, displayName);
        addParentEdge(centerId, nid);
        if (rel.coParentId) {
          coParents.push({ childNode: nid, coParentRelId: `rel:${rel.coParentId}` });
        }
      } else if (PARTNER_TYPES.has(type)) {
        nid = resolveNode(rel.name, freshId, gender, null, lifeStatus, displayName);
        addPartnerEdge(centerId, nid, false);
      } else if (EX_PARTNER_TYPES.has(type)) {
        nid = resolveNode(rel.name, freshId, gender, null, lifeStatus, displayName);
        addPartnerEdge(centerId, nid, true);
      } else if (SIBLING_TYPES.has(type)) {
        nid = resolveNode(
          rel.name,
          freshId,
          gender,
          birthYearForSeniority(type),
          lifeStatus,
          displayName,
        );
        addParentEdge(starFatherAnchor(), nid);
        if (starMother) addParentEdge(starMother, nid);
      } else if (PATERNAL_GP.has(type)) {
        nid = resolveNode(rel.name, freshId, gender, null, lifeStatus, displayName);
        addParentEdge(nid, starFatherAnchor());
      } else if (MATERNAL_GP.has(type)) {
        nid = resolveNode(rel.name, freshId, gender, null, lifeStatus, displayName);
        addParentEdge(nid, starMotherAnchor());
      } else if (GRANDCHILD_TYPES.has(type)) {
        // A grandchild hangs under the child named as its parent (`coParentId`),
        // or under a stand-in child when none was chosen.
        nid = resolveNode(rel.name, freshId, gender, null, lifeStatus, displayName);
        if (rel.coParentId) {
          coParents.push({ childNode: nid, coParentRelId: `rel:${rel.coParentId}` });
        } else {
          addParentEdge(starChildAnchor(), nid);
        }
      } else if (type === RELATIVE_SPOUSE && rel.spouseOfId) {
        nid = resolveNode(rel.name, freshId, "unknown", null, lifeStatus, displayName);
        spouses.push({ spouseNode: nid, relativeRelId: `rel:${rel.spouseOfId}` });
      } else {
        continue;
      }
      relIdToNode.set(freshId, nid);
    }

    for (const { childNode, coParentRelId } of coParents) {
      const co = relIdToNode.get(coParentRelId);
      if (co && display.has(co)) addParentEdge(co, childNode);
    }
    for (const { spouseNode, relativeRelId } of spouses) {
      const relNode = relIdToNode.get(relativeRelId);
      if (!relNode) continue;
      addPartnerEdge(relNode, spouseNode, false);
      const relG = graphNodes.find((g) => g.id === relNode);
      const spG = graphNodes.find((g) => g.id === spouseNode);
      if (spG) spG.gender = oppositeGender(relG?.gender);
    }
  }

  // The root's own family.
  addStar(ROOT_ID, input.relatives);

  // Fold confirmed memorial links in: merge onto the relative that names the
  // same person (giving it a clickable slug and real dates), else add fresh.
  // When the link carries the other memorial's relatives, add them too, so an
  // uncle or grandparent recorded on that memorial joins this tree.
  for (const link of input.linked) {
    const existingId = byRawName.get(link.name.trim());
    let memNode: string;
    if (existingId) {
      memNode = existingId;
      const node = display.get(existingId);
      if (node) {
        node.slug = link.slug;
        node.birthYear = link.birthYear;
        node.deathYear = link.deathYear;
        node.lifeStatus = link.lifeStatus;
      }
      const gnode = graphNodes.find((g) => g.id === existingId);
      if (gnode) {
        if (gnode.gender === "unknown") gnode.gender = link.gender;
        // Its real birth year settles seniority (伯 vs 叔) for that side.
        if (gnode.birthYear === null && link.birthYear !== null) {
          gnode.birthYear = link.birthYear;
        }
      }
    } else {
      memNode = `mem:${link.personId}`;
      graphNodes.push({ id: memNode, gender: link.gender, birthYear: link.birthYear });
      display.set(memNode, {
        id: memNode,
        name: link.name,
        slug: link.slug,
        birthYear: link.birthYear,
        deathYear: link.deathYear,
        lifeStatus: link.lifeStatus,
      });
      byRawName.set(link.name.trim(), memNode);
    }

    if (link.role === "parent") addParentEdge(memNode, ROOT_ID);
    else if (link.role === "child") addParentEdge(ROOT_ID, memNode);
    else addPartnerEdge(ROOT_ID, memNode, false);

    if (link.relatives && link.relatives.length > 0) {
      addStar(memNode, link.relatives);
    }
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
      gender: node.gender,
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
      ...(edge.dissolved ? { dissolved: true } : {}),
    })),
  ];

  // Kinship ignores ended marriages — an ex-spouse's family is not kin.
  const graph = buildGraph({
    nodes: graphNodes,
    parentEdges,
    partnerEdges: partnerEdges.filter((edge) => !edge.dissolved),
  });
  const kinship = new Map<string, Kinship>();
  for (const node of graphNodes) {
    if (withheld.has(node.id) || node.id === ROOT_ID) continue;
    kinship.set(node.id, classifyKinship(ROOT_ID, node.id, graph));
  }

  return { tree: { rootRef: refOf.get(ROOT_ID) ?? 0, nodes, edges }, kinship };
}

/**
 * Loads the confirmed memorial links of the person behind `memorialId`,
 * resolved to name, slug, gender and years for the tree. When `recurse` is on,
 * a linked memorial that is public and published also brings its own relatives,
 * so the full family view can show aunts, uncles and grandparents. A private
 * memorial's relatives are never pulled — that would leak what its own page
 * keeps behind access control.
 */
async function linkedMemorialsOf(
  memorialId: string,
  recurse: boolean,
): Promise<LinkedMemorial[]> {
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
        id: memorials.id,
        slug: memorials.slug,
        status: memorials.status,
        visibility: memorials.visibility,
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

    const entry: LinkedMemorial = {
      personId: link.otherPersonId,
      name: row.name,
      slug: row.slug,
      role: link.role,
      gender: row.gender === "male" || row.gender === "female" ? row.gender : "unknown",
      birthYear: yearOf(row.birthDate),
      deathYear: yearOf(row.deathDate),
      lifeStatus: row.deathDate ? "deceased" : "unknown",
    };

    if (recurse && row.status === "published" && row.visibility === "public") {
      entry.relatives = await db()
        .select({
          id: memorialRelatives.id,
          name: memorialRelatives.name,
          relationshipToDeceased: memorialRelatives.relationshipToDeceased,
          isDeceased: memorialRelatives.isDeceased,
          showFullName: memorialRelatives.showFullName,
          coParentId: memorialRelatives.coParentId,
          spouseOfId: memorialRelatives.spouseOfId,
        })
        .from(memorialRelatives)
        .where(eq(memorialRelatives.memorialId, row.id))
        .orderBy(asc(memorialRelatives.displayOrder));
    }

    result.push(entry);
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
  options?: { recurse?: boolean },
): Promise<{ tree: Tree; kinship: Map<string, Kinship> } | null> {
  const linked = await linkedMemorialsOf(memorialId, options?.recurse ?? false);
  return assembleFamilyView({ root, relatives, linked });
}
