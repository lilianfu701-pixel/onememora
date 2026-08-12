import Link from "next/link";
import type { Tree } from "@/modules/genealogy/tree";
import type { Kinship } from "@/modules/genealogy/kinship";
import { buildFamilyChart } from "@/modules/genealogy/family-chart";
import type { ChartPerson, ChartUnion } from "@/modules/genealogy/family-chart";
import { kinshipLabel } from "@/modules/genealogy/kinship-terms";

/**
 * A genealogical family chart: couples joined by a marriage line, a descent
 * line dropping to each couple's children, siblings sharing one parent bar.
 * Generations sit on rows, oldest at the top. The connectors are CSS — see
 * `.famChart` in globals.css — so the whole thing renders on the server.
 */
export function FamilyTree(props: {
  tree: Tree;
  locale: string;
  heading: string;
  kinship: Map<string, Kinship>;
}) {
  if (props.tree.nodes.length <= 1) return null;
  const forest = buildFamilyChart(props.tree, props.kinship);
  if (forest.length === 0) return null;

  return (
    <section className="stack">
      <h2>{props.heading}</h2>
      <div className="famChart">
        <ul className="famForest">
          {forest.map((union) => (
            <UnionNode
              union={union}
              locale={props.locale}
              kinship={props.kinship}
              key={union.key}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function UnionNode(props: {
  union: ChartUnion;
  locale: string;
  kinship: Map<string, Kinship>;
}) {
  const { partners, children } = props.union;

  return (
    <li className="famUnion">
      <div className="famCouple">
        {partners.map((person, index) => (
          <PersonJoin
            person={person}
            first={index === 0}
            locale={props.locale}
            kinship={props.kinship}
            key={person.ref}
          />
        ))}
      </div>
      {children.length > 0 ? (
        <ul className="famChildren">
          {children.map((child) => (
            <UnionNode
              union={child}
              locale={props.locale}
              kinship={props.kinship}
              key={child.key}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** A person card, preceded by a marriage line when they follow a partner. */
function PersonJoin(props: {
  person: ChartPerson;
  first: boolean;
  locale: string;
  kinship: Map<string, Kinship>;
}) {
  return (
    <>
      {!props.first ? <span className="famMarriage" aria-hidden="true" /> : null}
      <PersonCard
        person={props.person}
        locale={props.locale}
        kinship={props.kinship}
      />
    </>
  );
}

function PersonCard(props: {
  person: ChartPerson;
  locale: string;
  kinship: Map<string, Kinship>;
}) {
  const { person } = props;

  if (person.withheld) {
    return (
      <span className="famCard famCardWithheld" aria-hidden="true">
        ···
      </span>
    );
  }

  const kin = person.personId ? props.kinship.get(person.personId) : undefined;
  const relation =
    person.isRoot || !kin ? null : kinshipLabel(kin, props.locale);

  const className = [
    "famCard",
    person.isRoot ? "famCardRoot" : "",
    person.marriedIn ? "famCardMarriedIn" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      <span className={`famSex famSex-${person.gender}`} aria-hidden="true" />
      <span className="famCardText">
        {relation ? <span className="famCardRelation">{relation}</span> : null}
        <span className="famCardName">{person.name}</span>
        {person.years ? (
          <span className="famCardYears">{person.years}</span>
        ) : null}
      </span>
    </>
  );

  if (!person.isRoot && person.memorialSlug) {
    return (
      <Link
        className={className}
        href={`/${props.locale}/memorials/${person.memorialSlug}`}
      >
        {body}
      </Link>
    );
  }

  return <span className={className}>{body}</span>;
}
