"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/modules/identity/profile";

type Gender = "male" | "female" | "other";

export function AccountPage(props: {
  profile: Profile;
  email: string | null;
  phone: string | null;
  providers: string[];
  createdAt: string;
  locale: string;
}) {
  const t = useTranslations("account");
  const pt = useTranslations("profile");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();

  const [fullName, setFullName] = useState(props.profile.fullName ?? "");
  const [gender, setGender] = useState<string>(props.profile.gender ?? "");
  const [birthDate, setBirthDate] = useState(props.profile.birthDate ?? "");
  const [birthplace, setBirthplace] = useState(props.profile.birthplace ?? "");
  const [nameVisibility, setNameVisibility] = useState<string>(
    props.profile.nameVisibility ?? "",
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<
    "none" | "saved" | "error" | "incomplete"
  >("none");

  const [signingOutAll, setSigningOutAll] = useState(false);
  const [signOutAllDone, setSignOutAllDone] = useState(false);

  const complete =
    fullName.trim().length > 0 && gender.length > 0 && birthDate.length > 0;

  async function saveProfile(): Promise<void> {
    if (savingProfile) return;
    if (!complete) {
      setProfileNotice("incomplete");
      return;
    }
    setSavingProfile(true);
    setProfileNotice("none");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          gender: (gender || null) as Gender | null,
          birthDate: birthDate || null,
          birthplace: birthplace.trim() || null,
          nameVisibility: nameVisibility || null,
        }),
      });
      if (!response.ok) {
        setProfileNotice("error");
        return;
      }
      setProfileNotice("saved");
      router.refresh();
    } catch {
      setProfileNotice("error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function signOutAll(): Promise<void> {
    if (signingOutAll) return;
    setSigningOutAll(true);
    try {
      const response = await fetch("/api/auth/sign-out-all", {
        method: "POST",
      });
      if (response.ok) {
        setSignOutAllDone(true);
        setTimeout(() => {
          router.push(`/${props.locale}/sign-in`);
          router.refresh();
        }, 1500);
      }
    } catch {
      /* best-effort */
    } finally {
      setSigningOutAll(false);
    }
  }

  const joined = props.createdAt
    ? new Date(props.createdAt).toLocaleDateString()
    : "—";

  return (
    <>
      <header className="stack measure">
        <h1>{t("title")}</h1>
      </header>

      {/* ── Account info ── */}
      <section className="accountSection">
        <h2 className="accountSectionTitle">{t("accountInfoTitle")}</h2>
        <div className="accountInfoGrid">
          <div className="accountInfoItem">
            <span className="accountInfoLabel">{t("emailLabel")}</span>
            <span className="accountInfoValue">
              {props.email ?? t("notSet")}
            </span>
          </div>
          {props.phone ? (
            <div className="accountInfoItem">
              <span className="accountInfoLabel">{t("phoneLabel")}</span>
              <span className="accountInfoValue">{props.phone}</span>
            </div>
          ) : null}
          {props.providers.length > 0 ? (
            <div className="accountInfoItem">
              <span className="accountInfoLabel">{t("linkedAccounts")}</span>
              <span className="accountInfoValue">
                {props.providers
                  .map((p) => t(`provider_${p}`))
                  .join("、")}
              </span>
            </div>
          ) : null}
          <div className="accountInfoItem">
            <span className="accountInfoLabel">{t("joinedLabel")}</span>
            <span className="accountInfoValue">{joined}</span>
          </div>
          <div className="accountInfoItem">
            <span className="accountInfoLabel">{t("loginMethodLabel")}</span>
            <span className="accountInfoValue">{t("loginMethodOtp")}</span>
          </div>
        </div>
      </section>

      {/* ── Profile ── */}
      <section className="accountSection">
        <h2 className="accountSectionTitle">{t("profileTitle")}</h2>

        {profileNotice === "saved" ? (
          <p className="notice">{pt("saved")}</p>
        ) : null}
        {profileNotice === "incomplete" ? (
          <p className="fieldError" role="alert">
            {pt("requiredNote")}
          </p>
        ) : null}
        {profileNotice === "error" ? (
          <p className="fieldError" role="alert">
            {errors("unexpected")}
          </p>
        ) : null}

        <div className="accountProfileGrid">
          <label className="field">
            <span className="fieldLabel">{pt("fullNameLabel")} *</span>
            <input
              className="input"
              type="text"
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="fieldLabel">{pt("genderLabel")} *</span>
            <select
              className="input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">{pt("genderChoose")}</option>
              <option value="male">{pt("genderMale")}</option>
              <option value="female">{pt("genderFemale")}</option>
              <option value="other">{pt("genderOther")}</option>
            </select>
          </label>

          <label className="field">
            <span className="fieldLabel">{pt("birthDateLabel")} *</span>
            <input
              className="input"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="fieldLabel">{pt("birthplaceLabel")}</span>
            <input
              className="input"
              type="text"
              maxLength={120}
              value={birthplace}
              onChange={(e) => setBirthplace(e.target.value)}
            />
          </label>
        </div>

        <label className="field measure">
          <span className="fieldLabel">{pt("nameVisibilityLabel")}</span>
          <select
            className="input"
            value={nameVisibility}
            onChange={(e) => setNameVisibility(e.target.value)}
          >
            <option value="">{pt("nameVisibilityDefault")}</option>
            <option value="public">{pt("nameVisibility_public")}</option>
            <option value="family">{pt("nameVisibility_family")}</option>
            <option value="hidden">{pt("nameVisibility_hidden")}</option>
          </select>
          <span className="fieldHint">{pt("nameVisibilityHint")}</span>
        </label>

        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
          {pt("requiredNote")}
        </p>

        <div>
          <button
            type="button"
            className="button buttonPrimary"
            disabled={savingProfile}
            onClick={saveProfile}
          >
            {savingProfile ? common("loading") : common("save")}
          </button>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="accountSection">
        <h2 className="accountSectionTitle">{t("securityTitle")}</h2>

        <div className="stack">
          <div className="accountSecurityRow">
            <div>
              <p className="accountSecurityLabel">{t("signOutAllTitle")}</p>
              <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
                {t("signOutAllHelp")}
              </p>
            </div>
            <button
              type="button"
              className="button buttonQuiet"
              disabled={signingOutAll || signOutAllDone}
              onClick={signOutAll}
            >
              {signOutAllDone
                ? t("signOutAllDone")
                : signingOutAll
                  ? common("loading")
                  : t("signOutAllButton")}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
