"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

/** The relationships eligible to create a memorial (mirrors the server list). */
const RELATIONSHIPS = [
  "husband",
  "wife",
  "father",
  "mother",
  "son",
  "daughter",
  "paternal_grandfather",
  "paternal_grandmother",
  "maternal_grandfather",
  "maternal_grandmother",
] as const;

type ExistingMemorial = {
  id: string;
  slug: string;
  name: string;
  obituary: {
    body: string | null;
    nativePlace: string | null;
    service: string | null;
    survivors: string | null;
  } | null;
};

export function ObituaryNewForm(props: {
  locale: string;
  memorials: ExistingMemorial[];
  preselectSlug?: string;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();

  const preselected = props.preselectSlug
    ? props.memorials.find((m) => m.slug === props.preselectSlug)
    : undefined;

  const [mode, setMode] = useState<"new" | "existing">(
    preselected ? "existing" : "new",
  );

  // New-memorial fields.
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [declared, setDeclared] = useState(false);

  // Existing-memorial selection.
  const [selectedId, setSelectedId] = useState(preselected?.id ?? "");

  // Obituary content, pre-filled from the selected memorial when there is one.
  const initialObit = preselected?.obituary;
  const [body, setBody] = useState(initialObit?.body ?? "");
  const [nativePlace, setNativePlace] = useState(initialObit?.nativePlace ?? "");
  const [service, setService] = useState(initialObit?.service ?? "");
  const [survivors, setSurvivors] = useState(initialObit?.survivors ?? "");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptKey = useRef<string>(crypto.randomUUID());

  const byId = useMemo(
    () => new Map(props.memorials.map((m) => [m.id, m])),
    [props.memorials],
  );

  function selectExisting(id: string): void {
    setSelectedId(id);
    const m = byId.get(id);
    const o = m?.obituary;
    setBody(o?.body ?? "");
    setNativePlace(o?.nativePlace ?? "");
    setService(o?.service ?? "");
    setSurvivors(o?.survivors ?? "");
  }

  function partialDate(value: string): { value: string; precision: "day" } | null {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? { value, precision: "day" } : null;
  }

  async function publishObituary(memorialId: string): Promise<boolean> {
    const res = await fetch(`/api/memorials/${memorialId}/obituary`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        body: body.trim(),
        nativePlace: nativePlace.trim() || undefined,
        service: service.trim() || undefined,
        survivors: survivors.trim() || undefined,
        publish: true,
      }),
    });
    return res.ok;
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (sending) return;
    setError(null);

    if (body.trim().length === 0) {
      setError(t("obituaryNeedsBody"));
      return;
    }

    setSending(true);
    try {
      if (mode === "existing") {
        const m = byId.get(selectedId);
        if (!m) {
          setError(t("obituaryPickMemorialFirst"));
          return;
        }
        const ok = await publishObituary(m.id);
        if (!ok) {
          setError(t("obituaryPublishFailed"));
          return;
        }
        router.push(`/${props.locale}/memorials/${m.slug}/obituary`);
        return;
      }

      // New memorial: create it, then publish the obituary on it.
      if (name.trim().length === 0) {
        setError(t("obituaryNeedsName"));
        return;
      }
      if (!relationship) {
        setError(t("obituaryNeedsRelationship"));
        return;
      }
      if (!declared) {
        setError(t("obituaryNeedsDeclaration"));
        return;
      }

      const birth = partialDate(birthDate);
      const death = partialDate(deathDate);
      const createRes = await fetch("/api/memorials", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": attemptKey.current,
        },
        body: JSON.stringify({
          relationship,
          relationshipStatementAccepted: true,
          primaryName: { value: name.trim() },
          ...(birth ? { birthDate: birth } : {}),
          ...(death ? { deathDate: death } : {}),
        }),
      });
      const created = await createRes.json().catch(() => null);
      if (!createRes.ok || !created?.data?.memorialId) {
        setError(t("obituaryPublishFailed"));
        return;
      }

      const ok = await publishObituary(created.data.memorialId);
      if (!ok) {
        // The memorial exists; the family can still finish it. Send them there.
        router.push(`/${props.locale}/memorials/${created.data.slug}`);
        return;
      }
      router.push(`/${props.locale}/memorials/${created.data.slug}/obituary`);
    } catch {
      setError(t("obituaryPublishFailed"));
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="stack measure" onSubmit={submit}>
      <div className="obituaryModeTabs" role="tablist" aria-label={t("obituaryPublishTitle")}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "new"}
          className={`obituaryModeTab${mode === "new" ? " obituaryModeTabActive" : ""}`}
          onClick={() => setMode("new")}
        >
          {t("obituaryModeNew")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "existing"}
          className={`obituaryModeTab${mode === "existing" ? " obituaryModeTabActive" : ""}`}
          onClick={() => setMode("existing")}
          disabled={props.memorials.length === 0}
        >
          {t("obituaryModeExisting")}
        </button>
      </div>

      {mode === "new" ? (
        <>
          <label className="field">
            <span className="fieldLabel">
              {t("nameLabel")} <span aria-hidden="true">*</span>
            </span>
            <input
              className="input inputLarge"
              type="text"
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="fieldLabel">
              {t("relationshipLabel")} <span aria-hidden="true">*</span>
            </span>
            <select
              className="input"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              <option value="">—</option>
              {RELATIONSHIPS.map((r) => (
                <option value={r} key={r}>
                  {t(`relationship_${r}`)}
                </option>
              ))}
            </select>
          </label>

          <div className="pairRow">
            <label className="field">
              <span className="fieldLabel">{t("birthDateLabel")}</span>
              <input
                className="input"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="fieldLabel">{t("deathDateLabel")}</span>
              <input
                className="input"
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
              />
            </label>
          </div>
        </>
      ) : (
        <label className="field">
          <span className="fieldLabel">
            {t("obituaryPickMemorial")} <span aria-hidden="true">*</span>
          </span>
          {props.memorials.length === 0 ? (
            <p className="muted">{t("obituaryNoMemorials")}</p>
          ) : (
            <select
              className="input"
              value={selectedId}
              onChange={(e) => selectExisting(e.target.value)}
            >
              <option value="">—</option>
              {props.memorials.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.name || m.slug}
                </option>
              ))}
            </select>
          )}
        </label>
      )}

      <label className="field">
        <span className="fieldLabel">
          {t("obituaryBodyLabel")} <span aria-hidden="true">*</span>
        </span>
        <textarea
          className="input"
          rows={8}
          maxLength={4000}
          placeholder={t("obituaryBodyPlaceholder")}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="fieldLabel">{t("obituaryNativePlaceLabel")}</span>
        <input
          className="input"
          type="text"
          maxLength={120}
          value={nativePlace}
          onChange={(e) => setNativePlace(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="fieldLabel">{t("obituaryServiceLabel")}</span>
        <textarea
          className="input"
          rows={2}
          maxLength={600}
          placeholder={t("obituaryServicePlaceholder")}
          value={service}
          onChange={(e) => setService(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="fieldLabel">{t("obituarySurvivorsLabel")}</span>
        <input
          className="input"
          type="text"
          maxLength={400}
          placeholder={t("obituarySurvivorsPlaceholder")}
          value={survivors}
          onChange={(e) => setSurvivors(e.target.value)}
        />
      </label>

      {mode === "new" ? (
        <label className="choiceRow">
          <input
            type="checkbox"
            checked={declared}
            onChange={(e) => setDeclared(e.target.checked)}
          />
          <span>{t("truthDeclaration")}</span>
        </label>
      ) : null}

      {error ? (
        <p className="fieldError" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          className="button buttonPrimary"
          disabled={sending}
        >
          {sending
            ? common("loading")
            : mode === "new"
              ? t("obituaryPublishNew")
              : t("obituaryPublish")}
        </button>
      </div>
    </form>
  );
}
