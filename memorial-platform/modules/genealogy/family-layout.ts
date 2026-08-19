import type { ChartUnion } from "./family-chart";
import type { ChartPerson } from "./family-chart";

/**
 * Computes exact pixel positions for the family chart, so the connectors can be
 * drawn as real lines rather than approximated with flex boxes.
 *
 * Cards are a fixed size, which makes a deterministic tree layout possible on
 * the server: children are laid out first, side by side; each marriage's
 * descent line then drops from the *midpoint of that marriage's line* to the
 * centre of its children, and the couple is positioned so its bonds sit above
 * those midpoints. A person with two marriages therefore sits between their two
 * spouses, each spouse's children hanging beneath the line that joins them.
 */

export const CARD_W = 132;
export const CARD_H = 82;
const COUPLE_GAP = 22; // room for the marriage line between two cards
const SIB_GAP = 30; // room between sibling subtrees, so couples don't crowd
const GEN_GAP = 48; // vertical room between generations (couple row → children)

export type LaidCard = ChartPerson & {
  x: number;
  y: number;
  /** True for a spouse card (drawn married-in). */
  spouse: boolean;
  dissolved: boolean;
  /** Relation label override (ex-spouse), applied by the renderer. */
  ex: boolean;
};

export type Segment = { x1: number; y1: number; x2: number; y2: number; dashed: boolean };

export type Laid = {
  cards: LaidCard[];
  segments: Segment[];
  width: number;
  height: number;
  /** Centre-x of the anchor card, where a parent's descent attaches. */
  anchorX: number;
};

function shift(laid: Laid, dx: number): Laid {
  return {
    ...laid,
    anchorX: laid.anchorX + dx,
    cards: laid.cards.map((c) => ({ ...c, x: c.x + dx })),
    segments: laid.segments.map((s) => ({
      ...s,
      x1: s.x1 + dx,
      x2: s.x2 + dx,
    })),
  };
}

/** Lays out a horizontal run of child unions, returning each one's anchor-x. */
function layoutRow(
  unions: ChartUnion[],
  depth: number,
): { width: number; anchorXs: number[]; cards: LaidCard[]; segments: Segment[] } {
  const cards: LaidCard[] = [];
  const segments: Segment[] = [];
  const anchorXs: number[] = [];
  let x = 0;
  for (const union of unions) {
    const laid = shift(layoutUnion(union, depth), x);
    cards.push(...laid.cards);
    segments.push(...laid.segments);
    anchorXs.push(laid.anchorX);
    x += laid.width + SIB_GAP;
  }
  return {
    width: Math.max(0, x - SIB_GAP),
    anchorXs,
    cards,
    segments,
  };
}

function cardOf(
  person: ChartPerson,
  x: number,
  y: number,
  opts: { spouse: boolean; dissolved: boolean },
): LaidCard {
  return {
    ...person,
    x,
    y,
    spouse: opts.spouse,
    dissolved: opts.dissolved,
    ex: opts.dissolved,
  };
}

