"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BeneficiaryView, OwnerPayoutRow, PayoutStanding } from "@/modules/offerings/payouts";

const yuan = (m: number) => `¥${(m / 100).toFixed(2)}`;

const STATUS_LABEL: Record<string, string> = {
  requested: "待处理",
  approved: "已批准",
  processing: "打款中",
  paid: "已到账",
  rejected: "已拒绝",
  failed: "失败",
};

/**
 * The owner's gift-out panel: enrol a real-name payout recipient, see what is
 * available (after the 20% fee), and request a gift-out once ≥ ¥2000.
 */
export function FamilyPayout(props: {
  memorialId: string;
  beneficiary: BeneficiaryView | null;
  standing: PayoutStanding;
  history: OwnerPayoutRow[];
}) {
  const router = useRouter();
  const { standing } = props;
  const [legalName, setLegalName] = useState(props.beneficiary?.legalName ?? "");
  const [method, setMethod] = useState<"alipay" | "bank">(
    props.beneficiary?.method === "bank" ? "bank" : "alipay",
  );
  const [account, setAccount] = useState(props.beneficiary?.account ?? "");
  const [editing, setEditing] = useState(props.beneficiary === null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function enrol(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (legalName.trim().length < 2 || account.trim().length < 4) {
      setNotice("请填写真实姓名和收款账号。");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/memorials/${props.memorialId}/beneficiary`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ legalName: legalName.trim(), method, account: account.trim() }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setNotice("保存失败，请稍后再试。");
      }
    } catch {
      setNotice("保存失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  async function request(): Promise<void> {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/memorials/${props.memorialId}/payouts`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      } else {
        setNotice("暂不可申请（未满 ¥2000 或已有进行中的申请）。");
      }
    } catch {
      setNotice("申请失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  const b = props.beneficiary;

  return (
    <section className="stack earningsPanel">
      <h2>提款 · 转赠申领</h2>

      {b && !editing ? (
        <div className="stack">
          <p className="muted" style={{ margin: 0 }}>
            收款人：<b>{b.legalName}</b> · {b.method === "bank" ? "银行卡" : "支付宝"}
            {b.account ? ` · ${b.account}` : ""} ·{" "}
            {b.status === "active"
              ? "已开通"
              : b.status === "pending"
                ? "实名审核中"
                : "已暂停"}
            <button
              type="button"
              className="linkButton"
              style={{ marginInlineStart: 8 }}
              onClick={() => setEditing(true)}
            >
              修改
            </button>
          </p>

          <div className="earningsFigures">
            <div className="earningsFigure">
              <span className="earningsLabel">可申领（gross）</span>
              <span className="earningsValue">{yuan(standing.availableMinor)}</span>
            </div>
            <div className="earningsFigure">
              <span className="earningsLabel">平台服务费 20%</span>
              <span className="earningsValue earningsFeeValue">
                −{yuan(standing.feeOnAvailableMinor)}
              </span>
            </div>
            <div className="earningsFigure earningsFigureNet">
              <span className="earningsLabel">到手净额</span>
              <span className="earningsValue">{yuan(standing.netOnAvailableMinor)}</span>
            </div>
          </div>

          {b.status === "active" ? (
            <div className="adminHeadRow">
              <button
                type="button"
                className="button buttonPrimary buttonCompact"
                disabled={busy || !standing.canRequest}
                onClick={request}
              >
                {standing.canRequest ? "申请转赠" : "满 ¥2000 才能申请"}
              </button>
              <span className="muted">
                满 ¥{(standing.thresholdMinor / 100).toFixed(0)} 可申请；转赠为人工审核后打款。
              </span>
            </div>
          ) : (
            <p className="muted">实名信息审核通过后即可申请转赠。</p>
          )}

          {props.history.length > 0 ? (
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>申请时间</th>
                    <th>金额</th>
                    <th>手续费</th>
                    <th>净额</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {props.history.map((h) => (
                    <tr key={h.id}>
                      <td>{h.requestedAt.toLocaleDateString()}</td>
                      <td>{yuan(h.grossMinor)}</td>
                      <td className="muted">−{yuan(h.platformFeeMinor)}</td>
                      <td>{yuan(h.netMinor)}</td>
                      <td>{STATUS_LABEL[h.status] ?? h.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : (
        <form className="stack" onSubmit={enrol}>
          <p className="muted" style={{ margin: 0 }}>
            填写真实姓名与收款账号开通转赠（需人工实名审核）。信息加密存储，仅用于打款。
          </p>
          <label className="field">
            <span className="fieldLabel">真实姓名</span>
            <input className="input" value={legalName} maxLength={80} onChange={(e) => setLegalName(e.target.value)} />
          </label>
          <label className="field">
            <span className="fieldLabel">收款方式</span>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as "alipay" | "bank")}>
              <option value="alipay">支付宝</option>
              <option value="bank">银行卡</option>
            </select>
          </label>
          <label className="field">
            <span className="fieldLabel">{method === "bank" ? "银行卡号 + 开户行" : "支付宝账号"}</span>
            <input className="input" value={account} maxLength={120} onChange={(e) => setAccount(e.target.value)} />
          </label>
          <div className="adminHeadRow">
            <button type="submit" className="button buttonPrimary buttonCompact" disabled={busy}>
              {busy ? "保存中…" : "保存并提交审核"}
            </button>
            {b ? (
              <button type="button" className="button buttonQuiet buttonCompact" onClick={() => setEditing(false)}>
                取消
              </button>
            ) : null}
          </div>
        </form>
      )}

      {notice ? <p className="fieldError">{notice}</p> : null}
    </section>
  );
}
