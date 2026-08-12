import type { Gender, Kinship, Seniority, Side } from "./kinship";

/**
 * Names a {@link Kinship} in the reader's language.
 *
 * Chinese kinship is precise where Western kinship is not — it has a word for
 * "father's younger brother" that is not the word for "mother's brother" — so
 * the Chinese table is the detailed one and English is deliberately coarse
 * (one "uncle" for all of them). When a discriminator the precise term needs
 * (gender, paternal/maternal side, birth order) is missing, the Chinese side
 * drops to a structural phrase — "父母的兄弟" — that stays true rather than
 * guessing. Non-Chinese locales use the coarse English set.
 */
export function kinshipLabel(kin: Kinship, locale: string): string | null {
  const chinese = locale.startsWith("zh");
  return chinese ? zh(kin) : en(kin);
}

/** An ended marriage — named apart from a current spouse. */
export function exSpouseLabel(gender: Gender, locale: string): string {
  if (locale.startsWith("zh")) {
    return gender === "male" ? "前夫" : gender === "female" ? "前妻" : "前配偶";
  }
  return gender === "male"
    ? "Ex-husband"
    : gender === "female"
      ? "Ex-wife"
      : "Ex-spouse";
}

// ── Chinese ──────────────────────────────────────────────────────────────

function zh(kin: Kinship): string | null {
  switch (kin.kind) {
    case "self":
      return null;
    case "distant":
      return "亲属";
    case "spouse":
      return kin.gender === "male" ? "丈夫" : kin.gender === "female" ? "妻子" : "配偶";
    case "blood":
      return zhBlood(kin.up, kin.down, kin.gender, kin.side, kin.seniority);
    case "affinal":
      return zhAffinal(kin);
  }
}

function zhAncestor(up: number, gender: Gender, side: Side): string {
  if (up === 1) return gender === "male" ? "父亲" : gender === "female" ? "母亲" : "父母";
  if (up === 2) {
    const paternal = side !== "maternal"; // default to paternal when unknown
    if (gender === "male") return paternal ? "祖父" : "外祖父";
    if (gender === "female") return paternal ? "祖母" : "外祖母";
    return paternal ? "祖父母" : "外祖父母";
  }
  const greats = "曾".repeat(Math.max(0, up - 2));
  if (gender === "male") return `${greats}祖父`;
  if (gender === "female") return `${greats}祖母`;
  return `${greats}祖父母`;
}

function zhDescendant(down: number, gender: Gender, side: Side): string {
  if (down === 1) return gender === "male" ? "儿子" : gender === "female" ? "女儿" : "子女";
  const external = side === "maternal" ? "外" : ""; // through a daughter → 外
  if (down === 2) {
    if (gender === "male") return `${external}孙子`;
    if (gender === "female") return `${external}孙女`;
    return `${external}孙辈`;
  }
  const greats = "曾".repeat(Math.max(0, down - 2));
  if (gender === "male") return `${greats}${external}孙`;
  if (gender === "female") return `${greats}${external}孙女`;
  return `${greats}${external}孙辈`;
}

function zhSibling(gender: Gender, seniority: Seniority): string {
  if (gender === "male") {
    return seniority === "older" ? "哥哥" : seniority === "younger" ? "弟弟" : "兄弟";
  }
  if (gender === "female") {
    return seniority === "older" ? "姐姐" : seniority === "younger" ? "妹妹" : "姐妹";
  }
  return "兄弟姐妹";
}

/** up=2, down=1: a parent's sibling — 伯/叔/姑/舅/姨. */
function zhParentSibling(gender: Gender, side: Side, seniority: Seniority): string {
  if (side === "paternal") {
    if (gender === "male") {
      return seniority === "older" ? "伯父" : seniority === "younger" ? "叔父" : "伯叔";
    }
    if (gender === "female") return "姑母";
    return "父亲的兄弟姐妹";
  }
  if (side === "maternal") {
    if (gender === "male") return "舅父";
    if (gender === "female") return "姨母";
    return "母亲的兄弟姐妹";
  }
  // Side unknown: stay structural rather than pick a side.
  if (gender === "male") return "父母的兄弟";
  if (gender === "female") return "父母的姐妹";
  return "父母的兄弟姐妹";
}

/** up=1, down=2: a sibling's child — 侄/甥. Side reflects the sibling's gender. */
function zhNibling(gender: Gender, side: Side): string {
  const brothersChild = side === "paternal"; // sibling is a brother
  if (side === "unknown") {
    if (gender === "male") return "侄子／外甥";
    if (gender === "female") return "侄女／外甥女";
    return "侄甥辈";
  }
  if (gender === "male") return brothersChild ? "侄子" : "外甥";
  if (gender === "female") return brothersChild ? "侄女" : "外甥女";
  return brothersChild ? "侄辈" : "甥辈";
}