export function layoutUnion(union: ChartUnion, depth: number): Laid {
  const y = depth * (CARD_H + GEN_GAP);
  const withKids = union.marriages.filter((m) => m.children.length > 0);
  const spouseMarriages = union.marriages.filter((m) => m.spouse);

  // A leaf: just the anchor.
  if (withKids.length === 0 && spouseMarriages.length === 0) {
    return {
      cards: [cardOf(union.anchor, 0, y, { spouse: false, dissolved: false })],
      segments: [],
      width: CARD_W,
      height: CARD_H,
      anchorX: CARD_W / 2,
    };
  }

  // Lay every marriage's children out first, side by side. Ex-marriages sit to
  // the left, current ones to the right, so the anchor lands between them.
  const ordered = [...union.marriages].sort(
    (a, b) => (a.dissolved ? 0 : 1) - (b.dissolved ? 0 : 1),
  );

  const cards: LaidCard[] = [];
  const segments: Segment[] = [];
  const childY = y + CARD_H + GEN_GAP;
  const barY = childY - GEN_GAP / 2; // sibling bar sits midway down the gap

  type Block = {
    dissolved: boolean;
    spouse: ChartPerson | null;
    center: number; // absolute x the bond should sit above
    anchorXs: number[];
  };
  const blocks: Block[] = [];
  let bx = 0;
  for (const marriage of ordered) {
    if (marriage.children.length === 0) {
      // Childless marriage: reserve a card-width slot for the spouse.
      blocks.push({
        dissolved: marriage.dissolved,
        spouse: marriage.spouse,
        center: bx + CARD_W / 2,
        anchorXs: [],
      });
      bx += CARD_W + SIB_GAP;
      continue;
    }
    const row = layoutRow(marriage.children, depth + 1);
    const shifted = { cards: row.cards, segments: row.segments };
    for (const c of shifted.cards) cards.push({ ...c, x: c.x + bx });
    for (const s of shifted.segments)
      segments.push({ ...s, x1: s.x1 + bx, x2: s.x2 + bx });
    const anchorXs = row.anchorXs.map((a) => a + bx);
    const center = (anchorXs[0]! + anchorXs[anchorXs.length - 1]!) / 2;

    // Sibling bar + risers from the bar down to each child.
    if (anchorXs.length > 1) {
      segments.push({
        x1: anchorXs[0]!,
        y1: barY,
        x2: anchorXs[anchorXs.length - 1]!,
        y2: barY,
        dashed: false,
      });
    }
    for (const ax of anchorXs) {
      segments.push({ x1: ax, y1: barY, x2: ax, y2: childY, dashed: false });
    }

    blocks.push({
      dissolved: marriage.dissolved,
      spouse: marriage.spouse,
      center,
      anchorXs,
    });
    bx += row.width + SIB_GAP;
  }

  // Position the anchor between the ex blocks (left) and the current ones
  // (right): at the boundary between the leftmost and the rest.
  const spouseBlocks = blocks.filter((b) => b.spouse);
  const nullBlock = blocks.find((b) => !b.spouse); // single-parent children

  let anchorCenter: number;
  if (spouseBlocks.length === 0) {
    // No spouse — children hang straight under the anchor.
    anchorCenter = nullBlock ? nullBlock.center : bx / 2;
  } else if (spouseBlocks.length === 1) {
    const only = spouseBlocks[0]!;
    const half = (CARD_W + COUPLE_GAP) / 2;
    anchorCenter = only.dissolved ? only.center + half : only.center - half;
  } else {
    // Anchor between the leftmost (ex) and the next block.
    anchorCenter =
      (spouseBlocks[0]!.center + spouseBlocks[spouseBlocks.length - 1]!.center) /
      2;
  }

  const coupleMidY = y + CARD_H / 2;

  // The anchor card.
  cards.push(
    cardOf(union.anchor, anchorCenter - CARD_W / 2, y, {
      spouse: false,
      dissolved: false,
    }),
  );

  // Each spouse: placed so the bond (midpoint to the anchor) sits above the
  // block centre; then the marriage line and the descent are drawn.
  for (const block of blocks) {
    if (!block.spouse) {
      // Single-parent descent: straight down from the anchor.
      segments.push({
        x1: anchorCenter,
        y1: coupleMidY,
        x2: anchorCenter,
        y2: barY,
        dashed: false,
      });
      if (block.anchorXs.length === 1) {
        segments.push({
          x1: anchorCenter,
          y1: barY,
          x2: block.anchorXs[0]!,
          y2: barY,
          dashed: false,
        });
      }
      continue;
    }
    const spouseCenter = 2 * block.center - anchorCenter;
    cards.push(
      cardOf(block.spouse, spouseCenter - CARD_W / 2, y, {
        spouse: true,
        dissolved: block.dissolved,
      }),
    );
    const bondX = (anchorCenter + spouseCenter) / 2;
    // Marriage line between the two cards.
    const innerLeft = Math.min(anchorCenter, spouseCenter) + CARD_W / 2;
    const innerRight = Math.max(anchorCenter, spouseCenter) - CARD_W / 2;
    segments.push({
      x1: innerLeft,
      y1: coupleMidY,
      x2: innerRight,
      y2: coupleMidY,
      dashed: block.dissolved,
    });
    // Descent from the bond down to the sibling bar.
    if (block.anchorXs.length > 0) {
      segments.push({
        x1: bondX,
        y1: coupleMidY,
        x2: bondX,
        y2: barY,
        dashed: false,
      });
      // Connect the descent to the bar centre when the bar is offset.
      if (block.anchorXs.length === 1 && block.anchorXs[0] !== bondX) {
        segments.push({
          x1: bondX,
          y1: barY,
          x2: block.anchorXs[0]!,
          y2: barY,
          dashed: false,
        });
      }
    }
  }

  // Normalise so the whole thing starts at x = 0.
  const minX = Math.min(...cards.map((c) => c.x), ...segments.map((s) => Math.min(s.x1, s.x2)));
  const maxX = Math.max(
    ...cards.map((c) => c.x + CARD_W),
    ...segments.map((s) => Math.max(s.x1, s.x2)),
  );
  const maxY = Math.max(...cards.map((c) => c.y + CARD_H), y + CARD_H);
  const normalized: Laid = {
    cards: cards.map((c) => ({ ...c, x: c.x - minX })),
    segments: segments.map((s) => ({
      ...s,
      x1: s.x1 - minX,
      x2: s.x2 - minX,
    })),
    width: maxX - minX,
    height: maxY,
    anchorX: anchorCenter - minX,
  };
  return normalized;
}

/** Lays out the whole forest (a single rooted tree in practice). */
export function layoutForest(forest: ChartUnion[]): Laid {
  if (forest.length === 1) return layoutUnion(forest[0]!, 0);
  const row = layoutRow(forest, 0);
  return {
    cards: row.cards,
    segments: row.segments,
    width: row.width,
    height: Math.max(0, ...row.cards.map((c) => c.y + CARD_H)),
    anchorX: row.anchorXs[0] ?? 0,
  };
}
