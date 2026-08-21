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

console.log("[predeploy] migrations applied.");

// sharp loads a platform-specific native binary. When the lockfile was
// generated on another OS the linux pair can be skipped at install time, and
// every image upload then fails at runtime with ERR_DLOPEN_FAILED. Verify it
// is really there, and install it in place if it is not — a build that ships
// without it produces a site that silently rejects every photograph.
if (process.platform === "linux" && process.arch === "x64") {
  const probe = spawnSync(
    process.execPath,
    ["-e", "require('sharp'); console.log('ok')"],
    { encoding: "utf8" },
  );

  if (probe.status === 0) {
    console.log("[predeploy] sharp loads natively. Building…");
  } else {
    console.warn(
      "[predeploy] sharp failed to load — installing its linux-x64 binary:",
      (probe.stderr || "").split("\n")[0],
    );

    const fix = spawnSync(
      "npm",
      [
        "install",
        "--no-save",
        "--include=optional",
        "--force",
        "@img/sharp-linux-x64@0.35.3",
        "@img/sharp-libvips-linux-x64@1.3.2",
      ],
      { stdio: "inherit", shell: false },
    );

    if (fix.status !== 0) {
      console.error("[predeploy] could not install sharp's linux binary.");
      process.exit(fix.status ?? 1);
    }

    const recheck = spawnSync(
      process.execPath,
      ["-e", "require('sharp'); console.log('ok')"],
      { encoding: "utf8" },
    );
    if (recheck.status !== 0) {
      console.error(
        "[predeploy] sharp still cannot load after install:",
        (recheck.stderr || "").split("\n").slice(0, 3).join(" | "),
      );
      process.exit(1);
    }
    console.log("[predeploy] sharp loads after install. Building…");
  }
}

process.exit(0);