/** up=2, down=2: a cousin — 堂 only through the father's brother, else 表. */
function zhCousin(gender: Gender, side: Side, seniority: Seniority): string {
  const tang = side === "paternal"; // father's-brother line keeps the surname
  const prefix = tang ? "堂" : "表";
  if (gender === "male") {
    return `${prefix}${seniority === "older" ? "兄" : seniority === "younger" ? "弟" : "兄弟"}`;
  }
  if (gender === "female") {
    return `${prefix}${seniority === "older" ? "姐" : seniority === "younger" ? "妹" : "姐妹"}`;
  }
  return `${prefix}兄弟姐妹`;
}

function zhBlood(
  up: number,
  down: number,
  gender: Gender,
  side: Side,
  seniority: Seniority,
): string {
  if (up === 0) return zhDescendant(down, gender, side);
  if (down === 0) return zhAncestor(up, gender, side);
  if (up === 1 && down === 1) return zhSibling(gender, seniority);
  if (up === 2 && down === 1) return zhParentSibling(gender, side, seniority);
  if (up === 1 && down === 2) return zhNibling(gender, side);
  if (up === 2 && down === 2) return zhCousin(gender, side, seniority);
  // Beyond the named lattice, describe the shape honestly.
  if (down === 1) return "长辈"; // an elder in a further-out line
  if (up === 1) return "晚辈";
  return "亲属";
}

function zhAffinal(
  kin: Extract<Kinship, { kind: "affinal" }>,
): string {
  const { base, gender, via } = kin;

  if (via === "of_spouse") {
    // Target is blood kin of the reader's spouse.
    if (base.up === 1 && base.down === 0) {
      return gender === "male" ? "岳父／公公" : gender === "female" ? "岳母／婆婆" : "配偶的父母";
    }
    if (base.up === 1 && base.down === 1) {
      return gender === "male" ? "配偶的兄弟" : gender === "female" ? "配偶的姐妹" : "配偶的兄弟姐妹";
    }
    return "配偶的" + (zhBlood(base.up, base.down, gender, base.side, base.seniority) ?? "亲属");
  }

  // Target married into the family — a blood relative's spouse.
  if (base.up === 0 && base.down === 1) {
    return gender === "male" ? "女婿" : gender === "female" ? "儿媳" : "子女的配偶";
  }
  if (base.up === 1 && base.down === 1) {
    return gender === "male" ? "姐夫／妹夫" : gender === "female" ? "嫂子／弟媳" : "兄弟姐妹的配偶";
  }
  const baseLabel = zhBlood(base.up, base.down, "unknown", base.side, base.seniority);
  return (baseLabel ?? "亲属") + "的配偶";
}

// ── English (coarse) ───────────────────────────────────────────────────────

function en(kin: Kinship): string | null {
  switch (kin.kind) {
    case "self":
      return null;
    case "distant":
      return "Relative";
    case "spouse":
      return kin.gender === "male" ? "Husband" : kin.gender === "female" ? "Wife" : "Spouse";
    case "blood":
      return enBlood(kin.up, kin.down, kin.gender);
    case "affinal":
      return enAffinal(kin);
  }
}

function enAncestor(up: number, gender: Gender): string {
  const great = "great-".repeat(Math.max(0, up - 2));
  const grand = up >= 2 ? "grand" : "";
  const base = gender === "male" ? "father" : gender === "female" ? "mother" : "parent";
  if (up === 1) return cap(base);
  const noun = gender === "unknown" ? "grandparent" : `${grand}${base}`;
  return cap(`${great}${noun}`);
}

function enDescendant(down: number, gender: Gender): string {
  const great = "great-".repeat(Math.max(0, down - 2));
  const base = gender === "male" ? "son" : gender === "female" ? "daughter" : "child";
  if (down === 1) return cap(base);
  const noun = gender === "unknown" ? "grandchild" : `grand${base}`;
  return cap(`${great}${noun}`);
}

function enBlood(up: number, down: number, gender: Gender): string {
  if (up === 0) return enDescendant(down, gender);
  if (down === 0) return enAncestor(up, gender);
  if (up === 1 && down === 1) {
    return gender === "male" ? "Brother" : gender === "female" ? "Sister" : "Sibling";
  }
  if (up === 2 && down === 1) {
    return gender === "male" ? "Uncle" : gender === "female" ? "Aunt" : "Aunt/uncle";
  }
  if (up === 1 && down === 2) {
    return gender === "male" ? "Nephew" : gender === "female" ? "Niece" : "Nibling";
  }
  if (up === 2 && down === 2) return "Cousin";
  return "Relative";
}

function enAffinal(kin: Extract<Kinship, { kind: "affinal" }>): string {
  const { base, gender, via } = kin;
  if (via === "of_spouse") {
    if (base.up === 1 && base.down === 0) {
      return gender === "male" ? "Father-in-law" : gender === "female" ? "Mother-in-law" : "Parent-in-law";
    }
    if (base.up === 1 && base.down === 1) return "Sibling-in-law";
    return "In-law";
  }
  if (base.up === 0 && base.down === 1) {
    return gender === "male" ? "Son-in-law" : gender === "female" ? "Daughter-in-law" : "Child-in-law";
  }
  if (base.up === 1 && base.down === 1) return "Sibling-in-law";
  return "In-law";
}

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
