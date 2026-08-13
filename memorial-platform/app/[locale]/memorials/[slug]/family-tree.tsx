import Link from "next/link";
import type { Tree } from "@/modules/genealogy/tree";
import type { Kinship } from "@/modules/genealogy/kinship";
import { buildFamilyChart } from "@/modules/genealogy/family-chart";
import {
  CARD_H,
  CARD_W,
  layoutForest,
} from "@/modules/genealogy/family-layout";
import type { LaidCard } from "@/modules/genealogy/family-layout";
import { exSpouseLabel, kinshipLabel } from "@/modules/genealogy/kinship-terms";

/**
 * A genealogical family chart drawn from a computed layout: cards at exact
 * positions with SVG connectors, so a marriage line's descent drops from its
 * true midpoint and siblings share one bar. The anchor sits between its
 * spouses; an ended marriage is a dashed line.
 */
export function FamilyTree(props: {
  tree: Tree;
  locale: string;
  heading: string;
  kinship: Map<string, Kinship>;
  statusLiving: string;
  statusDeceased: string;
}) {
  if (props.tree.nodes.length <= 1) return null;
  const forest = buildFamilyChart(props.tree);
  if (forest.length === 0) return null;

  const laid = layoutForest(forest);

  return (
    <section className="stack">
      {props.heading ? <h2>{props.heading}</h2> : null}
      <div className="famChart">
        <div
          className="famStage"
          style={{ width: `${laid.width}px`, height: `${laid.height}px` }}
        >
          <svg
            className="famLines"
            width={laid.width}
            height={laid.height}
            viewBox={`0 0 ${laid.width} ${laid.height}`}
            aria-hidden="true"
          >
            {laid.segments.map((s, i) => (
              <line
                key={i}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                className={s.dashed ? "famSeg famSegDashed" : "famSeg"}
              />
            ))}
          </svg>
          {laid.cards.map((card) => (
            <Card
              card={card}
              locale={props.locale}
              kinship={props.kinship}
              statusLiving={props.statusLiving}
              statusDeceased={props.statusDeceased}
              key={`${card.ref}-${card.spouse ? "s" : "a"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card(props: {
  card: LaidCard;
  locale: string;
  kinship: Map<string, Kinship>;
  statusLiving: string;
  statusDeceased: string;
}) {
  const { card } = props;
  const style = {
    left: `${card.x}px`,
    top: `${card.y}px`,
    width: `${CARD_W}px`,
    height: `${CARD_H}px`,
  };

  if (card.withheld) {
    return (
      <span className="famCard famCardWithheld" style={style} aria-hidden="true">
        ···
      </span>
    );
  }

  const kin = card.personId ? props.kinship.get(card.personId) : undefined;
  const relation = card.ex
    ? exSpouseLabel(card.gender, props.locale)
    : card.isRoot
      ? null
      : kin
        ? kinshipLabel(kin, props.locale)
        : null;

  const status =
    card.isRoot || !card.lifeKnown
      ? null
      : card.deceased
        ? props.statusDeceased
        : props.statusLiving;

  const className = [
    "famCard",
    card.isRoot ? "famCardRoot" : "",
    card.spouse ? "famCardMarriedIn" : "",
    card.deceased && !card.isRoot ? "famCardDeceased" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      <span className={`famSex famSex-${card.gender}`} aria-hidden="true" />
      <span className="famCardText">
        {relation ? <span className="famCardRelation">{relation}</span> : null}
        <span className="famCardName">{card.name}</span>
        {card.years ? <span className="famCardYears">{card.years}</span> : null}
        {status ? <span className="famCardStatus">{status}</span> : null}
      </span>
    </>
  );

  if (!card.isRoot && card.memorialSlug) {
    return (
      <Link
        className={className}
        style={style}
        href={`/${props.locale}/memorials/${card.memorialSlug}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <span className={className} style={style}>
      {body}
    </span>
  );
}
