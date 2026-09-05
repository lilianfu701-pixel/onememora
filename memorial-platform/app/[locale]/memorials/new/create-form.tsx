"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { countryOptions } from "@/lib/countries";
import { regionsFor } from "@/lib/regions";
import { DuplicateWarning } from "./duplicate-warning";

type Relationship =
  | "husband"
  | "wife"
  | "father"
  | "mother"
  | "paternal_grandfather"
  | "paternal_grandmother"
  | "maternal_grandfather"
  | "maternal_grandmother"
  | "son"
  | "daughter"
  | "older_sister"
  | "older_brother"
  | "younger_brother"
  | "younger_sister";

type Precision = "unknown" | "year" | "approximate" | "month" | "day";
type Visibility = "public" | "unlisted" | "invite_only";
type NameType = "former" | "native" | "transliteration" | "alias";

/** A partial date entered as separate year / month / day fields. */
type DateParts = { year: string; month: string; day: string };

type AliasEntry = { value: string; type: NameType };

type RelativeEntry = {
  name: string;
  relationshipToDeceased: string;
  isDeceased: boolean;
  showFullName: boolean;
};

type CoCreatorEntry = {
  name: string;
  relationshipToDeceased: string;
};

const RELATIONSHIPS: Relationship[] = [
  "husband",
  "wife",
  "father",
  "mother",
  "paternal_grandfather",
  "paternal_grandmother",
  "maternal_grandfather",
  "maternal_grandmother",
  "son",
  "daughter",
];

const NAME_TYPES: NameType[] = ["alias", "former", "native", "transliteration"];

/** Faith / belief options; the value stored is the slug, displayed via i18n. */
const FAITH_OPTIONS = [
  "none",
  "buddhism",
  "taoism",
  "christianity",
  "catholicism",
  "islam",
  "hinduism",
  "judaism",
  "folk",
  "other",
] as const;

/** Cause-of-death options; stored as a slug, displayed via i18n. */
const CAUSE_OPTIONS = [
  "natural",
  "illness",
  "premature",
  "war",
  "accident",
  "disaster",
  "other",
] as const;

const RELATIVE_RELATIONSHIPS = [
  "father",
  "mother",
  "paternal_grandfather",
  "paternal_grandmother",
  "maternal_grandfather",
  "maternal_grandmother",
  "husband",
  "wife",
  "ex_husband",
  "ex_wife",
  "son",
  "daughter",
  "older_brother",
  "older_sister",
  "younger_brother",
  "younger_sister",
] as const;

const MAX_ONE: ReadonlySet<string> = new Set([
  "father",
  "mother",
  "paternal_grandfather",
  "paternal_grandmother",
  "maternal_grandfather",
  "maternal_grandmother",
  "husband",
  "wife",
]);

const EMPTY_PARTS: DateParts = { year: "", month: "", day: "" };

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

/**
 * A date → API shape. Year alone yields year precision; adding a month
 * narrows to month; adding a day narrows to day. No year means no date.
 */
function partsToDate(
  parts: DateParts,
): { value: string; precision: Precision } | undefined {
  const year = parts.year.trim();
  if (year === "") return undefined;
  const yyyy = year.padStart(4, "0").slice(0, 4);
  if (parts.month === "") {
    return { value: `${yyyy}-01-01`, precision: "year" };
  }
  if (parts.day === "") {
    return { value: `${yyyy}-${parts.month}-01`, precision: "month" };
  }
  return { value: `${yyyy}-${parts.month}-${parts.day}`, precision: "day" };
}

function desensitizeName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  const chars = [...trimmed];
  if (chars.length === 2) return chars[0] + "*";
  return chars[0] + "*".repeat(chars.length - 2) + chars[chars.length - 1];
}

/**
 * Year / month / day fields. Year is a number; month and day are dropdowns.
 * The empty month/day option reads `emptyLabel` — "not sure" for a birth date,
 * a neutral dash for a death date (a death is usually known precisely).
 */
