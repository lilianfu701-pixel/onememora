import Link from "next/link";
import type { Tree, TreeNode } from "@/modules/genealogy/tree";
import type { Kinship } from "@/modules/genealogy/kinship";
import { kinshipLabel } from "@/modules/genealogy/kinship-terms";

type Generation = { gen: number; nodes: TreeNode[] };

/**
 * Places each node on a generation relative to the root (0), parents above
 * (−1, −2…), children below (+1…), partners on the same row. Small graphs
 * settle in a couple of passes.
 */
function layout(tree: Tree): Generation[] {
  const genByRef = new Map<number, number>([[tree.rootRef, 0]]);

  for (let pass = 0; pass <= tree.nodes.length; pass += 1) {
    let changed = false;
    for (const edge of tree.edges) {
      const from = genByRef.get(edge.fromRef);
      const to = genByRef.get(edge.toRef);
      if (edge.kind === "partner") {
        if (from !== undefined && to === undefined) {
          genByRef.set(edge.toRef, from);
          changed = true;
        } else if (to !== undefined && from === undefined) {
          genByRef.set(edge.fromRef, to);
          changed = true;
        }
      } else {
        // parent edge: fromRef is the parent (one generation older).
        if (to !== undefined && from === undefined) {
          genByRef.set(edge.fromRef, to - 1);
          changed = true;
        } else if (from !== undefined && to === undefined) {
          genByRef.set(edge.toRef, from + 1);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  const groups = new Map<number, TreeNode[]>();
  for (const node of tree.nodes) {
    const gen = genByRef.get(node.ref);
    if (gen === undefined) continue;
    const bucket = groups.get(gen);
    if (bucket) bucket.push(node);
    else groups.set(gen, [node]);
  }

  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([gen, nodes]) => ({ gen, nodes }));
}

export function FamilyTree(props: {
  tree: Tree;
  locale: string;
  heading: string;
  kinship: Map<string, Kinship>;
}) {
  const generations = layout(props.tree);

  // Nothing worth drawing until this person is actually connected to someone.
  if (props.tree.nodes.length <= 1) return null;

  const years = (node: Extract<TreeNode, { visible: true }>): string =>
    [node.birthYear, node.deathYear].filter((year) => year !== null).join("–");

  return (
    <section className="stack">
      <h2>{props.heading}</h2>
      <div className="familyTree">
        {generations.map(({ gen, nodes }) => (
          <div className="familyTreeGen" key={gen}>
            {nodes.map((node) => {
              if (!node.visible) {
                return (
                  <span
                    className="familyNode familyNodeWithheld"
                    key={node.ref}
                    aria-hidden="true"
                  >
                    ···
                  </span>
                );
              }
              const isRoot = node.ref === props.tree.rootRef;
              const kin = props.kinship.get(node.personId);
              const relation = isRoot || !kin ? null : kinshipLabel(kin, props.locale);
              const inner = (
                <>
                  {relation ? (
                    <span className="familyNodeRelation">{relation}</span>
                  ) : null}
                  <span className="familyNodeName">{node.name}</span>
                  {years(node) ? (
                    <span className="familyNodeYears">{years(node)}</span>
                  ) : null}
                </>
              );
              if (!isRoot && node.memorialSlug) {
                return (
                  <Link
                    className="familyNode"
                    key={node.ref}
                    href={`/${props.locale}/memorials/${node.memorialSlug}`}
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <span
                  className={isRoot ? "familyNode familyNodeRoot" : "familyNode"}
                  key={node.ref}
                >
                  {inner}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
