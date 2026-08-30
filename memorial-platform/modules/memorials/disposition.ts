import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorials } from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";
import { canOnMemorial } from "@/modules/permissions/policy";
import { memorialRoleFor } from "./membership";

/** The curated "简体常用" set of final-disposition methods. */
export const DISPOSITION_METHODS = [
  "ground",
  "cremation",
  "tree",
  "sea",
  "columbarium",
  "donation",
  "other",
] as const;

export type DispositionMethod = (typeof DISPOSITION_METHODS)[number];

export function isDispositionMethod(v: string): v is DispositionMethod {
  return (DISPOSITION_METHODS as readonly string[]).includes(v);
}

export interface Disposition {
  method: DispositionMethod | null;
  place: string | null;
  date: string | null;
  note: string | null;
  /** GCJ-02 (AMap) coordinates as strings, or null when no point was set. */
  lng: string | null;
  lat: string | null;
}

/** Parses a coordinate string, keeping it only if finite and in range. */
function cleanCoord(v: string | null | undefined, max: number): string | null {
  const t = (v ?? "").trim();
  if (t.length === 0) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || Math.abs(n) > max) return null;
  return n.toFixed(6);
}

export type DispositionError = "AUTH_REQUIRED" | "FORBIDDEN" | "NOT_FOUND";

/** The stored disposition for a memorial (nulls when unset). */
export async function getDisposition(
  memorialId: string,
): Promise<Disposition | null> {
  const [row] = await db()
    .select({
      method: memorials.dispositionMethod,
      place: memorials.dispositionPlace,
      date: memorials.dispositionDate,
      note: memorials.dispositionNote,
      lng: memorials.dispositionLng,
      lat: memorials.dispositionLat,
    })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!row) return null;
  return {
    method:
      row.method && isDispositionMethod(row.method) ? row.method : null,
    place: row.place,
    date: row.date,
    note: row.note,
    lng: row.lng,
    lat: row.lat,
  };
}

/**
 * Sets the memorial's final-disposition record. Same capability as editing the
 * story (owner/editor). An empty/invalid method clears it.
 */
export async function setDisposition(
  actor: Actor,
  memorialId: string,
  input: {
    method: string | null;
    place?: string | null;
    date?: string | null;
    note?: string | null;
    lng?: string | null;
    lat?: string | null;
  },
): Promise<Result<Disposition, DispositionError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");

  const [memorial] = await db()
    .select({ id: memorials.id })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!memorial) return err("NOT_FOUND");

  const role = await memorialRoleFor(memorialId, actor.userId);
  if (!canOnMemorial({ actor, role, action: "publish_content" })) {
    return err("FORBIDDEN");
  }

  const method =
    input.method && isDispositionMethod(input.method) ? input.method : null;
  const clean = (v: string | null | undefined, max: number): string | null => {
    const t = (v ?? "").trim();
    return t.length > 0 ? t.slice(0, max) : null;
  };
  const place = method ? clean(input.place, 200) : null;
  const date = method ? clean(input.date, 40) : null;
  const note = method ? clean(input.note, 200) : null;
  const lng = method ? cleanCoord(input.lng, 180) : null;
  const lat = method ? cleanCoord(input.lat, 90) : null;
  // A point needs both halves to be meaningful.
  const hasPoint = lng !== null && lat !== null;

  await db()
    .update(memorials)
    .set({
      dispositionMethod: method,
      dispositionPlace: place,
      dispositionDate: date,
      dispositionNote: note,
      dispositionLng: hasPoint ? lng : null,
      dispositionLat: hasPoint ? lat : null,
    })
    .where(eq(memorials.id, memorialId));

  return ok({
    method,
    place,
    date,
    note,
    lng: hasPoint ? lng : null,
    lat: hasPoint ? lat : null,
  });
}
