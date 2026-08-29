"use client";

import { useState } from "react";

/**
 * Edits the CNY↔USD rates live. Saving writes to platform settings, so it takes
 * effect on the next payment without a redeploy.
 */
export function RatesForm(props: { collect: number; payout: number }) {
  const [collect, setCollect] = useState(String(props.collect));
  const [payout, setPayout] = useState(String(props.payout));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function save(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const c = Number(collect);
    const p = Number(payout);
    if (![c, p].every((n) => Number.isFinite(n) && n >= 1 && n <= 20)) {
      setState("error");
      return;
    }
    setState("saving");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collect: c, payout: p }),
      });
      setState(res.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <label className="field">
        <span className="fieldLabel">收款汇率（1 美元 = ? 人民币，扣款用）</span>
        <input
          className="input"
          type="number"
          step="0.01"
          min="1"
          max="20"
          value={collect}
          onChange={(e) => setCollect(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="fieldLabel">付款汇率（1 美元 = ? 人民币，转赠家属用）</span>
        <input
          className="input"
          type="number"
          step="0.01"
          min="1"
          max="20"
          value={payout}
          onChange={(e) => setPayout(e.target.value)}
        />
      </label>
      <div className="adminHeadRow">
        <button
          type="submit"
          className="button buttonPrimary buttonCompact"
          disabled={state === "saving"}
        >
          {state === "saving" ? "保存中…" : "保存汇率"}
        </button>
        {state === "saved" ? (
          <span className="muted">已保存，下一笔付款生效。</span>
        ) : null}
        {state === "error" ? (
          <span className="fieldError">保存失败，请检查数值（1–20）。</span>
        ) : null}
      </div>
    </form>
  );
}
