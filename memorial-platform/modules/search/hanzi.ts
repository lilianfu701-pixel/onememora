import { Converter } from "opencc-js";

/**
 * Simplified ↔ traditional Chinese conversion for search.
 *
 * A memorial registered as 董建华 must be findable by someone typing 董建華, and
 * the reverse. Rather than reindex, the query is expanded to both scripts and
 * matched against the stored name. The converters are built once and are cheap
 * to call.
 */
const t2s = Converter({ from: "tw", to: "cn" });
const s2t = Converter({ from: "cn", to: "tw" });

export function toSimplified(text: string): string {
  try {
    return t2s(text);
  } catch {
    return text;
  }
}

export function toTraditional(text: string): string {
  try {
    return s2t(text);
  } catch {
    return text;
  }
}
