/**
 * Masks a living person's name for the public: the surname stays, the given name
 * is hidden entirely.
 *
 * "孔垂长" → "孔**", "王弗" → "王*", a lone character is left as-is. Deliberately
 * stronger than the light first-and-last masking used for a signed-in "family"
 * audience: this is shown to strangers about someone who never consented to be
 * named, so nothing of the given name is revealed. A two-character surname
 * (欧阳) loses its second character too — the safe direction to err.
 */
export function maskName(name: string): string {
  const trimmed = name.trim();
  const chars = [...trimmed];
  if (chars.length <= 1) return trimmed;
  return `${chars[0]}${"*".repeat(chars.length - 1)}`;
}

/** How a living person chose to show their own name (`users.name_visibility`). */
export type OwnNameChoice = "public" | "family" | "hidden" | null | undefined;

/**
 * The name to show for a living person seeded from a published 族谱.
 *
 * Site policy (2026-09): names are shown in full by default. Only a person who
 * has claimed their node may choose otherwise — `family` masks the name for
 * anonymous visitors, `hidden` withholds it entirely (returns null). An
 * unclaimed node, or a claimant with no preference, shows the full name.
 */
export function importedLivingName(
  displayName: string,
  choice: OwnNameChoice,
  viewerLoggedIn: boolean,
): string | null {
  if (choice === "hidden") return null;
  if (choice === "family" && !viewerLoggedIn) return maskName(displayName);
  return displayName;
}
