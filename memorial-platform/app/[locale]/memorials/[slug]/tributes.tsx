"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type TributeType = "candle" | "flower";

export function Tributes(props: {
  memorialId: string;
  candle: number;
  flower: number;
}) {
  const t = useTranslations("memorial");
  const [candle, setCandle] = useState(props.candle);
  const [flower, setFlower] = useState(props.flower);
  const [done, setDone] = useState<Record<TributeType, boolean>>({
    candle: false,
    flower: false,
  });
  const [busy, setBusy] = useState<TributeType | null>(null);

  // One candle and one flower per browser, so a page reload does not re-arm the
  // buttons. Abuse beyond this is not worth heavier machinery for a family page.
  useEffect(() => {
    try {
      setDone({
        candle:
          localStorage.getItem(`tribute:${props.memorialId}:candle`) === "1",
        flower:
          localStorage.getItem(`tribute:${props.memorialId}:flower`) === "1",
      });
    } catch {
      /* private mode — buttons simply stay armed */
    }
  }, [props.memorialId]);

  async function offer(type: TributeType): Promise<void> {
    if (done[type] || busy) return;
    setBusy(type);
    // Optimistic: reflect the act immediately.
    if (type === "candle") setCandle((n) => n + 1);
    else setFlower((n) => n + 1);
    setDone((d) => ({ ...d, [type]: true }));
    try {
      localStorage.setItem(`tribute:${props.memorialId}:${type}`, "1");
    } catch {
      /* ignore */
    }
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/tributes`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.data) {
        setCandle(payload.data.candle);
        setFlower(payload.data.flower);
      }
    } catch {
      /* keep the optimistic count */
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="tributes" aria-label={t("tributeHeading")}>
      <button
        type="button"
        className="tributeButton"
        onClick={() => offer("candle")}
        disabled={done.candle || busy !== null}
      >
        <span className="tributeIcon" aria-hidden="true">
          🕯️
        </span>
        <span className="tributeLabel">
          {done.candle ? t("candleDone") : t("lightCandle")}
        </span>
        <span className="tributeCount">{candle}</span>
      </button>

      <button
        type="button"
        className="tributeButton"
        onClick={() => offer("flower")}
        disabled={done.flower || busy !== null}
      >
        <span className="tributeIcon" aria-hidden="true">
          💐
        </span>
        <span className="tributeLabel">
          {done.flower ? t("flowerDone") : t("offerFlower")}
        </span>
        <span className="tributeCount">{flower}</span>
      </button>
    </section>
  );
}
