import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Lora } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { textDirection } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { siteUrl } from "@/lib/env";
import { NavSession } from "./nav-session";
import "../globals.css";

/*
 * Two families, both subset by next/font and self-hosted at build time. No
 * request leaves for a font provider: doc 06 keeps a visitor's presence on a
 * memorial page from being announced to a third party.
 */
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Lora({
  subsets: ["latin", "cyrillic"],
  variable: "--font-serif",
  display: "swap",
});

export function generateStaticParams(): { locale: Locale }[] {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "common" });

  return {
    // Resolves every relative OG image / canonical / alternate to an absolute
    // URL, which Google requires.
    metadataBase: new URL(siteUrl()),
    title: t("appName"),
  };
}

export default async function LocaleLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  // The segment comes straight from the URL. Anything we do not serve is a 404
  // rather than a fallback, so a bad path cannot masquerade as a real page.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const nav = await getTranslations("nav");
  const a11y = await getTranslations("a11y");

  // Cloudflare Web Analytics beacon token (public value, injected at build).
  const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

  return (
    <html
      lang={locale}
      dir={textDirection(locale)}
      className={`${sans.variable} ${serif.variable}`}
    >
      <body>
        {cfBeaconToken ? (
          // Cloudflare Web Analytics — privacy-first, cookieless page-view and
          // referrer stats, visible in the Cloudflare dashboard. Public token.
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({ token: cfBeaconToken })}
          />
        ) : null}
        <NextIntlClientProvider messages={messages}>
          <div className="shell">
            <a className="skipLink" href="#main">
              {a11y("skipToContent")}
            </a>

            <header className="siteHeader">
              <Link className="brand" href={`/${locale}`}>
                <img
                  className="brandLogo"
                  src="/images/logo.png"
                  alt="missingu.org"
                  width={360}
                  height={121}
                />
              </Link>

              <nav className="siteNav" aria-label={a11y("mainNavigation")}>
                <Link href={`/${locale}/search`}>{nav("search")}</Link>
                <NavSession locale={locale} />
              </nav>
            </header>

            {props.children}

            <footer className="siteFooter">
              <span className="brand" aria-hidden="true">
                <img
                  className="brandMark"
                  src="/icon.png"
                  alt=""
                  width={24}
                  height={24}
                />
                <span className="brandName">
                  missing<span className="brandAccent">u</span>
                </span>
              </span>
              <span className="muted">{nav("help")}</span>
            </footer>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
