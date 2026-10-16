import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const loaded = nextEnv.loadEnvConfig(process.cwd());
const direct = process.env.DIRECT_URL;
if (!direct || !process.env.DATABASE_URL) throw new Error("SETUP_CONNECTION_REQUIRED");
const admin = new PrismaClient({ log: [], datasources: { db: { url: direct } } });
let runtime;

function executeSql(sql, label) {
  const result = spawnSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "db", "execute", "--stdin", "--schema", "prisma/schema.prisma"], { input: sql, encoding: "utf8", timeout: 90000, maxBuffer: 2 * 1024 * 1024, env: { ...process.env, DATABASE_URL: direct, DIRECT_URL: direct } });
  if (result.status !== 0) throw new Error(`${label}_FAILED`);
  console.log(`${label}: ready`);
}

try {
  const [before] = await admin.$queryRaw`SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portfolio_app') AS "roleExists", (SELECT count(*)::int FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname NOT IN ('portfolio_public_read','portfolio_owner_read','portfolio_owner_insert','portfolio_owner_update','portfolio_owner_delete')) AS "otherStoragePolicies"`;
  if (before.otherStoragePolicies) throw new Error("EXISTING_STORAGE_POLICIES_NEED_REVIEW");
  executeSql(await readFile(resolve("supabase/setup.sql"), "utf8"), "PRIVATE_STORAGE_POLICIES");
  let runtimeUrl = new URL(process.env.DATABASE_URL);
  if (!before.roleExists) {
    const password = randomBytes(36).toString("base64url");
    const grants = (await readFile(resolve("supabase/runtime-role.sql"), "utf8")).replace(/^begin;\s*$/m, "").replace(/^commit;\s*$/m, "");
    executeSql(`BEGIN;\nCREATE ROLE portfolio_app LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;\n${grants}\nCOMMIT;`, "RESTRICTED_DATABASE_ROLE");
    const parts = decodeURIComponent(runtimeUrl.username).split(".");
    runtimeUrl.username = ["portfolio_app", ...parts.slice(1)].join(".");
    runtimeUrl.password = password;
    runtimeUrl.searchParams.set("pgbouncer", "true");
    if (!runtimeUrl.searchParams.has("connection_limit")) runtimeUrl.searchParams.set("connection_limit", "3");
    const source = loaded.loadedEnvFiles.find(file => file.env.DATABASE_URL === process.env.DATABASE_URL);
    if (!source) throw new Error("LOCAL_RUNTIME_SETTING_NOT_FOUND");
    const target = resolve(source.path);
    const text = await readFile(target, "utf8");
    const pattern = /^([\t ]*(?:export[\t ]+)?DATABASE_URL[\t ]*=)[^\r\n]*/m;
    if (!pattern.test(text)) throw new Error("LOCAL_RUNTIME_SETTING_NOT_FOUND");
    await writeFile(target, text.replace(pattern, (_line, prefix) => `${prefix}${JSON.stringify(runtimeUrl.toString())}`), "utf8");
    console.log("LOCAL_RUNTIME_CONNECTION: restricted; setup credentials preserved separately");
  } else if (decodeURIComponent(runtimeUrl.username).split(".")[0] !== "portfolio_app") {
    throw new Error("EXISTING_ROLE_REQUIRES_ITS_PRIVATE_RUNTIME_CONNECTION");
  }
  runtime = new PrismaClient({ log: [], datasources: { db: { url: runtimeUrl.toString() } } });
  let flags;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      [flags] = await runtime.$queryRaw`SELECT current_user = 'portfolio_app' AS "restrictedRole", has_schema_privilege(current_user, 'public', 'CREATE') AS "canCreateSchemaObjects", has_schema_privilege(current_user, 'auth', 'USAGE') AS "canAccessAuthSchema", has_schema_privilege(current_user, 'storage', 'USAGE') AS "canAccessStorageSchema", (SELECT count(*)::int FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user)) AS memberships`;
      break;
    } catch { if (attempt === 3) throw new Error("RESTRICTED_CONNECTION_NOT_READY"); await new Promise(resolve => setTimeout(resolve, 3000)); }
  }
  if (!flags.restrictedRole || flags.canCreateSchemaObjects || flags.canAccessAuthSchema || flags.canAccessStorageSchema || flags.memberships) throw new Error("RESTRICTED_ROLE_PRIVILEGES_NEED_REVIEW");
  const artworks = await runtime.artwork.count({ where: { status: "published" } });
  await runtime.$transaction(async tx => {
    await tx.cmsRateLimit.upsert({ where: { key: "production-readiness-check" }, create: { key: "production-readiness-check", count: 1, resetAt: new Date() }, update: { count: 1 } });
    await tx.cmsRateLimit.delete({ where: { key: "production-readiness-check" } });
  });
  console.log(JSON.stringify({ productionDatabaseReady: true, publishedArtworks: artworks, privateStoragePolicies: true, restrictedReadWrite: true }));
} catch (error) {
  const message = String(error?.message ?? "");
  console.error(/^[A-Z_]+$/.test(message) ? message : "PRODUCTION_SETUP_FAILED_DETAILS_WITHHELD");
  process.exitCode = 1;
} finally { await runtime?.$disconnect(); await admin.$disconnect(); }
