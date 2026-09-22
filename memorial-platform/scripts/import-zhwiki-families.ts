/**
 * Convert .zhwiki.review.json files to .data.json, then import via importer.
 *
 * Usage:
 *   npx tsx scripts/import-zhwiki-families.ts [--count=N] [--force] [--dry-run]
 *
 * Skips existing .data.json unless --force is passed.
 * Calls importGenealogy() for each family.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { closeDb, db } from "@/db/client";
import { loadEnvFileIfPresent } from "@/lib/load-env-file";
import { emailCredentials, users } from "@/db/schema";
import type { Actor } from "@/modules/permissions/types";
import type { GenealogyDataset } from "@/modules/genealogy/import/types";
import { importGenealogy } from "@/modules/genealogy/import/importer";

loadEnvFileIfPresent();

const STEWARD_EMAIL = "genealogy-import@missingu.org";

const REVIEW_DIR = join(process.cwd(), "modules", "genealogy", "import", "sources", "review");
const SOURCES_DIR = join(process.cwd(), "modules", "genealogy", "import", "sources");

async function ensureStewardUser(): Promise<string> {
  const existing = await db()
    .select({ userId: emailCredentials.userId })
    .from(emailCredentials)
    .where(eq(emailCredentials.email, STEWARD_EMAIL))
    .limit(1);
  if (existing[0]) return existing[0].userId;

  const [user] = await db()
    .insert(users)
    .values({
      displayName: "族谱导入管理员",
      fullName: "族谱导入管理员",
      preferredLocale: "zh-CN",
    })
    .returning({ id: users.id });

  await db().insert(emailCredentials).values({
    userId: user!.id,
    email: STEWARD_EMAIL,
    verifiedAt: new Date(),
  });

  return user!.id;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const countArg = args.find((a) => a.startsWith("--count="));
  const count = countArg ? Number(countArg.slice(8)) : Infinity;
  const force = args.includes("--force");
  const dryRun = args.includes("--dry-run");

  const userId = await ensureStewardUser();
  const actor: Actor = { userId, platformRole: "super_admin" };
  process.stdout.write(`steward userId: ${userId}\n`);

  const files = await readdir(REVIEW_DIR);
  const reviewFiles = files
    .filter((f) => f.endsWith(".zhwiki.review.json"))
    .map((f) => f.slice(0, -".zhwiki.review.json".length));

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  process.stdout.write(`found ${reviewFiles.length} review files\n`);

  for (const key of reviewFiles.slice(0, count)) {
    const idx = imported + skipped + errors + 1;
    const reviewPath = join(REVIEW_DIR, `${key}.zhwiki.review.json`);
    const dataPath = join(SOURCES_DIR, `${key}.zhwiki.data.json`);

    try {
      if (!force) {
        await readFile(dataPath);
        process.stdout.write(`[${idx}/${reviewFiles.length}] ${key}: already imported, skipping\n`);
        skipped++;
        continue;
      }
    } catch {
      // File doesn't exist; proceed
    }

    try {
      const reviewText = await readFile(reviewPath, "utf8");
      const review = JSON.parse(reviewText);

      const dataset: GenealogyDataset = {
        key: review.key,
        namespace: review.namespace,
        people: review.people
          .filter((p: any) => {
            const name = p.name ?? "";
            if (name.length > 20) return false;
            if (name.startsWith("//")) return false;
            if (name.startsWith("字")) return false;
            if (name.startsWith("着有")) return false;
            if (name === "湘潭") return false;
            return true;
          })
          .map((p: any) => ({
            externalId: p.externalId,
            name: p.name,
            living: p.living ?? false,
            photoUrl: p.photoUrl,
            citation: p.citation,
          })),
        relations: review.relations.filter((r: any) => {
          const ids = r.kind === "spouse" ? [r.a, r.b] : [r.parent, r.child];
          return ids.every((id: string) => {
            if (!id) return false;
            if (id.length > 50) return false;
            if (id.startsWith("zhwiki:字")) return false;
            if (id.startsWith("zhwiki:着有")) return false;
            if (id.startsWith("zhwiki://")) return false;
            return true;
          });
        }),
      };

      if (dryRun) {
        process.stdout.write(`[${idx}/${reviewFiles.length}] ${key}: ${dataset.people.length} people, ${dataset.relations.length} relations (dry-run)\n`);
        imported++;
        continue;
      }

      await writeFile(dataPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");

      const report = await importGenealogy(actor, dataset);
      process.stdout.write(`[${idx}/${reviewFiles.length}] ${key}: ${report.memorialsCreated} created, ${report.memorialsExisting} existing, ${report.issues.length} issues\n`);
      imported++;
    } catch (error) {
      process.stderr.write(`[${idx}/${reviewFiles.length}] ${key}: ERROR ${String(error)}\n`);
      errors++;
    }
  }

  process.stdout.write(`\ndone: ${imported} imported, ${skipped} skipped, ${errors} errors\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`import failed: ${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
