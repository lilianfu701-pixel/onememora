import { randomBytes } from "node:crypto";

/**
 * Builds the URL segment for a memorial.
 *
 * The name is transliterated where we can and otherwise dropped, then a short
 * random suffix is appended. The suffix is what makes the slug unique, so two
 * people with the same name never collide, and a name written entirely in a
 * script we cannot transliterate still produces a usable address.
 *
 * The suffix is not a secret. An unlisted memorial is protected by the access
 * check, never by the address being hard to guess.
 */
export function slugify(value: string): string {
  return (
    value
      .normalize("NFKD")
      // Strip combining marks so "José" becomes "jose" rather than "jos".
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
  );
}

export function buildMemorialSlug(
  primaryName: string,
  publicNumber: string,
): string {
  // The URL suffix IS the public number (追思编号), so a page has one number
  // everywhere — in the address bar, on the page, and to search by.
  const base = slugify(primaryName);
  return base.length > 0
    ? `${base}-${publicNumber}`
    : `memorial-${publicNumber}`;
}

/**
 * A random 8-digit public number (first digit never zero, so it is always eight
 * digits when typed) that people use to reach a memorial by number. Uniqueness
 * is enforced by a unique index; the caller retries on the rare collision.
 */
export function buildMemorialNumber(): string {
  // 10_000_000 .. 99_999_999 — 8 digits, no leading zero.
  const n = 10_000_000 + (randomInt() % 90_000_000);
  return String(n);
}

function randomInt(): number {
  const b = randomBytes(4);
  return (
    (((b[0]! << 24) | (b[1]! << 16) | (b[2]! << 8) | b[3]!) >>> 0)
  );
}

/** True when a search query looks like a memorial number (6–8 digits). */
export function looksLikeMemorialNumber(value: string): boolean {
  return /^\d{6,8}$/.test(value.trim());
}
