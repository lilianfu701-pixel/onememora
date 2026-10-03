import { describe, expect, it } from "vitest";
import { paidOfferingsClosed } from "@/modules/offerings/gating";

describe("paidOfferingsClosed", () => {
  const stewarded = new Date("2026-09-01T00:00:00Z");

  it("keeps paid offerings open on a family's own page", () => {
    expect(paidOfferingsClosed(null, null)).toBe(false);
  });

  it("closes them on an admin's hand-built page awaiting a claim", () => {
    expect(paidOfferingsClosed(stewarded, null)).toBe(true);
    expect(paidOfferingsClosed(stewarded, "obituary:abc")).toBe(true);
  });

  it("opens them on a page seeded from collected data", () => {
    expect(paidOfferingsClosed(stewarded, "import:lipu-lidailong:lipu:liruyue:16-天英")).toBe(false);
    expect(paidOfferingsClosed(stewarded, "import:wikidata:Q123")).toBe(false);
  });
});
