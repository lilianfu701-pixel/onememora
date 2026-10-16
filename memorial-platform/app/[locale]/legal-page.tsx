import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  legalDoc,
  parseLegalBody,
  splitBold,
  type LegalDocKey,
} from "@/content/legal";

/** Renders one line, turning `**bold**` runs into <strong>. */
function Inline({ text }: { text: string }): ReactNode {
  return splitBold(text).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  );
}

/** Title + description for a legal page; indexable so reviewers can find it. */
export async function legalMetadata(
  key: LegalDocKey,
  params: Promise<{ locale: string }>,
): Promise<Metadata> {
  const { locale } = await params;
  const doc = legalDoc(key, locale);
  return {
    title: doc.title,
    description: doc.description,
    robots: { index: true, follow: true },
  };
}

/**
 * One of the three legal pages (terms / privacy / refund). The text comes from
 * `content/legal`, in the visitor's language where it exists, else English.
 */
export async function LegalPage(props: {
  docKey: LegalDocKey;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const doc = legalDoc(props.docKey, locale);
  const blocks = parseLegalBody(doc.body);

  return (
    <main id="main" className="container section">
      <article className="legalPage stack measure">
        <header className="stack">
          <h1>{doc.title}</h1>
          <p className="muted">{doc.updated}</p>
        </header>
        {blocks.map((block, i) => {
          if (block.kind === "heading") {
            return <h2 key={i}>{block.text}</h2>;
          }
          if (block.kind === "list") {
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i}>
              <Inline text={block.text} />
            </p>
          );
        })}
      </article>
    </main>
  );
}
