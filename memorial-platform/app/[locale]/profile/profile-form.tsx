"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/modules/identity/profile";

type Gender = "male" | "female" | "other";

export function ProfileForm(props: { initial: Profile; next: string | null }) {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();

  const [fullName, setFullName] = useState(props.initial.fullName ?? "");
  const [gender, setGender] = useState<string>(props.initial.gender ?? "");
  const [birthDate, setBirthDate] = useState(props.initial.birthDate ?? "");
  const [region, setRegion] = useState(props.initial.region ?? "");
  const [nameVisibility, setNameVisibility] = useState<string>(
    props.initial.nameVisibility ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<"none" | "saved" | "error" | "incomplete">(
    "none",
  );

  const complete =
    fullName.trim().length > 0 && gender.length > 0 && birthDate.length > 0;

  async function save(): Promise<void> {
    if (saving) return;
    if (!complete) {
      setNotice("incomplete");
      return;
    }
    setSaving(true);
    setNotice("none");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          gender: (gender || null) as Gender | null,
          birthDate: birthDate || null,
          region: region.trim() || null,
          nameVisibility: nameVisibility || null,
        }),
      });
      if (!response.ok) {
        setNotice("error");
        return;
      }
      setNotice("saved");
      if (props.next) {
        router.push(props.next);
        return;
      }
      router.refresh();
    } catch {
      setNotice("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack measure">
      {notice === "saved" ? <p className="notice">{t("saved")}</p> : null}
      {notice === "incomplete" ? (
        <p className="fieldError" role="alert">
          {t("requiredNote")}
        </p>
      ) : null}
      {notice === "error" ? (
        <p className="fieldError" role="alert">
          {errors("unexpected")}
        </p>
      ) : null}

      <label className="field">
        <span className="fieldLabel">{t("fullNameLabel")} *</span>
        <input
          className="input"
          type="text"
          maxLength={120}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="fieldLabel">{t("genderLabel")} *</span>
        <select
          className="input"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">{t("genderChoose")}</option>
          <option value="male">{t("genderMale")}</option>
          <option value="female">{t("genderFemale")}</option>
          <option value="other">{t("genderOther")}</option>
        </select>
      </label>

      <label className="field">
        <span className="fieldLabel">{t("birthDateLabel")} *</span>
        <input
          className="input"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="fieldLabel">{t("regionLabel")}</span>
        <input
          className="input"
          type="text"
          maxLength={120}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="fieldLabel">{t("nameVisibilityLabel")}</span>
        <select
          className="input"
          value={nameVisibility}
          onChange={(e) => setNameVisibility(e.target.value)}
        >
          <option value="">{t("nameVisibilityDefault")}</option>
          <option value="public">{t("nameVisibility_public")}</option>
          <option value="family">{t("nameVisibility_family")}</option>
          <option value="hidden">{t("nameVisibility_hidden")}</option>
        </select>
        <span className="fieldHint">{t("nameVisibilityHint")}</span>
      </label>

      <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
        {t("requiredNote")}
      </p>

      <div>
        <button
          type="button"
          className="button buttonPrimary"
          disabled={saving}
          onClick={save}
        >
          {saving ? common("loading") : t("save")}
        </button>
      </div>
    </div>
  );
}
