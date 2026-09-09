"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

/**
 * Platforms reachable by a plain web share link (opened in a new tab). WeChat is
 * not here: it has no web share intent, so it is offered through the QR code
 * (scan with WeChat to share) rather than a link.
 */
type WebTarget = {
  key: string;
  label: string;
  icon: string;
  href: (url: string, title: string) => string;
};

const WEB_TARGETS: WebTarget[] = [
  {
    key: "weibo",
    label: "微博",
    icon: "🅦",
    href: (u, t) => `https://service.weibo.com/share/share.php?url=${u}&title=${t}`,
  },
  {
    key: "qq",
    label: "QQ",
    icon: "🐧",
    href: (u, t) =>
      `https://connect.qq.com/widget/shareqq/index.html?url=${u}&title=${t}`,
  },
  {
    key: "qzone",
    label: "QQ空间",
    icon: "⭐",
    href: (u, t) =>
      `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${u}&title=${t}`,
  },
  {
    key: "douban",
    label: "豆瓣",
    icon: "📗",
    href: (u, t) => `https://www.douban.com/share/service?href=${u}&name=${t}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "💬",
    href: (u, t) => `https://wa.me/?text=${t}%20${u}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "📘",
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  },
  {
    key: "x",
    label: "X",
    icon: "✖",
    href: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: "✈️",
    href: (u, t) => `https://t.me/share/url?url=${u}&text=${t}`,
  },
  {
    key: "line",
    label: "LINE",
    icon: "🟢",
    href: (u) => `https://social-plugins.line.me/lineit/share?url=${u}`,
  },
  {
    key: "email",
    label: "Email",
    icon: "✉️",
    href: (u, t) => `mailto:?subject=${t}&body=${u}`,
  },
];

export function Share(props: { url: string; title: string }) {
  const t = useTranslations("memorial");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wechatHint, setWechatHint] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prefer the OS share sheet only on touch devices (phone/tablet); on desktop
    // it is a near-empty Windows panel, so fall back to our own panel there.
    const isTouch =
      typeof navigator !== "undefined" &&
      (navigator.maxTouchPoints > 0 ||
        (typeof window !== "undefined" &&
          window.matchMedia?.("(pointer: coarse)").matches));
    setHasNativeShare(
      typeof navigator !== "undefined" && !!navigator.share && Boolean(isTouch),
    );
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  async function nativeShare(): Promise<void> {
    try {
      await navigator.share({ title: props.title, url: props.url });
    } catch {
      /* dismissed */
    }
  }

  // One tap on a phone (or any browser with the Web Share API) opens the system
  // share sheet directly — it already lists WeChat and every installed app, so
  // there is no in-between panel. Elsewhere the button opens our own panel.
  function onMainClick(): void {
    if (hasNativeShare) {
      void nativeShare();
    } else {
      setOpen((value) => !value);
    }
  }

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(props.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  function openTarget(target: WebTarget): void {
    const href = target.href(
      encodeURIComponent(props.url),
      encodeURIComponent(props.title),
    );
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="shareWrap" ref={wrapRef}>
      <button
        type="button"
        className="button buttonQuiet buttonCompact"
        aria-expanded={hasNativeShare ? undefined : open}
        onClick={onMainClick}
      >
        {t("share")}
      </button>

      {/* When the one-tap native share is the primary action, a small control
       * still opens the panel for the QR code, copy link and platform grid. */}
      {hasNativeShare ? (
        <button
          type="button"
          className="shareMoreDots"
          aria-label={t("scanToOpen")}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          ⋯
        </button>
      ) : null}

      {open ? (
        <div className="sharePanel card stack">
          <div className="shareQr">
            <QRCodeSVG value={props.url} size={168} marginSize={2} />
          </div>
          <p className="muted shareScanHint">
            {wechatHint ? t("shareWechatHint") : t("scanToOpen")}
          </p>

          <div className="shareLinkRow">
            <input
              className="input"
              type="text"
              readOnly
              value={props.url}
              onFocus={(event) => event.target.select()}
            />
            <button
              type="button"
              className="button buttonPrimary buttonCompact"
              onClick={copy}
            >
              {copied ? t("linkCopied") : t("copyLink")}
            </button>
          </div>

          <div className="sharePlatforms">
            {/* WeChat: no web intent — point to the QR above. */}
            <button
              type="button"
              className="sharePlatformBtn"
              onClick={() => setWechatHint(true)}
            >
              <span aria-hidden="true">💚</span>
              <span className="sharePlatformLabel">微信</span>
            </button>
            {WEB_TARGETS.map((target) => (
              <button
                type="button"
                key={target.key}
                className="sharePlatformBtn"
                onClick={() => openTarget(target)}
              >
                <span aria-hidden="true">{target.icon}</span>
                <span className="sharePlatformLabel">{target.label}</span>
              </button>
            ))}
          </div>

          {hasNativeShare ? (
            <button
              type="button"
              className="button buttonQuiet buttonCompact shareNativeBtn"
              onClick={nativeShare}
            >
              {t("shareMore")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
