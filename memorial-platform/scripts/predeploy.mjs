/**
 * Applies database migrations before the production build.
 *
 * Wired into `vercel-build`, so a Vercel production deploy migrates the schema
 * and only then builds the app — the code never ships ahead of the tables it
 * queries. If a migration fails the process exits non-zero, the build fails,
 * and the previous (working) deployment stays live: fail-closed by design.
 *
 * Guards:
 *  - Production only. Preview and local builds skip, so a preview never
 *    rewrites the production schema. Force locally with RUN_MIGRATIONS=1.
 *  - Migrations use MIGRATE_DATABASE_URL when set (the Supabase Session pooler,
 *    which DDL needs), falling back to DATABASE_URL.
 */
import { spawnSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV; // production | preview | development | undefined(local)

if (vercelEnv && vercelEnv !== "production") {
  console.log(
    `[predeploy] VERCEL_ENV=${vercelEnv} — skipping migrations (production only).`,
  );
  process.exit(0);
}

if (!vercelEnv && process.env.RUN_MIGRATIONS !== "1") {
  console.log(
    "[predeploy] not a Vercel build — skipping migrations (set RUN_MIGRATIONS=1 to force).",
  );
  process.exit(0);
}

const migrateUrl =
  process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;

if (!migrateUrl) {
  console.error(
    "[predeploy] MIGRATE_DATABASE_URL / DATABASE_URL is not set — cannot migrate.",
  );
  process.exit(1);
}

console.log("[predeploy] applying database migrations…");

const result = spawnSync("npx", ["--no-install", "drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: migrateUrl },
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error(
    `[predeploy] migrations failed (exit ${result.status ?? "unknown"}) — blocking the build.`,
  );
  process.exit(result.status ?? 1);
}

console.log("[predeploy] migrations applied. Building…");
process.exit(0);
