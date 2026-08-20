/**
 * Creates a published demo memorial with a spread of offerings, for previewing
 * the altar locally. Idempotent-ish: it reuses a demo user by email and keys
 * the memorial on a fixed idempotency key, so re-running does not pile up
 * duplicates. Intended for the local `memorial_dev` database only.
 *
 *   npx tsx scripts/demo-memorial.ts
 */
import { eq } from "drizzle-orm";
import { closeDb, db } from "@/db/client";
import { loadEnvFileIfPresent } from "@/lib/load-env-file";
import { users, emailCredentials, memorials } from "@/db/schema";
import { createMemorial } from "@/modules/memorials/service";
import { createOffering } from "@/modules/offerings/create";
import type { Actor } from "@/modules/permissions/types";

loadEnvFileIfPresent();

const DEMO_EMAIL = "demo-family@example.com";
const IDEMPOTENCY_KEY = "demo-memorial-fixed-key-0001";

async function ensureDemoUser(): Promise<string> {
  const existing = await db()
    .select({ userId: emailCredentials.userId })
    .from(emailCredentials)
    .where(eq(emailCredentials.email, DEMO_EMAIL))
    .limit(1);
  if (existing[0]) return existing[0].userId;

  const [user] = await db()
    .insert(users)
    .values({ displayName: "示例家属", fullName: "示例家属", preferredLocale: "zh-CN" })
    .returning({ id: users.id });

  await db().insert(emailCredentials).values({
    userId: user!.id,
    email: DEMO_EMAIL,
    verifiedAt: new Date(),
  });

  return user!.id;
}

async function main(): Promise<void> {
  const userId = await ensureDemoUser();
  const actor: Actor = { userId, platformRole: "user" };

  const result = await createMemorial(
    actor,
    {
      relationship: "child",
      relationshipStatementAccepted: true,
      primaryName: { value: "张淑芬", locale: "zh-CN", script: "Hans" },
      birthDate: { value: "1946-03-12", precision: "day" },
      deathDate: { value: "2026-05-20", precision: "day" },
      ancestralHometown: "山东济南",
      visibility: "public",
      searchEngineIndexable: true,
    },
    IDEMPOTENCY_KEY,
    "demo-correlation",
  );

  if (!result.ok) {
    throw new Error(`createMemorial failed: ${result.error}`);
  }

  const { memorialId, slug, created } = result.value;

  // Publish it so the public page (and the altar) render.
  await db()
    .update(memorials)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(memorials.id, memorialId));

  // A spread of offerings so every part of the altar has something to show.
  if (created) {
    const offer = (
      slugName: "incense" | "candle" | "wreath" | "donation",
      extra: {
        name?: string;
        message?: string;
        masked?: boolean;
        amountMinor?: number;
      } = {},
    ) =>
      createOffering({
        memorialId,
        slug: slugName,
        name: extra.name ?? null,
        message: extra.message ?? null,
        masked: extra.masked ?? false,
        amountMinor: extra.amountMinor ?? null,
      });

    for (let i = 0; i < 12; i++) await offer("incense");

    await offer("candle", { name: "王小明", masked: true });
    await offer("candle", { name: "李芳" });
    await offer("candle", {});
    await offer("candle", { name: "赵磊", masked: true });
    await offer("candle", { name: "陈静" });

    await offer("wreath", {
      name: "山东济南第一中学全体师生",
      message: "音容宛在，永垂不朽",
    });
    await offer("wreath", { name: "张伟", message: "妈妈，我永远想念您" });
    await offer("wreath", { name: "李家全体", message: "沉痛悼念，永远怀念" });

    await offer("donation", { name: "张伟", masked: true, amountMinor: 199900 });
    await offer("donation", { name: "李芳", amountMinor: 99900 });
    await offer("donation", { amountMinor: 99900 });
    await offer("donation", { name: "王建国", masked: true, amountMinor: 19900 });
    await offer("donation", { name: "赵明", amountMinor: 19900, message: "愿逝者安息" });
    await offer("donation", { name: "陈静", masked: true, amountMinor: 199900 });
    await offer("donation", { name: "刘大海", masked: true, amountMinor: 99900 });
    await offer("donation", { name: "周小琳", masked: true, amountMinor: 19900 });
  }

  process.stdout.write(
    [
      created ? "created demo memorial" : "demo memorial already existed",
      `  id:   ${memorialId}`,
      `  slug: ${slug}`,
      `  view: http://localhost:3002/zh-CN/memorials/${slug}`,
      "",
    ].join("\n"),
  );

  await closeDb();
}

main().catch((error: unknown) => {
  process.stderr.write(`demo-memorial failed: ${String(error)}\n`);
  process.exitCode = 1;
});
