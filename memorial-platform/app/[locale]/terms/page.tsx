import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "../legal-page";

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata(props: Props): Promise<Metadata> {
  return legalMetadata("terms", props.params);
}

export default function Page(props: Props) {
  return <LegalPage docKey="terms" params={props.params} />;
}