function DateFields(props: {
  parts: DateParts;
  onChange: (parts: DateParts) => void;
  yearLabel: string;
  monthLabel: string;
  dayLabel: string;
  emptyLabel: string;
  yearPlaceholder: string;
}) {
  const { parts, onChange } = props;
  return (
    <div className="dateRow">
      <label className="field">
        <span className="fieldLabel">{props.yearLabel}</span>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min={1583}
          max={2200}
          placeholder={props.yearPlaceholder}
          value={parts.year}
          onChange={(e) =>
            onChange(
              e.target.value.trim() === ""
                ? EMPTY_PARTS
                : { ...parts, year: e.target.value },
            )
          }
        />
      </label>
      <label className="field">
        <span className="fieldLabel">{props.monthLabel}</span>
        <select
          className="input"
          value={parts.month}
          disabled={parts.year.trim() === ""}
          onChange={(e) =>
            onChange({
              ...parts,
              month: e.target.value,
              ...(e.target.value === "" ? { day: "" } : {}),
            })
          }
        >
          <option value="">{props.emptyLabel}</option>
          {MONTHS.map((m) => (
            <option value={m} key={m}>
              {Number(m)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="fieldLabel">{props.dayLabel}</span>
        <select
          className="input"
          value={parts.day}
          disabled={parts.month === ""}
          onChange={(e) => onChange({ ...parts, day: e.target.value })}
        >
          <option value="">{props.emptyLabel}</option>
          {DAYS.map((d) => (
            <option value={d} key={d}>
              {Number(d)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/**
 * Region field: a province/state dropdown when the chosen country has a seeded
 * list, otherwise a free-text input so any place can still be recorded.
 */
function RegionField(props: {
  label: string;
  country: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const regions = regionsFor(props.country);
  return (
    <label className="field">
      <span className="fieldLabel">{props.label}</span>
      {regions.length > 0 ? (
        <select
          className="input"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        >
          <option value="">—</option>
          {regions.map((r) => (
            <option value={r} key={r}>
              {r}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="input"
          type="text"
          maxLength={120}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function CreateMemorialForm(props: {
  locale: string;
  /** Platform staff: unlocks "create on a family's behalf, awaiting claim". */
  isAdmin?: boolean;
}) {
  const t = useTranslations("memorial");
  const privacy = useTranslations("privacy");
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  const home = useTranslations("home");
  const router = useRouter();

  const countries = useMemo(
    () => countryOptions(props.locale),
    [props.locale],
  );

  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState<AliasEntry[]>([]);
  const [birth, setBirth] = useState<DateParts>(EMPTY_PARTS);
  // Death defaults to the current year, the common case for a new memorial.
  const [death, setDeath] = useState<DateParts>({
    year: String(new Date().getFullYear()),
    month: "",
    day: "",
  });

  // Both countries default to China, the platform's primary audience.
  const [birthCountry, setBirthCountry] = useState("CN");
  const [birthRegion, setBirthRegion] = useState("");

  const [deathCountry, setDeathCountry] = useState("CN");
  const [deathRegion, setDeathRegion] = useState("");

  const [ancestralHometown, setAncestralHometown] = useState("");
  const [faith, setFaith] = useState("");
  const [causeOfDeath, setCauseOfDeath] = useState("");

  // The portrait (遗像). Held locally and uploaded to the new memorial once it
  // exists — the media pipeline is memorial-scoped, so there is no asset to
  // create until the POST below returns a memorialId.
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);

  const [relatives, setRelatives] = useState<RelativeEntry[]>([]);
  const [showAllNames, setShowAllNames] = useState(false);

  const [visibility, setVisibility] = useState<Visibility>("public");
  const [indexable, setIndexable] = useState(true);
  const [publicAcknowledged, setPublicAcknowledged] = useState(false);
  const [coCreate, setCoCreate] = useState(false);
  const [coCreators, setCoCreators] = useState<CoCreatorEntry[]>([]);

  const [declared, setDeclared] = useState(false);
  // Admin-only: create the page on a family's behalf, to be claimed later. When
  // on, the relationship/declaration are not required (staff are not family).
  const [asSteward, setAsSteward] = useState(false);

  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [failure, setFailure] = useState<string | null>(null);

  const attempt = useRef<{ key: string; payload: string } | null>(null);

  function keyFor(payload: string): string {
    if (attempt.current?.payload !== payload) {
      attempt.current = { key: crypto.randomUUID(), payload };
    }
    return attempt.current.key;
  }

  // Sign → PUT → complete for the portrait against the freshly created memorial.
  // We stop at `complete`; the asset finishes processing server-side and shows
  // on the memorial page once ready, so there is no need to poll here.
  async function uploadPortrait(memorialId: string, file: File): Promise<void> {
    const sign = await fetch("/api/media/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        memorialId,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });
    if (!sign.ok) throw new Error("sign");
    const s = (await sign.json()).data;
    const put = await fetch(s.url, { method: "PUT", headers: s.headers, body: file });
    if (!put.ok) throw new Error("put");
    const complete = await fetch(`/api/media/${s.mediaAssetId}/complete`, {
      method: "POST",
    });
    if (!complete.ok) throw new Error("complete");
  }

  function pickPortrait(file: File | null): void {
    setPortraitFile(file);
    setPortraitPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  const steward = Boolean(props.isAdmin) && asSteward;
  const needsPublicAcknowledgement = visibility === "public";
  const canSubmit =
    name.trim().length > 0 &&
    // A family creator states their relationship and signs the declaration; a
    // platform steward does neither.
    (steward || (relationship !== null && declared)) &&
    (!needsPublicAcknowledgement || publicAcknowledged) &&
    !sending;

  function addAlias(): void {
    setAliases([...aliases, { value: "", type: "alias" }]);
  }

  function updateAlias(idx: number, patch: Partial<AliasEntry>): void {
    setAliases(aliases.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }

  function removeAlias(idx: number): void {
    setAliases(aliases.filter((_, i) => i !== idx));
  }

  function addCoCreator(): void {
    setCoCreators([...coCreators, { name: "", relationshipToDeceased: "" }]);
  }

  function updateCoCreator(idx: number, patch: Partial<CoCreatorEntry>): void {
    setCoCreators(
      coCreators.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    );
  }

  function removeCoCreator(idx: number): void {
    setCoCreators(coCreators.filter((_, i) => i !== idx));
  }

  function relativeUsedCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const r of relatives) {
      counts.set(
        r.relationshipToDeceased,
        (counts.get(r.relationshipToDeceased) ?? 0) + 1,
      );
    }
    return counts;
  }

  function isRelMaxedOut(rel: string, counts: Map<string, number>): boolean {
    return MAX_ONE.has(rel) && (counts.get(rel) ?? 0) >= 1;
  }

  function firstAvailableRelationship(): string {
    const counts = relativeUsedCounts();
    for (const rr of RELATIVE_RELATIONSHIPS) {
      if (!isRelMaxedOut(rr, counts)) return rr;
    }
    return RELATIVE_RELATIONSHIPS[0];
  }

  function addRelative(): void {
    setRelatives([
      ...relatives,
      {
        name: "",
        relationshipToDeceased: firstAvailableRelationship(),
        isDeceased: false,
        showFullName: false,
      },
    ]);
  }

  function updateRelative(idx: number, patch: Partial<RelativeEntry>): void {
    setRelatives(
      relatives.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, ...patch };
        if ("isDeceased" in patch) {
          updated.showFullName = patch.isDeceased ?? false;
        }
        return updated;
      }),
    );
  }

  function removeRelative(idx: number): void {
    setRelatives(relatives.filter((_, i) => i !== idx));
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if ((!relationship && !steward) || !canSubmit) return;

    // Places are detailed only to the province/state level (no city).
    const locations: {
      kind: "birth" | "death";
      country?: string;
      region?: string;
    }[] = [];

    if (birthCountry.trim() || birthRegion.trim()) {
      locations.push({
        kind: "birth",
        ...(birthCountry.trim() ? { country: birthCountry.trim() } : {}),
        ...(birthRegion.trim() ? { region: birthRegion.trim() } : {}),
      });
    }

    if (deathCountry.trim() || deathRegion.trim()) {
      locations.push({
        kind: "death",
        ...(deathCountry.trim() ? { country: deathCountry.trim() } : {}),
        ...(deathRegion.trim() ? { region: deathRegion.trim() } : {}),
      });
    }

    const validAliases = aliases
      .filter((a) => a.value.trim().length > 0)
      .map((a) => ({ value: a.value.trim(), type: a.type }));

    const validRelatives = relatives
      .filter((r) => r.name.trim().length > 0)
      .map((r) => ({
        name: r.name.trim(),
        relationshipToDeceased: r.relationshipToDeceased,
        isDeceased: r.isDeceased,
        showFullName: showAllNames || r.showFullName,
      }));

    const validCoCreators = coCreators
      .filter(
        (c) => c.name.trim().length > 0 && c.relationshipToDeceased !== "",
      )
      .map((c) => ({
        name: c.name.trim(),
        relationshipToDeceased: c.relationshipToDeceased,
      }));

    const birthDate = partsToDate(birth);
    const deathDate = partsToDate(death);

    const body = {
      // For a steward the relationship is ignored server-side; a valid enum
      // value is still sent to satisfy the request schema.
      relationship: relationship ?? "child",
      relationshipStatementAccepted: steward ? true : declared,
      ...(steward ? { asAdminSteward: true } : {}),
      primaryName: { value: name.trim() },
      ...(validAliases.length > 0 ? { aliases: validAliases } : {}),
      ...(birthDate ? { birthDate } : {}),
      ...(deathDate ? { deathDate } : {}),
      ...(locations.length > 0 ? { locations } : {}),
      ...(ancestralHometown.trim()
        ? { ancestralHometown: ancestralHometown.trim() }
        : {}),
      ...(faith.trim() ? { faith: faith.trim() } : {}),
      ...(causeOfDeath.trim() ? { causeOfDeath: causeOfDeath.trim() } : {}),
      ...(validRelatives.length > 0 ? { relatives: validRelatives } : {}),
      ...(coCreate && validCoCreators.length > 0
        ? { coCreators: validCoCreators }
        : {}),
      visibility,
      searchEngineIndexable: visibility === "public" ? indexable : false,
    };

    const payload = JSON.stringify(body);
    setSending(true);
    setFieldErrors({});
    setFailure(null);

    try {
      const response = await fetch("/api/memorials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": keyFor(payload),
        },
        body: payload,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFieldErrors(result?.error?.fieldErrors ?? {});
        setFailure(result?.error?.code ?? "unexpected");
        return;
      }

      // Upload the portrait now that the memorial exists. A failure here must
      // not block the family from reaching their new page — they can add the
      // photo later from the manage page — so we swallow it and redirect.
      if (portraitFile && result?.data?.memorialId) {
        try {
          await uploadPortrait(result.data.memorialId, portraitFile);
        } catch {
          /* portrait can be added later; do not block the redirect */
        }
      }

      router.push(`/${props.locale}/memorials/${result.data.slug}`);
    } catch {
      setFailure("DEPENDENCY_UNAVAILABLE");
    } finally {
      setSending(false);
    }
  }

  function errorFor(field: string): string | null {
    return fieldErrors[field]?.[0] ?? null;
  }

  const relativeCounts = relativeUsedCounts();

  return (
    <form className="createForm" onSubmit={submit} noValidate>
      {/* ── Platform steward (admins only) ── */}
      {props.isAdmin ? (
        <fieldset className="formSection stewardSection">
          <label className="checkboxRow">
            <input
              type="checkbox"
              checked={asSteward}
              onChange={(e) => setAsSteward(e.target.checked)}
            />
            <span>{t("stewardCreateToggle")}</span>
          </label>
          {asSteward ? (
            <p className="fieldHelp">{t("stewardCreateHelp")}</p>
          ) : null}
        </fieldset>
      ) : null}

      {/* ── Relationship ── */}
      <fieldset className="formSection" hidden={steward}>
        <legend className="eyebrow">
          {t("relationshipPrompt", {
            relationship: relationship
              ? t(`relationship_${relationship}`)
              : "…",
          })}
        </legend>
        <div className="relationshipGrid">
          {RELATIONSHIPS.map((option) => (
            <button
              type="button"
              key={option}
              className={
                relationship === option
                  ? "button buttonPrimary buttonCompact"
                  : "button buttonQuiet buttonCompact"
              }
              aria-pressed={relationship === option}
              onClick={() => setRelationship(option)}
            >
              {t(`relationship_${option}`)}
            </button>
          ))}
        </div>
        {errorFor("relationship") ? (
          <p className="fieldError" role="alert">
            {errorFor("relationship")}
          </p>
        ) : null}
      </fieldset>

      {/* ── Name ── */}
      <fieldset className="formSection measure">
        {/* The name and the other names it was known by belong together, so
            they sit on one row rather than stacking down the page. */}
        <div className="nameRow">
          <label className="field">
            <span className="fieldLabel">
              {t("nameLabel")} <span aria-hidden="true">*</span>
            </span>
            <input
              className="input inputLarge"
              type="text"
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="aliasStack">
            {aliases.map((alias, i) => (
              <div className="aliasRow" key={i}>
                <label className="field aliasName">
                  {i === 0 ? (
                    <span className="fieldLabel">{t("aliasesLabel")}</span>
                  ) : null}
                  <input
                    className="input inputLarge"
                    type="text"
                    maxLength={200}
                    aria-label={t("aliasNameLabel")}
                    value={alias.value}
                    onChange={(e) => updateAlias(i, { value: e.target.value })}
                  />
                </label>
                <label className="field aliasType">
                  {i === 0 ? (
                    <span className="fieldLabel">{t("aliasTypeLabel")}</span>
                  ) : null}
                  <select
                    className="input"
                    aria-label={t("aliasTypeLabel")}
                    value={alias.type}
                    onChange={(e) =>
                      updateAlias(i, { type: e.target.value as NameType })
                    }
                  >
                    {NAME_TYPES.map((nt) => (
                      <option value={nt} key={nt}>
                        {t(`nameType_${nt}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="button buttonQuiet buttonCompact aliasRemove"
                  onClick={() => removeAlias(i)}
                  aria-label={common("remove")}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="linkButton" onClick={addAlias}>
              + {t("addAlias")}
            </button>
          </div>
        </div>

        {errorFor("primaryName") ? (
          <p className="fieldError" role="alert">
            {errorFor("primaryName")}
          </p>
        ) : null}

        <div className="portraitField">
          <div className="portraitPreview" aria-hidden={!portraitPreview}>
            {portraitPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={portraitPreview} alt="" />
            ) : (
              <span className="portraitPlaceholder" aria-hidden="true">
                ☖
              </span>
            )}
          </div>
          <div className="portraitControls">
            <span className="fieldLabel">{t("portraitLabel")}</span>
            <p className="muted portraitHint">{t("portraitHint")}</p>
            <div className="portraitButtons">
              <label className="button buttonQuiet buttonCompact">
                {t("addPhoto")}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    pickPortrait(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
              {portraitPreview ? (
                <button
                  type="button"
                  className="linkButton"
                  onClick={() => pickPortrait(null)}
                >
                  {common("remove")}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <DuplicateWarning
          locale={props.locale}
          name={name}
          birthDate={partsToDate(birth)?.value ?? null}
          deathDate={partsToDate(death)?.value ?? null}
        />
      </fieldset>

      {/* Birth and death are a pair, so they sit side by side rather than
          stacking two near-identical blocks down the page. */}
      <div className="pairRow">
      {/* ── Birth info ── */}
      <fieldset className="formSection">
        <legend className="eyebrow">{t("birthInfoLabel")}</legend>
        {/*
         * Year is required to record a birth date at all; month and day may each
         * be left "not sure".
         */}
        <div className="lifelineRow">
          <DateFields
            parts={birth}
            onChange={setBirth}
            yearLabel={t("yearLabel")}
            monthLabel={t("monthLabel")}
            dayLabel={t("dayLabel")}
            emptyLabel={t("dateUnclear")}
            yearPlaceholder="1931"
          />
          <label className="field fieldCountry">
            <span className="fieldLabel">{t("countryLabel")}</span>
            <select
              className="input"
              value={birthCountry}
              onChange={(e) => {
                setBirthCountry(e.target.value);
                setBirthRegion("");
              }}
            >
              <option value="">—</option>
              {countries.map((c) => (
                <option value={c.code} key={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <RegionField
            label={t("regionLabel")}
            country={birthCountry}
            value={birthRegion}
            onChange={setBirthRegion}
          />
        </div>
      </fieldset>

      {/* ── Death info ── */}
      <fieldset className="formSection">
        <legend className="eyebrow">{t("deathInfoLabel")}</legend>
        {/* Same year/month/day fields as birth, but a death is usually known
            precisely — the empty month/day option is a neutral dash, not "not
            sure". */}
        <div className="lifelineRow">
          <DateFields
            parts={death}
            onChange={setDeath}
            yearLabel={t("yearLabel")}
            monthLabel={t("monthLabel")}
            dayLabel={t("dayLabel")}
            emptyLabel="—"
            yearPlaceholder="2024"
          />
          <label className="field fieldCountry">
            <span className="fieldLabel">{t("countryLabel")}</span>
            <select
              className="input"
              value={deathCountry}
              onChange={(e) => {
                setDeathCountry(e.target.value);
                setDeathRegion("");
              }}
            >
              <option value="">—</option>
              {countries.map((c) => (
                <option value={c.code} key={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <RegionField
            label={t("regionLabel")}
            country={deathCountry}
            value={deathRegion}
            onChange={setDeathRegion}
          />
        </div>
        {errorFor("deathDate") ? (
          <p className="fieldError" role="alert">
            {errorFor("deathDate")}
          </p>
        ) : null}
      </fieldset>
      </div>

      {/* ── Personal info ── */}
      <fieldset className="formSection">
        <legend className="eyebrow">{t("personalInfoLabel")}</legend>
        <div className="personalInfoGrid">
          <label className="field">
            <span className="fieldLabel">{t("ancestralHometownLabel")}</span>
            <input
              className="input"
              type="text"
              maxLength={200}
              value={ancestralHometown}
              onChange={(e) => setAncestralHometown(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="fieldLabel">{t("faithLabel")}</span>
            <select
              className="input"
              value={faith}
              onChange={(e) => setFaith(e.target.value)}
            >
              <option value="">—</option>
              {FAITH_OPTIONS.map((f) => (
                <option value={f} key={f}>
                  {t(`faith_${f}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="fieldLabel">{t("causeOfDeathLabel")}</span>
            <select
              className="input"
              value={causeOfDeath}
              onChange={(e) => setCauseOfDeath(e.target.value)}
            >
              <option value="">—</option>
              {CAUSE_OPTIONS.map((c) => (
                <option value={c} key={c}>
                  {t(`cause_${c}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      {/* ── Family members ── */}
      <fieldset className="formSection">
        <legend className="eyebrow">{t("relativesLabel")}</legend>

        {relatives.length > 0 ? (
          <div className="relativesTable">
            <div className="relativesHead" aria-hidden="true">
              <span>{t("relativeRelationLabel")}</span>
              <span>{t("relativeNameLabel")}</span>
              <span>{t("relativeStatusLabel")}</span>
              <span>{t("showFullNameShort")}</span>
              <span>{t("displayPreview")}</span>
              <span />
            </div>
            {relatives.map((rel, i) => {
              const shown = showAllNames || rel.showFullName;
              return (
                <div className="relativeRow" key={i}>
                  <select
                    className="input inputSm"
                    aria-label={t("relativeRelationLabel")}
                    value={rel.relationshipToDeceased}
                    onChange={(e) =>
                      updateRelative(i, {
                        relationshipToDeceased: e.target.value,
                      })
                    }
                  >
                    {RELATIVE_RELATIONSHIPS.map((rr) => (
                      <option
                        value={rr}
                        key={rr}
                        disabled={
                          rr !== rel.relationshipToDeceased &&
                          isRelMaxedOut(rr, relativeCounts)
                        }
                      >
                        {t(`relativeRole_${rr}`)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input inputSm"
                    type="text"
                    maxLength={200}
                    aria-label={t("relativeNameLabel")}
                    placeholder={t("relativeNameLabel")}
                    value={rel.name}
                    onChange={(e) =>
                      updateRelative(i, { name: e.target.value })
                    }
                  />
                  <select
                    className="input inputSm"
                    aria-label={t("relativeStatusLabel")}
                    value={rel.isDeceased ? "deceased" : "living"}
                    onChange={(e) =>
                      updateRelative(i, {
                        isDeceased: e.target.value === "deceased",
                      })
                    }
                  >
                    <option value="living">{t("statusLiving")}</option>
                    <option value="deceased">{t("statusDeceased")}</option>
                  </select>
                  <label className="relativeShow">
                    <input
                      type="checkbox"
                      aria-label={t("showFullNameShort")}
                      checked={shown}
                      disabled={showAllNames}
                      onChange={(e) =>
                        updateRelative(i, { showFullName: e.target.checked })
                      }
                    />
                  </label>
                  <span className="relativePreviewName">
                    {rel.name
                      ? shown
                        ? rel.name
                        : desensitizeName(rel.name)
                      : "—"}
                  </span>
                  <button
                    type="button"
                    className="button buttonQuiet rowRemove"
                    onClick={() => removeRelative(i)}
                    aria-label={common("remove")}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="relativesActions">
          <button type="button" className="linkButton" onClick={addRelative}>
            + {t("addRelative")}
          </button>
          {relatives.length > 0 ? (
            <label className="choiceRow">
              <input
                type="checkbox"
                checked={showAllNames}
                onChange={(e) => setShowAllNames(e.target.checked)}
              />
              <span>{t("showAllNames")}</span>
            </label>
          ) : null}
        </div>
      </fieldset>

      {/* ── Co-create ── */}
      <fieldset className="formSection measure">
        <legend className="eyebrow">{t("coCreateLabel")}</legend>
        <label className="choiceRow">
          <input
            type="checkbox"
            checked={coCreate}
            onChange={(e) => {
              setCoCreate(e.target.checked);
              if (!e.target.checked) setCoCreators([]);
            }}
          />
          <span>{t("coCreateToggle")}</span>
        </label>
        {coCreate ? (
          <>
            <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
              {t("coCreateHelp")}
            </p>
            {coCreators.length > 0 ? (
              <div className="relativesTable">
                <div className="coCreatorHead" aria-hidden="true">
                  <span>{t("relativeRelationLabel")}</span>
                  <span>{t("relativeNameLabel")}</span>
                  <span />
                </div>
                {coCreators.map((co, i) => (
                  <div className="coCreatorRow" key={i}>
                    <select
                      className="input inputSm"
                      aria-label={t("relativeRelationLabel")}
                      value={co.relationshipToDeceased}
                      onChange={(e) =>
                        updateCoCreator(i, {
                          relationshipToDeceased: e.target.value,
                        })
                      }
                    >
                      <option value="">—</option>
                      {RELATIVE_RELATIONSHIPS.map((rr) => (
                        <option value={rr} key={rr}>
                          {t(`relativeRole_${rr}`)}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input inputSm"
                      type="text"
                      maxLength={200}
                      aria-label={t("relativeNameLabel")}
                      placeholder={t("relativeNameLabel")}
                      value={co.name}
                      onChange={(e) =>
                        updateCoCreator(i, { name: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="button buttonQuiet rowRemove"
                      onClick={() => removeCoCreator(i)}
                      aria-label={common("remove")}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <button type="button" className="linkButton" onClick={addCoCreator}>
              + {t("addCoCreator")}
            </button>
          </>
        ) : null}
      </fieldset>

      {/* ── Privacy ── */}
      <fieldset className="formSection measure">
        <legend className="eyebrow">{privacy("title")}</legend>

        {(
          [
            ["public", privacy("public"), privacy("publicHelp")],
            ["unlisted", privacy("unlisted"), privacy("unlistedHelp")],
            ["invite_only", privacy("inviteOnly"), privacy("inviteOnlyHelp")],
          ] as const
        ).map(([value, label, help]) => (
          <label className="choiceRow" key={value}>
            <input
              type="radio"
              name="visibility"
              checked={visibility === value}
              onChange={() => setVisibility(value)}
            />
            <span>
              <strong>{label}</strong>
              <span className="muted"> — {help}</span>
            </span>
          </label>
        ))}

        {visibility === "public" ? (
          <>
            <label className="choiceRow">
              <input
                type="checkbox"
                checked={indexable}
                onChange={(e) => setIndexable(e.target.checked)}
              />
              <span>{privacy("searchEngineLabel")}</span>
            </label>
            <div className="notice noticeCompact">
              <p>
                <strong>{privacy("confirmPublicTitle")}</strong>{" "}
                {privacy("confirmPublicBody")}
              </p>
              <label className="choiceRow">
                <input
                  type="checkbox"
                  checked={publicAcknowledged}
                  onChange={(e) => setPublicAcknowledged(e.target.checked)}
                />
                <span>{privacy("confirmPublicAcknowledge")}</span>
              </label>
            </div>
          </>
        ) : null}
      </fieldset>

      {/* ── Declaration ── */}
      <fieldset className="formSection measure" hidden={steward}>
        <label className="choiceRow">
          <input
            type="checkbox"
            checked={declared}
            onChange={(e) => setDeclared(e.target.checked)}
          />
          <span>{t("truthDeclaration")}</span>
        </label>
        {errorFor("relationshipStatementAccepted") ? (
          <p className="fieldError" role="alert">
            {errorFor("relationshipStatementAccepted")}
          </p>
        ) : null}
      </fieldset>

      {/* ── Submit ── */}
      <div className="stack">
        <div>
          <button
            className="button buttonPrimary"
            type="submit"
            disabled={!canSubmit}
          >
            {sending ? common("loading") : home("createMemorial")}
          </button>
        </div>

        {!canSubmit && !sending ? (
          <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
            {t("submitHint")}
          </p>
        ) : null}

        {failure ? (
          <p className="fieldError" role="alert">
            {failure === "DUPLICATE_CANDIDATE_FOUND"
              ? t("duplicateWarning")
              : errors.has(failure)
                ? errors(failure)
                : errors("unexpected")}
          </p>
        ) : null}

        {errorFor("_") ? (
          <p className="fieldError" role="alert">
            {errorFor("_")}
          </p>
        ) : null}
      </div>
    </form>
  );
}
