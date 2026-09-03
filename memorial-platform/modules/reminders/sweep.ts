import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  deceasedPeople,
  emailCredentials,
  memorialFollowers,
  memorialMembers,
  memorialNames,
  memorials,
  reminderDeliveries,
  users,
} from "@/db/schema";
import { env } from "@/lib/env";
import { flags } from "@/lib/feature-flags";
import { emailProvider } from "@/modules/auth/providers/email";
import { memorialUrl } from "@/modules/memorials/seo";
import {
  reminderEmail,
  type ReminderOccasion,
} from "./email-content";
import { FESTIVALS, festivalDate } from "./festivals";
import { signUnsubscribe } from "./unsubscribe";

/** Lead times: three days before, and again on the day. */
const OFFSETS = [3, 0] as const;
/** "Today" is judged in this zone — the reminders' primary audience. */
const REFERENCE_TZ = "Asia/Shanghai";

type Recipient = { userId: string; email: string; locale: string };

export type SweepSummary = {
  disabled: boolean;
  considered: number;
  sent: number;
};

function todayInTz(now: Date, tz: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDate(ymd: string, locale: string): string {
  try {
    return new Date(`${ymd}T00:00:00Z`).toLocaleDateString(locale, {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return ymd;
  }
}

async function distinct(colRows: { id: string | null }[]): Promise<string[]> {
  return [...new Set(colRows.map((r) => r.id).filter((x): x is string => !!x))];
}

/** Owner + active members + followers of one memorial. */
async function memorialConnectedIds(memorialId: string): Promise<string[]> {
  const owner = await db()
    .select({ id: memorials.ownerUserId })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  const members = await db()
    .select({ id: memorialMembers.userId })
    .from(memorialMembers)
    .where(
      and(
        eq(memorialMembers.memorialId, memorialId),
        isNull(memorialMembers.revokedAt),
      ),
    );
  const followers = await db()
    .select({ id: memorialFollowers.userId })
    .from(memorialFollowers)
    .where(eq(memorialFollowers.memorialId, memorialId));
  return distinct([...owner, ...members, ...followers]);
}

/** Everyone connected to any published memorial — the festival audience. */
async function allConnectedIds(): Promise<string[]> {
  const published = and(
    eq(memorials.status, "published"),
    isNull(memorials.deletionRequestedAt),
  );
  const owners = await db()
    .select({ id: memorials.ownerUserId })
    .from(memorials)
    .where(published);
  const members = await db()
    .select({ id: memorialMembers.userId })
    .from(memorialMembers)
    .innerJoin(memorials, eq(memorials.id, memorialMembers.memorialId))
    .where(and(published, isNull(memorialMembers.revokedAt)));
  const followers = await db()
    .select({ id: memorialFollowers.userId })
    .from(memorialFollowers)
    .innerJoin(memorials, eq(memorials.id, memorialFollowers.memorialId))
    .where(published);
  return distinct([...owners, ...members, ...followers]);
}

/** Turns user ids into mailable recipients (opted-in, active, with an email). */
async function resolveRecipients(
  ids: string[],
  opts: { chineseOnly: boolean },
): Promise<Recipient[]> {
  if (ids.length === 0) return [];
  const rows = await db()
    .select({
      id: users.id,
      locale: users.preferredLocale,
      email: emailCredentials.email,
    })
    .from(users)
    .innerJoin(emailCredentials, eq(emailCredentials.userId, users.id))
    .where(
      and(
        inArray(users.id, ids),
        eq(users.emailRemindersEnabled, true),
        eq(users.status, "active"),
      ),
    );

  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const r of rows) {
    if (seen.has(r.id) || !r.email) continue;
    if (opts.chineseOnly && !r.locale.startsWith("zh")) continue;
    seen.add(r.id);
    out.push({ userId: r.id, email: r.email, locale: r.locale });
  }
  return out;
}

/**
 * Records the send first (unique index dedupes), then mails. A send failure
 * rolls the record back so a later run retries; a success stays logged so the
 * same person is never mailed twice for one occasion/date/lead-time.
 */
async function deliver(
  r: Recipient,
  occasion: string,
  occasionDate: string,
  offset: number,
  memorialId: string | null,
  template: ReminderOccasion,
  params: { name?: string; url: string },
): Promise<number> {
  const [ins] = await db()
    .insert(reminderDeliveries)
    .values({
      recipientUserId: r.userId,
      occasion,
      occasionDate,
      offsetDays: offset,
      memorialId,
    })
    .onConflictDoNothing()
    .returning({ id: reminderDeliveries.id });
  if (!ins) return 0; // already sent

  const base = env().APP_URL.replace(/\/+$/, "");
  const unsubscribeUrl = `${base}/api/reminders/unsubscribe?t=${encodeURIComponent(
    signUnsubscribe(r.userId),
  )}`;
  try {
    const { subject, html } = reminderEmail(template, r.locale, {
      ...(params.name ? { name: params.name } : {}),
      dateText: formatDate(occasionDate, r.locale),
      url: params.url,
      unsubscribeUrl,
    });
    await emailProvider().sendReminder({ to: r.email, subject, html });
    return 1;
  } catch {
    await db()
      .delete(reminderDeliveries)
      .where(eq(reminderDeliveries.id, ins.id));
    return 0;
  }
}

/**
 * The daily reminder sweep: death anniversaries (to a memorial's family and
 * followers) and the Chinese festivals Qingming and Zhongyuan (to Chinese-locale
 * recipients), each three days before and again on the day. Idempotent.
 */
export async function runReminderSweep(
  input: { now?: Date } = {},
): Promise<SweepSummary> {
  if (!flags().anniversaryNotificationsEnabled) {
    return { disabled: true, considered: 0, sent: 0 };
  }
  const now = input.now ?? new Date();
  const today = todayInTz(now, REFERENCE_TZ);
  const base = env().APP_URL.replace(/\/+$/, "");

  let considered = 0;
  let sent = 0;

  for (const offset of OFFSETS) {
    const occDate = addDays(today, offset); // the occasion is `offset` days out
    const mmdd = occDate.slice(5);
    const year = Number(occDate.slice(0, 4));

    // ── Death anniversaries falling on occDate ──
    const memRows = await db()
      .select({
        id: memorials.id,
        slug: memorials.slug,
        deathDate: deceasedPeople.deathDate,
        name: memorialNames.value,
      })
      .from(memorials)
      .innerJoin(
        deceasedPeople,
        eq(deceasedPeople.id, memorials.deceasedPersonId),
      )
      .leftJoin(
        memorialNames,
        and(
          eq(memorialNames.memorialId, memorials.id),
          eq(memorialNames.type, "primary"),
        ),
      )
      .where(
        and(
          eq(memorials.status, "published"),
          isNull(memorials.deletionRequestedAt),
          eq(deceasedPeople.deathDatePrecision, "day"),
        ),
      );

    for (const m of memRows) {
      if (!m.deathDate || m.deathDate.slice(5) !== mmdd) continue;
      const recips = await resolveRecipients(
        await memorialConnectedIds(m.id),
        { chineseOnly: false },
      );
      for (const r of recips) {
        considered += 1;
        sent += await deliver(r, `death:${m.id}`, occDate, offset, m.id, "death", {
          name: m.name ?? "",
          url: memorialUrl({ appUrl: base, locale: r.locale, slug: m.slug }),
        });
      }
    }

    // ── Qingming / Zhongyuan falling on occDate ──
    for (const fest of FESTIVALS) {
      if (festivalDate(fest, year) !== occDate) continue;
      const recips = await resolveRecipients(await allConnectedIds(), {
        chineseOnly: true,
      });
      for (const r of recips) {
        considered += 1;
        sent += await deliver(r, fest, occDate, offset, null, fest, {
          url: `${base}/${r.locale}/memorials`,
        });
      }
    }
  }

  return { disabled: false, considered, sent };
}
