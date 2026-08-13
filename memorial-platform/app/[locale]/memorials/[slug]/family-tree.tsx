import Link from "next/link";
import type { Tree } from "@/modules/genealogy/tree";
import type { Kinship } from "@/modules/genealogy/kinship";
import { buildFamilyChart } from "@/modules/genealogy/family-chart";
import type {
  ChartMarriage,
  ChartPerson,
  ChartUnion,
} from "@/modules/genealogy/family-chart";
import { exSpouseLabel, kinshipLabel } from "@/modules/genealogy/kinship-terms";

/**
 * A genealogical family chart. Couples are joined by a marriage line (dashed
 * for an ended marriage), a descent line drops to each marriage's children, and
 * a person with more than one marriage keeps each set of children under the
 * right spouse. Connectors are CSS — see `.famChart` in globals.css — so the
 * whole chart renders on the server.
 */
/** Everything the recursive nodes need beyond the union itself. */
type ChartContext = {
  locale: string;
  kinship: Map<string, Kinship>;
  statusLiving: string;
  statusDeceased: string;
};

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

  const ctx: ChartContext = {
    locale: props.locale,
    kinship: props.kinship,
    statusLiving: props.statusLiving,
    statusDeceased: props.statusDeceased,
  };

  return (
    <section className="stack">
      <h2>{props.heading}</h2>
      <div className="famChart">
        <ul className="famForest">
          {forest.map((union) => (
            <UnionNode union={union} ctx={ctx} key={union.key} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function UnionNode(props: { union: ChartUnion; ctx: ChartContext }) {
  const { anchor, marriages } = props.union;
  const ctx = props.ctx;

  // Anchor first, then each spouse (current before ended); broods follow the
  // same order so a spouse and their children line up.
  const spouses = marriages.filter((m) => m.spouse);
  const broods = marriages.filter((m) => m.children.length > 0);
  const labelBroods = broods.length > 1;

  return (
    <li className="famUnion">
      <div className="famCouple">
        <PersonCard person={anchor} ctx={ctx} />
        {spouses.map((marriage) => (
          <SpouseCard marriage={marriage} ctx={ctx} key={marriage.spouse?.ref} />
        ))}
      </div>

      {broods.length > 0 ? (
        <div className="famBroodRow">
          {broods.map((marriage, index) => (
            <div className="famBrood" key={marriage.spouse?.ref ?? `b${index}`}>
              {labelBroods ? (
                <span className="famBroodCaption">
                  {broodCaption(marriage, ctx.locale)}
                </span>
              ) : null}
              <ul className="famChildren">
                {marriage.children.map((child) => (
                  <UnionNode union={child} ctx={ctx} key={child.key} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </li>
  );
}

function SpouseCard(props: { marriage: ChartMarriage; ctx: ChartContext }) {
  const { spouse, dissolved } = props.marriage;
  if (!spouse) return null;

  return (
    <>
      <span
        className={dissolved ? "famMarriage famMarriageEnded" : "famMarriage"}
        aria-hidden="true"
      />
      <PersonCard
        person={spouse}
        ctx={props.ctx}
        marriedIn
        overrideLabel={
          dissolved ? exSpouseLabel(spouse.gender, props.ctx.locale) : null
        }
      />
    </>
  );
}

function PersonCard(props: {
  person: ChartPerson;
  ctx: ChartContext;
  marriedIn?: boolean;
  overrideLabel?: string | null;
}) {
  const { person, ctx } = props;

  if (person.withheld) {
    return (
      <span className="famCard famCardWithheld" aria-hidden="true">
        ···
      </span>
    );
  }

  const kin = person.personId ? ctx.kinship.get(person.personId) : undefined;
  const relation =
    props.overrideLabel ??
    (person.isRoot || !kin ? null : kinshipLabel(kin, ctx.locale));

  // Status shows on everyone but the memorial's own subject, who is plainly
  // the person being remembered.
  const status =
    person.isRoot || !person.lifeKnown
      ? null
      : person.deceased
        ? ctx.statusDeceased
        : ctx.statusLiving;

  const className = [
    "famCard",
    person.isRoot ? "famCardRoot" : "",
    props.marriedIn ? "famCardMarriedIn" : "",
    person.deceased && !person.isRoot ? "famCardDeceased" : "",
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
        {status ? <span className="famCardStatus">{status}</span> : null}
      </span>
    </>
  );

  if (!person.isRoot && person.memorialSlug) {
    return (
      <Link
        className={className}
        href={`/${ctx.locale}/memorials/${person.memorialSlug}`}
      >
        {body}
      </Link>
    );
  }

  return <span className={className}>{body}</span>;
}

/** "与前妻" / "与现任妻子" — whose children a brood holds, when it's ambiguous. */
function broodCaption(marriage: ChartMarriage, locale: string): string {
  const zh = locale.startsWith("zh");
  if (!marriage.spouse) return zh ? "子女" : "Children";
  const g = marriage.spouse.gender;
  if (marriage.dissolved) return exSpouseLabel(g, locale);
  if (zh) return g === "male" ? "丈夫" : g === "female" ? "妻子" : "配偶";
  return g === "male" ? "Husband" : g === "female" ? "Wife" : "Spouse";
}
