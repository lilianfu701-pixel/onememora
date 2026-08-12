"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Relation = "parent" | "spouse" | "child";
type LinkedItem = {
  linkId: string;
  relation: Relation;
  name: string;
  slug: string;
};
type OtherMemorial = { id: string; name: string };

export function FamilyEditor(props: {
  memorialId: string;
  locale: string;
  initial: LinkedItem[];
  others: OtherMemorial[];
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();

  const [otherId, setOtherId] = useState("");
  const [relation, setRelation] = useState<Relation>("parent");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function relLabel(value: Relation): string {
    if (value === "spouse") return t("familyRelationSpouse");
    if (value === "child") return t("familyRelationChild");
    return t("familyRelationParent");
  }

  async function add(): Promise<void> {
    if (!otherId || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/family/link`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ otherMemorialId: otherId, relation }),
        },
      );
      if (!response.ok) {
        setFailed(true);
        return;
      }
      setOtherId("");
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  async function remove(linkId: string): Promise<void> {
    if (removingId) return;
    setRemovingId(linkId);
    setFailed(false);
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/family/link?linkId=${encodeURIComponent(linkId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        setFailed(true);
        return;
      }
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="stack measure">
      <h2>{t("familyHeading")}</h2>
      <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
        {t("familyHelp")}
      </p>

      {props.initial.length > 0 ? (
        <>
          <h3 className="eyebrow">{t("familyLinkedHeading")}</h3>
          <ul className="familyLinkList">
            {props.initial.map((item) => (
              <li key={item.linkId}>
                <span className="familyLinkRel">{relLabel(item.relation)}</span>
                <Link href={`/${props.locale}/memorials/${item.slug}`}>
                  {item.name} →
                </Link>
                <button
                  type="button"
                  className="familyLinkRemove"
                  disabled={removingId === item.linkId}
                  onClick={() => remove(item.linkId)}
                >
                  {removingId === item.linkId
                    ? common("loading")
                    : t("familyRemoveLink")}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {props.others.length === 0 ? (
        <p className="muted">{t("familyNoOthers")}</p>
      ) : (
        <div className="familyAddRow">
          <select
            className="input"
            value={otherId}
            onChange={(e) => setOtherId(e.target.value)}
          >
            <option value="">{t("familyPickMemorial")}</option>
            {props.others.map((other) => (
              <option value={other.id} key={other.id}>
                {other.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={relation}
            onChange={(e) => setRelation(e.target.value as Relation)}
          >
            <option value="parent">{t("familyRelationParent")}</option>
            <option value="spouse">{t("familyRelationSpouse")}</option>
            <option value="child">{t("familyRelationChild")}</option>
          </select>
          <button
            type="button"
            className="button buttonPrimary buttonCompact"
            disabled={saving || !otherId}
            onClick={add}
          >
            {saving ? common("loading") : t("familyAddLink")}
          </button>
        </div>
      )}

      {failed ? (
        <p className="fieldError" role="alert">
          {errors("unexpected")}
        </p>
      ) : null}
    </section>
  );
}
