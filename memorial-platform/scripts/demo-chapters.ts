/**
 * Seeds a few published life chapters on the demo memorial, so the public
 * "人生章节" section can be previewed. Local dev database only.
 *
 *   npx tsx scripts/demo-chapters.ts
 */
import { eq } from "drizzle-orm";
import { closeDb, db } from "@/db/client";
import { loadEnvFileIfPresent } from "@/lib/load-env-file";
import { emailCredentials, memorials } from "@/db/schema";
import {
  addChapter,
  publishChapter,
  saveChapter,
} from "@/modules/memorials/life-chapters";
import type { Actor } from "@/modules/permissions/types";

loadEnvFileIfPresent();

const DEMO_EMAIL = "demo-family@example.com";

const CHAPTERS: { key: string; body: string }[] = [
  {
    key: "childhood",
    body: "淑芬 1946 年出生于山东济南一个普通的教师家庭。幼年时家中并不宽裕，却总是书声琅琅。她最爱在院子里的老槐树下听父亲讲故事，那是她一生最温暖的记忆。\n\n战后的岁月清苦，她很早就学会了操持家务，照顾弟妹，也养成了一生要强、待人温厚的性子。",
  },
  {
    key: "career",
    body: "1968 年，淑芬成为济南一所小学的语文老师，一教就是三十五年。她的板书工整清秀，讲课娓娓动人，班里最调皮的孩子也愿意听她的话。\n\n退休时，昔日的学生从各地赶回来看她。有人已两鬓斑白，握着她的手说：老师，是您让我第一次爱上了读书。",
  },
  {
    key: "family",
    body: "她与老伴相守四十余载，育有一儿一女。家里再忙再累，晚饭时一家人围坐的那盏灯，她始终不肯省。\n\n孙辈眼中的奶奶，是会把最后一块糖留给他们、却舍不得为自己添件新衣的人。",
  },
  {
    key: "meaning",
    body: "在家人眼中，她这一生没有惊天动地的大事，却把平凡的日子过得有滋有味、有情有义。她常说：人这一辈子，把该做的事做好，把身边的人待好，就够了。\n\n她走后，留下的不是财富，而是一屋子的书、满墙的照片，和许多人心里那句——她待我很好。",
  },
];

async function main(): Promise<void> {
  const cred = await db()
    .select({ userId: emailCredentials.userId })
    .from(emailCredentials)
    .where(eq(emailCredentials.email, DEMO_EMAIL))
    .limit(1);

  const userId = cred[0]?.userId;
  if (!userId) throw new Error("demo user not found — run demo-memorial.ts first");

  const [memorial] = await db()
    .select({ id: memorials.id })
    .from(memorials)
    .where(eq(memorials.ownerUserId, userId))
    .limit(1);

  if (!memorial) throw new Error("demo memorial not found");

  const actor: Actor = { userId, platformRole: "user" };

  for (const chapter of CHAPTERS) {
    const added = await addChapter(actor, memorial.id, chapter.key, "demo");
    if (!added.ok) {
      process.stdout.write(`skip ${chapter.key}: ${added.error}\n`);
      continue;
    }
    const saved = await saveChapter(
      actor,
      added.value.chapterId,
      { body: chapter.body, sourceLocale: "zh-CN" },
      "demo",
    );
    if (!saved.ok) throw new Error(`save ${chapter.key}: ${saved.error}`);
    const published = await publishChapter(actor, added.value.chapterId, "demo");
    if (!published.ok) throw new Error(`publish ${chapter.key}: ${published.error}`);
    process.stdout.write(`published chapter: ${chapter.key}\n`);
  }

  await closeDb();
}

main().catch((error: unknown) => {
  process.stderr.write(`demo-chapters failed: ${String(error)}\n`);
  process.exitCode = 1;
});
