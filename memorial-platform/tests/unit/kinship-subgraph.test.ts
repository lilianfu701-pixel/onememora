import { describe, expect, it } from "vitest";
import {
  buildGraph,
  classifyKinship,
  loadGraphAround,
  type Gender,
  type GraphSource,
} from "@/modules/genealogy/kinship";

type Person = { id: string; gender: Gender; birthYear: number | null };

/** Deterministic PRNG so the generated forest is identical on every run. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

/**
 * Several clans, seven generations each, children born to couples, some
 * marriages across clans, some dissolved, plus clans nobody in the first clan
 * is related to — the shape an import-heavy site ends up with.
 */
function forest() {
  const next = random(20260929);
  const people: Person[] = [];
  const parentEdges: { parentId: string; childId: string }[] = [];
  const partnerEdges: { aId: string; bId: string; dissolved: boolean }[] = [];
  const clans: string[][] = [];
  const generationOf = new Map<string, number>();

  const person = (clan: number, n: number, gender: Gender, year: number): string => {
    const id = `c${clan}-p${n}`;
    people.push({ id, gender, birthYear: next() < 0.15 ? null : year });
    generationOf.set(id, Math.round((year - 1800) / 25));
    return id;
  };

  for (let clan = 0; clan < 6; clan += 1) {
    let n = 0;
    const members: string[] = [];
    let couples: [string, string][] = [[person(clan, n++, "male", 1800), person(clan, n++, "female", 1803)]];
    members.push(...couples[0]!);
    partnerEdges.push({ aId: couples[0]![0], bId: couples[0]![1], dissolved: false });

    for (let generation = 1; generation < 7; generation += 1) {
      const nextCouples: [string, string][] = [];
      for (const [father, mother] of couples) {
        const children = 1 + Math.floor(next() * 3);
        for (let c = 0; c < children; c += 1) {
          // The first child is a son so every line reaches the youngest generation.
          const gender: Gender = c === 0 || next() < 0.5 ? "male" : "female";
          const child = person(clan, n++, gender, 1800 + generation * 25 + c);
          members.push(child);
          parentEdges.push({ parentId: father, childId: child });
          if (next() < 0.8) parentEdges.push({ parentId: mother, childId: child });
          if (gender === "male" && nextCouples.length < 12) {
            const wife = person(clan, n++, "female", 1800 + generation * 25 + 2);
            members.push(wife);
            partnerEdges.push({ aId: child, bId: wife, dissolved: next() < 0.1 });
            nextCouples.push([child, wife]);
          }
        }
      }
      couples = nextCouples;
    }
    clans.push(members);
  }

  // Marriages between clans 0–2 so the root's family reaches into other clans.
  for (let i = 0; i < 8; i += 1) {
    const a = clans[i % 3]![Math.floor(next() * clans[i % 3]!.length)]!;
    const b = clans[(i + 1) % 3]![Math.floor(next() * clans[(i + 1) % 3]!.length)]!;
    partnerEdges.push({ aId: a, bId: b, dissolved: false });
  }

  return { people, parentEdges, partnerEdges, clans, generationOf };
}

function sourceFor(data: ReturnType<typeof forest>): GraphSource & { loadedIds: Set<string> } {
  const loadedIds = new Set<string>();
  const current = data.partnerEdges.filter((edge) => !edge.dissolved);
  return {
    loadedIds,
    partnersOf: async (ids) => {
      const set = new Set(ids);
      return current.filter((edge) => set.has(edge.aId) || set.has(edge.bId));
    },
    parentsOf: async (ids) => {
      const set = new Set(ids);
      return data.parentEdges.filter((edge) => set.has(edge.childId));
    },
    metaOf: async (ids) => {
      const set = new Set(ids);
      for (const id of ids) loadedIds.add(id);
      return data.people.filter((person) => set.has(person.id));
    },
  };
}

