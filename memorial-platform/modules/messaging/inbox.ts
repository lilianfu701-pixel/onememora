import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  memorialMembers,
  memorialNames,
  memorials,
  messages,
  users,
} from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";

export type MessageError =
  | "AUTH_REQUIRED"
  | "EMPTY_BODY"
  | "NOT_FOUND"
  | "NO_RECIPIENT"
  | "RATE_LIMITED";

/** A guest cannot use the inbox; only accounts send and receive. */
const HOURLY_LIMIT = 20;
const ONE_HOUR_MS = 3_600_000;

/**
 * A system message — from the platform, no sender. Used by the rest of the app
 * to notify someone in their inbox (a claim to review, a contribution to look
 * at). Never fails loudly: a notification that cannot be written must not break
 * the action that triggered it.
 */
export async function notify(input: {
  recipientUserId: string;
  memorialId?: string | null;
  subject: string;
  body: string;
}): Promise<void> {
  try {
    await db().insert(messages).values({
      recipientUserId: input.recipientUserId,
      senderUserId: null,
      memorialId: input.memorialId ?? null,
      subject: input.subject,
      body: input.body,
    });
  } catch {
    /* a lost notification is better than a failed action */
  }
}

async function withinRate(senderUserId: string): Promise<boolean> {
  const since = new Date(Date.now() - ONE_HOUR_MS);
  const [row] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(
        eq(messages.senderUserId, senderUserId),
        sql`${messages.createdAt} > ${since}`,
      ),
    );
  return (row?.n ?? 0) < HOURLY_LIMIT;
}

/**
 * A personal message from one account to another.
 *
 * There is no open "message anyone" compose: this is called by the contact and
 * reply flows, which decide who may write to whom.
 */
export async function sendMessage(
  sender: Actor,
  input: {
    recipientUserId: string;
    memorialId?: string | null;
    subject?: string | null;
    body: string;
  },
  correlationId: string,
): Promise<Result<{ sent: true }, MessageError>> {
  if (!sender.userId) return err("AUTH_REQUIRED");
  const body = input.body.trim();
  if (body.length === 0) return err("EMPTY_BODY");
  if (!(await withinRate(sender.userId))) return err("RATE_LIMITED");

  await db().insert(messages).values({
    recipientUserId: input.recipientUserId,
    senderUserId: sender.userId,
    memorialId: input.memorialId ?? null,
    subject: input.subject?.trim() || null,
    body,
  });

  void correlationId;
  return ok({ sent: true });
}

/**
 * Sends a message to whoever manages a memorial — the owner and its members.
 *
 * This is "contact the family": a signed-in visitor writes and it lands in the
 * managers' inboxes, so a reply routes back through the system with no contact
 * details exchanged.
 */
export async function contactManagers(
  sender: Actor,
  memorialId: string,
  body: string,
  correlationId: string,
): Promise<Result<{ sent: true }, MessageError>> {
  if (!sender.userId) return err("AUTH_REQUIRED");
  const text = body.trim();
  if (text.length === 0) return err("EMPTY_BODY");
  if (!(await withinRate(sender.userId))) return err("RATE_LIMITED");

  const [memorial] = await db()
    .select({ owner: memorials.ownerUserId, name: memorialNames.value })
    .from(memorials)
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorials.id),
        eq(memorialNames.type, "primary"),
      ),
    )
    .where(eq(memorials.id, memorialId));
  if (!memorial) return err("NOT_FOUND");

  const memberRows = await db()
    .select({ userId: memorialMembers.userId })
    .from(memorialMembers)
    .where(
      and(
        eq(memorialMembers.memorialId, memorialId),
        isNull(memorialMembers.revokedAt),
      ),
    );

  const recipients = new Set<string>([memorial.owner, ...memberRows.map((r) => r.userId)]);
  recipients.delete(sender.userId); // never message yourself
  if (recipients.size === 0) return err("NO_RECIPIENT");

  await db()
    .insert(messages)
    .values(
      [...recipients].map((recipientUserId) => ({
        recipientUserId,
        senderUserId: sender.userId as string,
        memorialId,
        subject: memorial.name ? memorial.name : null,
        body: text,
      })),
    );

  void correlationId;
  return ok({ sent: true });
}

export type InboxMessage = {
  id: string;
  fromSystem: boolean;
  senderName: string | null;
  senderUserId: string | null;
  memorialId: string | null;
  memorialSlug: string | null;
  subject: string | null;
  body: string;
  read: boolean;
  createdAt: Date;
};

/** A person's inbox, newest first. */
export async function listInbox(userId: string): Promise<InboxMessage[]> {
  const senders = users;
  const rows = await db()
    .select({
      id: messages.id,
      senderUserId: messages.senderUserId,
      senderName: senders.displayName,
      senderFullName: senders.fullName,
      memorialId: messages.memorialId,
      memorialSlug: memorials.slug,
      subject: messages.subject,
      body: messages.body,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(senders, eq(senders.id, messages.senderUserId))
    .leftJoin(memorials, eq(memorials.id, messages.memorialId))
    .where(eq(messages.recipientUserId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(200);

  return rows.map((r) => ({
    id: r.id,
    fromSystem: r.senderUserId === null,
    senderName: r.senderName ?? r.senderFullName ?? null,
    senderUserId: r.senderUserId,
    memorialId: r.memorialId,
    memorialSlug: r.memorialSlug,
    subject: r.subject,
    body: r.body,
    read: r.readAt !== null,
    createdAt: r.createdAt,
  }));
}

export async function unreadInboxCount(userId: string): Promise<number> {
  const [row] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(
        eq(messages.recipientUserId, userId),
        isNull(messages.readAt),
      ),
    );
  return row?.n ?? 0;
}

/** Marks messages read once the recipient has opened them. */
export async function markInboxRead(
  userId: string,
  messageIds: string[],
): Promise<void> {
  if (messageIds.length === 0) return;
  await db()
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.recipientUserId, userId),
        inArray(messages.id, messageIds),
        isNull(messages.readAt),
      ),
    );
}

/**
 * Replies to a message the caller received: a new message back to its sender.
 * A reply to a system message has no one to reach, and is refused.
 */
export async function replyToMessage(
  actor: Actor,
  messageId: string,
  body: string,
  correlationId: string,
): Promise<Result<{ sent: true }, MessageError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");
  const text = body.trim();
  if (text.length === 0) return err("EMPTY_BODY");

  const [original] = await db()
    .select({
      senderUserId: messages.senderUserId,
      memorialId: messages.memorialId,
      subject: messages.subject,
    })
    .from(messages)
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.recipientUserId, actor.userId),
      ),
    );

  if (!original) return err("NOT_FOUND");
  if (!original.senderUserId) return err("NO_RECIPIENT");

  return sendMessage(
    actor,
    {
      recipientUserId: original.senderUserId,
      memorialId: original.memorialId,
      subject: original.subject,
      body: text,
    },
    correlationId,
  );
}
