import { describe, expect, it } from "vitest";
import { importedLivingName, maskName } from "@/modules/genealogy/mask";

describe("importedLivingName — 族谱 living nodes", () => {
  it("shows the full name when the node is unclaimed", () => {
    expect(importedLivingName("李隆祥", null, false)).toBe("李隆祥");
  });

  it("shows the full name when the claimant chose public", () => {
    expect(importedLivingName("李隆祥", "public", false)).toBe("李隆祥");
  });

  it("masks for anonymous viewers when the claimant chose family", () => {
    expect(importedLivingName("李隆祥", "family", false)).toBe(maskName("李隆祥"));
    expect(importedLivingName("李隆祥", "family", true)).toBe("李隆祥");
  });

  it("withholds the name when the claimant chose hidden", () => {
    expect(importedLivingName("李隆祥", "hidden", true)).toBeNull();
  });
});
