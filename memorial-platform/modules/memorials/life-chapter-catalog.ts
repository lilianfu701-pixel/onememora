/**
 * The curated set of life-story chapters a family can fill in.
 *
 * Keys are plain strings (stored in `life_chapters.chapter_key`), not a
 * database enum, so adding a suggested chapter later needs no migration. The
 * display title and the writing prompt for each key are translations
 * (`messages/*.json` → `lifeChapters`), resolved in the UI; this module only
 * owns the canonical keys and their default order.
 *
 * A family enables the chapters that fit the life — not everyone had a career
 * or married — and may add "custom" chapters for anything the template misses.
 */

export const LIFE_CHAPTER_KEYS = [
  "childhood",
  "student",
  "career",
  "marriage",
  "family",
  "hobbies",
  "faith",
  "values",
  "parenting",
  "later_years",
  "meaning",
] as const;

export type LifeChapterKey = (typeof LIFE_CHAPTER_KEYS)[number];

export const CUSTOM_CHAPTER_KEY = "custom";

/** The default position of a template chapter, by its order in the list. */
export function templateOrder(key: string): number {
  const idx = (LIFE_CHAPTER_KEYS as readonly string[]).indexOf(key);
  return idx === -1 ? LIFE_CHAPTER_KEYS.length : idx;
}

export function isTemplateKey(key: string): key is LifeChapterKey {
  return (LIFE_CHAPTER_KEYS as readonly string[]).includes(key);
}

/** A key that may be stored: a known template key, or the custom sentinel. */
export function isValidChapterKey(key: string): boolean {
  return isTemplateKey(key) || key === CUSTOM_CHAPTER_KEY;
}