describe("loadGraphAround", () => {
  const data = forest();
  const full = buildGraph({
    nodes: data.people,
    parentEdges: data.parentEdges,
    partnerEdges: data.partnerEdges.filter((edge) => !edge.dissolved),
  });

  it("generates a forest large enough to be meaningful", () => {
    expect(data.clans[0]!.length).toBeGreaterThan(80);
    expect(Math.max(...data.generationOf.values())).toBe(6);
  });

  it("classifies every target exactly as the whole-graph walk does", async () => {
    const clan = data.clans[0]!;
    const clanSet = new Set(clan);
    const married = data.partnerEdges
      .filter((edge) => !edge.dissolved && clanSet.has(edge.aId))
      .map((edge) => edge.aId);
    const kinds = new Set<string>();
    for (const rootId of [married[3]!, married[Math.floor(married.length / 2)]!, clan[clan.length - 1]!]) {
      const spouses = data.partnerEdges
        .filter((edge) => !edge.dissolved && (edge.aId === rootId || edge.bId === rootId))
        .map((edge) => (edge.aId === rootId ? edge.bId : edge.aId));
      const targets = [rootId, ...spouses, ...clan.slice(0, 150), ...data.clans[1]!.slice(0, 40)];
      const source = sourceFor(data);
      const local = await loadGraphAround(rootId, targets, source);

      for (const targetId of targets) {
        const expected = classifyKinship(rootId, targetId, full);
        kinds.add(expected.kind);
        expect(classifyKinship(rootId, targetId, local), `${rootId} → ${targetId}`)
          .toEqual(expected);
      }
    }
    // The comparison is only meaningful if it spans every kind of tie.
    expect([...kinds].sort()).toEqual(["affinal", "blood", "distant", "self", "spouse"]);
  });

  it("walks up to shared ancestors that are not themselves targets", async () => {
    // Roots in the youngest generation; targets only three generations above
    // (great-grandparents and their siblings). The generations in between are
    // not targets, so the loader must climb three and four levels on its own.
    const ids = data.people.map((person) => person.id).filter((id) => /^c0-/.test(id));
    const roots = ids.filter((id) => data.generationOf.get(id) === 6).slice(0, 8);
    const elders = ids.filter((id) => data.generationOf.get(id) === 3);
    const directLine = (id: string): Set<string> => {
      const line = new Set<string>();
      let frontier = [id];
      while (frontier.length > 0) {
        frontier = frontier.flatMap((child) => full.parents.get(child) ?? []);
        for (const ancestor of frontier) line.add(ancestor);
      }
      return line;
    };
    let deepestUp = 0;
    for (const rootId of roots) {
      // The root's own ancestors are left out, so their siblings (4 up, 1 down)
      // can only be reached by climbing the full four generations.
      const line = directLine(rootId);
      const targets = elders.filter((id) => !line.has(id));
      const local = await loadGraphAround(rootId, targets, sourceFor(data));
      for (const targetId of targets) {
        const expected = classifyKinship(rootId, targetId, full);
        if (expected.kind === "blood") deepestUp = Math.max(deepestUp, expected.up);
        expect(classifyKinship(rootId, targetId, local), `${rootId} → ${targetId}`).toEqual(expected);
      }
    }
    // Great-grandparents (3 up) and their siblings (4 up, 1 down) must appear,
    // otherwise the upward walk is not being exercised.
    expect(deepestUp).toBe(4);
  });

  it("walks through a target's spouse when only the spouse married in", async () => {
    const young = new Set(
      data.people.map((person) => person.id)
        .filter((id) => (data.generationOf.get(id) ?? 0) >= 5 && /^c0-/.test(id)),
    );
    // Wives who married in: targets whose own husband is not a target.
    const wives = data.partnerEdges
      .filter((edge) => !edge.dissolved && young.has(edge.aId) && young.has(edge.bId))
      .map((edge) => edge.bId);
    const roots = [...young].filter((id) => data.generationOf.get(id) === 6).slice(0, 8);
    let affinal = 0;
    for (const rootId of roots) {
      const local = await loadGraphAround(rootId, wives, sourceFor(data));
      for (const targetId of wives) {
        const expected = classifyKinship(rootId, targetId, full);
        if (expected.kind === "affinal") affinal += 1;
        expect(classifyKinship(rootId, targetId, local), `${rootId} → ${targetId}`).toEqual(expected);
      }
    }
    expect(affinal).toBeGreaterThan(0);
  });

  it("reads only the neighbourhood, never the unrelated clans", async () => {
    const clan = data.clans[0]!;
    const source = sourceFor(data);
    await loadGraphAround(clan[60]!, clan.slice(50, 80), source);

    const unrelated = new Set([...data.clans[4]!, ...data.clans[5]!]);
    expect([...source.loadedIds].some((id) => unrelated.has(id))).toBe(false);
    expect(source.loadedIds.size).toBeLessThan(data.people.length / 4);
  });
});
