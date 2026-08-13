"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type RelativeEntry = {
  /** Stable within this editing session: the DB id for existing rows, a fresh
   *  uuid for rows added here. Used to point a child at its co-parent. */
  rid: string;
  name: string;
  relationshipToDeceased: string;
  isDeceased: boolean;
  showFullName: boolean;
  /** The rid of the spouse this child was born to, if the family said so. */
  coParentRid: string | null;
};

type InitialRelative = {
  id: string;
  name: string;
  relationshipToDeceased: string;
  isDeceased: boolean;
  showFullName: boolean;
  coParentId: string | null;
};

const SPOUSE_TYPES: ReadonlySet<string> = new Set([
  "husband",
  "wife",
  "ex_husband",
  "ex_wife",
]);
const CHILD_TYPES: ReadonlySet<string> = new Set(["son", "daughter"]);

type Notice =
  | { kind: "none" }
  | { kind: "saved" }
  | { kind: "error"; code: string };

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

function desensitizeName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  const chars = [...trimmed];
  if (chars.length === 2) return chars[0] + "*";
  return chars[0] + "*".repeat(chars.length - 2) + chars[chars.length - 1];
}

export function RelativesEditor(props: {
  memorialId: string;
  initial: InitialRelative[];
}) {
  const t = useTranslations("memorial");
  const errors = useTranslations("errors");
  const common = useTranslations("common");

  const [relatives, setRelatives] = useState<RelativeEntry[]>(() =>
    props.initial.map((r) => ({
      rid: r.id,
      name: r.name,
      relationshipToDeceased: r.relationshipToDeceased,
      isDeceased: r.isDeceased,
      showFullName: r.showFullName,
      coParentRid: r.coParentId,
    })),
  );
  const [showAllNames, setShowAllNames] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>({ kind: "none" });

  function usedCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const r of relatives) {
      counts.set(
        r.relationshipToDeceased,
        (counts.get(r.relationshipToDeceased) ?? 0) + 1,
      );
    }
    return counts;
  }

  function isMaxedOut(rel: string, counts: Map<string, number>): boolean {
    return MAX_ONE.has(rel) && (counts.get(rel) ?? 0) >= 1;
  }

  function firstAvailableRelationship(): string {
    const counts = usedCounts();
    for (const rr of RELATIVE_RELATIONSHIPS) {
      if (!isMaxedOut(rr, counts)) return rr;
    }
    return RELATIVE_RELATIONSHIPS[0];
  }

  function addRelative(): void {
    setRelatives([
      ...relatives,
      {
        rid: crypto.randomUUID(),
        name: "",
        relationshipToDeceased: firstAvailableRelationship(),
        isDeceased: false,
        showFullName: false,
        coParentRid: null,
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
        // A co-parent only means something for a child.
        if (
          "relationshipToDeceased" in patch &&
          !CHILD_TYPES.has(updated.relationshipToDeceased)
        ) {
          updated.coParentRid = null;
        }
        return updated;
      }),
    );
  }

  /** Spouse rows a child can be attributed to, by rid. */
  function spouseOptions(): { rid: string; label: string }[] {
    return relatives
      .filter(
        (r) => SPOUSE_TYPES.has(r.relationshipToDeceased) && r.name.trim().length > 0,
      )
      .map((r) => ({
        rid: r.rid,
        label: `${t(`relativeRole_${r.relationshipToDeceased}`)} · ${r.name.trim()}`,
      }));
  }

  function removeRelative(idx: number): void {
    setRelatives(relatives.filter((_, i) => i !== idx));
  }

  /** Reorders a row; the saved order is what sets the children's order. */
  function move(idx: number, dir: -1 | 1): void {
    const to = idx + dir;
    if (to < 0 || to >= relatives.length) return;
    const next = [...relatives];
    const a = next[idx];
    const b = next[to];
    if (!a || !b) return;
    next[idx] = b;
    next[to] = a;
    setRelatives(next);
  }

  async function save(): Promise<void> {
    setSaving(true);
    setNotice({ kind: "none" });

    const kept = relatives.filter((r) => r.name.trim().length > 0);
    const indexByRid = new Map(kept.map((r, i) => [r.rid, i]));
    const validRelatives = kept.map((r) => {
      const coParentIndex =
        CHILD_TYPES.has(r.relationshipToDeceased) && r.coParentRid
          ? indexByRid.get(r.coParentRid)
          : undefined;
      return {
        name: r.name.trim(),
        relationshipToDeceased: r.relationshipToDeceased,
        isDeceased: r.isDeceased,
        showFullName: showAllNames || r.showFullName,
        ...(coParentIndex !== undefined ? { coParentIndex } : {}),
      };
    });

    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/relatives`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ relatives: validRelatives }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { code?: string };
        } | null;
        setNotice({
          kind: "error",
          code: payload?.error?.code ?? "unexpected",
        });
        return;
      }

      setNotice({ kind: "saved" });
    } catch {
      setNotice({ kind: "error", code: "DEPENDENCY_UNAVAILABLE" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="stack measure">
      <h2>{t("relativesLabel")}</h2>
      <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
        {t("relativesHelp")}
      </p>

      {notice.kind === "saved" ? (
        <p className="notice">{t("relativesSaved")}</p>
      ) : null}
      {notice.kind === "error" ? (
        <p className="fieldError" role="alert">
          {errors.has(notice.code) ? errors(notice.code) : errors("unexpected")}
        </p>
      ) : null}

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
            const counts = usedCounts();
            const shown = showAllNames || rel.showFullName;
            const spouses = spouseOptions().filter((s) => s.rid !== rel.rid);
            // Only worth asking when there's a real choice of parent — a
            // current spouse and an ex, say. One spouse and it's not a question.
            const showCoParent =
              CHILD_TYPES.has(rel.relationshipToDeceased) && spouses.length >= 2;
            return (
              <div className="relativeEntry" key={rel.rid}>
              <div className="relativeRow">
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
                        isMaxedOut(rr, counts)
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
                  onChange={(e) => updateRelative(i, { name: e.target.value })}
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
                <div className="rowActions">
                  <button
                    type="button"
                    className="button buttonQuiet rowMove"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={t("moveUp")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="button buttonQuiet rowMove"
                    onClick={() => move(i, 1)}
                    disabled={i === relatives.length - 1}
                    aria-label={t("moveDown")}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="button buttonQuiet rowRemove"
                    onClick={() => removeRelative(i)}
                    aria-label={common("remove")}
                  >
                    ×
                  </button>
                </div>
              </div>
              {showCoParent ? (
                <div className="relativeCoParentRow">
                  <label className="relativeCoParent">
                    <span className="relativeCoParentLabel">
                      {t("relativeCoParentLabel")}
                    </span>
                    <select
                      className="input inputSm"
                      value={rel.coParentRid ?? ""}
                      onChange={(e) =>
                        updateRelative(i, {
                          coParentRid: e.target.value || null,
                        })
                      }
                    >
                      <option value="">{t("relativeCoParentNone")}</option>
                      {spouses.map((s) => (
                        <option value={s.rid} key={s.rid}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
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

      <div>
        <button
          type="button"
          className="button buttonPrimary"
          disabled={saving}
          onClick={save}
        >
          {saving ? common("loading") : t("saveRelatives")}
        </button>
      </div>
    </section>
  );
}
