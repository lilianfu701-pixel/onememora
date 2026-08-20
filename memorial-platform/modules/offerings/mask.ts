/**
 * Masks a personal name for public display.
 *
 * Keeps the first and last character, replaces the middle with asterisks. A
 * two-character name shows only the surname. Applied at creation time when the
 * giver opts in, so the stored display name is already what the altar shows —
 * the public page never has to hold the full name.
 */
export function maskName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return `${trimmed[0]}${"*".repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
}
