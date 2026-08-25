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
  /** Portrait URL per memorial slug, so a relative shows their own face. */
  portraits?: Map<string, string>;
}) {
  if (props.tree.nodes.length <= 1) return null;
  const forest = buildFamilyChart(props.tree);
  if (forest.length === 0) return null;

  const laid = layoutForest(forest);

  return (
    <section className="stack">
      {props.heading ? <h2 className="famHeading">{props.heading}</h2> : null}
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
              portrait={
                card.memorialSlug
                  ? (props.portraits?.get(card.memorialSlug) ?? null)
                  : null
              }
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
  portrait: string | null;
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

  // Three states only: this memorial's person, someone living, someone who
  // has died. Everything else the chart used to encode (sex, married-in) is
  // noise here.
  const className = [
    "famCard",
    card.isRoot
      ? "famCardRoot"
      : card.deceased
        ? "famCardDeceased"
        : "famCardLiving",
  ].join(" ");

  const initial = card.name.trim().slice(0, 1) || "·";
  // The subject of the memorial needs no relationship label — it is the person
  // every other label is relative to.
  const label = card.isRoot ? null : relation;

  const body = (
    <>
      {props.portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="famAvatar famAvatarPhoto"
          src={props.portrait}
          alt=""
          loading="lazy"
        />
      ) : (
        <span className="famAvatar" aria-hidden="true">
          {initial}
        </span>
      )}
      <span className="famCardText">
        <span className="famCardName">{card.name}</span>
        {label ? <span className="famCardRelation">{label}</span> : null}
        {card.years ? <span className="famCardYears">{card.years}</span> : null}
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
