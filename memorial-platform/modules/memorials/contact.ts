import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditLogs,
  memorialContactMessages,
  memorials,
} from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";
import { canOnMemorial } from "@/modules/permissions/policy";
import { memorialRoleFor } from "./membership";

/** A guest may leave this many messages for one memorial per hour. */
const GUEST_HOURLY_LIMIT = 3;
const ONE_HOUR_MS = 3_600_000;

export type ContactError =
  | "MEMORIAL_NOT_FOUND"
  | "EMPTY_BODY"
  | "RATE_LIMITED"
  | "AUTH_REQUIRED"
  | "FORBIDDEN";

/**
 * A visitor writes privately to the family who manages a memorial.
 *
 * The message never appears on the page — it reaches the manage view only. A
 * guest may write and leave a way to be reached back, rate-limited by IP so the
 * open door is not an open floodgate; a signed-in person writes under their
 * account.
 */
export async function sendContactMessage(
  actor: Actor,
  memorialId: string,
  input: {
    name?: string | null;
    contact?: string | null;
    body: string;
  },
  context: { requestIpHash: string | null },
  correlationId: string,
): Promise<Result<{ sent: true }, ContactError>> {
  const [memorial] = await db()
    .select({ status: memorials.status })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!memorial || memorial.status !== "published") {
    return err("MEMORIAL_NOT_FOUND");
  }

  const body = input.body.trim();
  if (body.length === 0) return err("EMPTY_BODY");

  if (!actor.userId) {
    const since = new Date(Date.now() - ONE_HOUR_MS);
    const [recent] = await db()
      .select({ n: sql<number>`count(*)::int` })
      .from(memorialContactMessages)
      .where(
        and(
          eq(memorialContactMessages.memorialId, memorialId),
          context.requestIpHash
            ? eq(memorialContactMessages.senderIpHash, context.requestIpHash)
            : sql`false`,
          gt(memorialContactMessages.createdAt, since),
        ),
      );
    if ((recent?.n ?? 0) >= GUEST_HOURLY_LIMIT) return err("RATE_LIMITED");
  }

  await db().insert(memorialContactMessages).values({
    memorialId,
    senderUserId: actor.userId ?? null,
    senderName: input.name?.trim() || null,
    senderContact: input.contact?.trim() || null,
    body,
    senderIpHash: actor.userId ? null : context.requestIpHash,
  });

  await db().insert(auditLogs).values({
    actorUserId: actor.userId,
    action: "contact.sent",
    resourceType: "memorial",
    resourceId: memorialId,
    correlationId,
  });

  return ok({ sent: true });
}

export type ContactMessage = {
  id: string;
  name: string | null;
  contact: string | null;
  body: string;
  read: boolean;
  createdAt: Date;
};

/** Messages the family has received, for the manage view. */
export async function listContactMessages(
  actor: Actor,
  memorialId: string,
): Promise<Result<ContactMessage[], ContactError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");
  const role = await memorialRoleFor(memorialId, actor.userId);
  if (!role) return err("MEMORIAL_NOT_FOUND");
  if (!canOnMemorial({ actor, role, action: "moderate_submission" })) {
    return err("FORBIDDEN");
  }

  const rows = await db()
    .select({
      id: memorialContactMessages.id,
      name: memorialContactMessages.senderName,
      contact: memorialContactMessages.senderContact,
      body: memorialContactMessages.body,
      readAt: memorialContactMessages.readAt,
      createdAt: memorialContactMessages.createdAt,
    })
    .from(memorialContactMessages)
    .where(eq(memorialContactMessages.memorialId, memorialId))
    .orderBy(desc(memorialContactMessages.createdAt))
    .limit(200);

  return ok(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      contact: r.contact,
      body: r.body,
      read: r.readAt !== null,
      createdAt: r.createdAt,
    })),
  );
}

/** The number of unread messages, for a manage-page badge. */
export async function unreadContactCount(
  memorialId: string,
): Promise<number> {
  const [row] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(memorialContactMessages)
    .where(
      and(
        eq(memorialContactMessages.memorialId, memorialId),
        isNull(memorialContactMessages.readAt),
      ),
    );
  return row?.n ?? 0;
}

/** Marks one message read once the family has seen it. */
export async function markContactRead(
  actor: Actor,
  memorialId: string,
  messageId: string,
): Promise<Result<{ read: true }, ContactError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");
  const role = await memorialRoleFor(memorialId, actor.userId);
  if (!role || !canOnMemorial({ actor, role, action: "moderate_submission" })) {
    return err("FORBIDDEN");
  }

  await db()
    .update(memorialContactMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(memorialContactMessages.id, messageId),
        eq(memorialContactMessages.memorialId, memorialId),
      ),
    );

  return ok({ read: true });
}
