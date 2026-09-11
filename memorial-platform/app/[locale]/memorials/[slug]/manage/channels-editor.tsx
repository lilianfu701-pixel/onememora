"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CHINESE_CHANNELS = ["zh-CN", "zh-TW", "zh-HK"] as const;
type ChineseChannel = (typeof CHINESE_CHANNELS)[number];

/**
 * Where a memorial is shown: which channels (简体/台湾/香港, plus its own
 * non-Chinese channel) list it, and whether it is featured on their homepages
 * for the month after publishing. Owner/admin only.
 *
 * The editor manages the three Chinese channels as checkboxes; any non-Chinese
 * channel the memorial already belongs to (its creation locale) is preserved
 * untouched, so an English page keeps its English homepage.
 */
export function ChannelsEditor(props: {
  memorialId: string;
  initialRegions: string[];
  initialHomepageDisplay: boolean;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();

  const nonChinese = props.initialRegions.filter(
    (r) => !(CHINESE_CHANNELS as readonly string[]).includes(r),
  );

  const [homepageDisplay, setHomepageDisplay] = useState(
    props.initialHomepageDisplay,
  );
  const [channels, setChannels] = useState<Set<string>>(
    () =>
      new Set(
        props.initialRegions.filter((r) =>
          (CHINESE_CHANNELS as readonly string[]).includes(r),
        ),
      ),
  );
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [saved, setSaved] = useState({
    homepageDisplay: props.initialHomepageDisplay,
    channels: props.initialRegions
      .filter((r) => (CHINESE_CHANNELS as readonly string[]).includes(r))
      .sort()
      .join(","),
  });

  const channelsKey = [...channels].sort().join(",");
  const dirty =
    homepageDisplay !== saved.homepageDisplay ||
    channelsKey !== saved.channels;

  function toggle(channel: ChineseChannel): void {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  }

  async function save(): Promise<void> {
    if (state === "saving" || !dirty) return;
    setState("saving");
    // Preserve the non-Chinese home channel; replace the Chinese set.
    const regions = [...nonChinese, ...channels];
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/channels`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ regions, homepageDisplay }),
        },
      );
      if (res.ok) {
        setSaved({ homepageDisplay, channels: channelsKey });
        setState("saved");
        router.refresh();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="stack">
      <h2>{t("channelsHeading")}</h2>

      <label className="choiceRow">
        <input
          type="checkbox"
          checked={homepageDisplay}
          onChange={(e) => setHomepageDisplay(e.target.checked)}
        />
        <span>
          <strong>{t("homepageDisplayLabel")}</strong>
          <span className="muted"> — {t("homepageDisplayHint")}</span>
        </span>
      </label>

      <div className="field">
        <span className="fieldLabel">{t("channelsLabel")}</span>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <label className="choiceRow">
            <input
              type="checkbox"
              checked={channels.has("zh-CN")}
              onChange={() => toggle("zh-CN")}
            />
            <span>{t("channelCn")}</span>
          </label>
          <label className="choiceRow">
            <input
              type="checkbox"
              checked={channels.has("zh-TW")}
              onChange={() => toggle("zh-TW")}
            />
            <span>{t("channelTw")}</span>
          </label>
          <label className="choiceRow">
            <input
              type="checkbox"
              checked={channels.has("zh-HK")}
              onChange={() => toggle("zh-HK")}
            />
            <span>{t("channelHk")}</span>
          </label>
        </div>
      </div>

      <div className="adminHeadRow">
        <button
          type="button"
          className="button buttonPrimary buttonCompact"
          onClick={save}
          disabled={state === "saving" || !dirty}
        >
          {state === "saving" ? common("loading") : common("save")}
        </button>
        {state === "saved" && !dirty ? (
          <span className="muted">{t("dispositionSaved")}</span>
        ) : null}
        {state === "error" ? (
          <span className="fieldError">{t("obituaryPublishFailed")}</span>
        ) : null}
      </div>
    </div>
  );
}
