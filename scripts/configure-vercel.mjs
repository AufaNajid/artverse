import nextEnv from "@next/env";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";

nextEnv.loadEnvConfig(process.cwd());
const runtime = process.env.DATABASE_URL;
if (!runtime || decodeURIComponent(new URL(runtime).username).split(".")[0] !== "portfolio_app") throw new Error("RESTRICTED_RUNTIME_CONNECTION_REQUIRED");
const values = {
  DATABASE_URL: runtime,
  DIRECT_URL: runtime,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  CMS_OWNER_ID: process.env.CMS_OWNER_ID,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || "portfolio",
};
if (Object.values(values).some(value => !value?.trim())) throw new Error("INCOMPLETE_PRODUCTION_CONFIGURATION");
const npx = resolve(dirname(process.execPath), "node_modules/npm/bin/npx-cli.js");
for (const [name, value] of Object.entries(values)) {
  const sensitive = ["DATABASE_URL", "DIRECT_URL", "CMS_OWNER_ID"].includes(name);
  const result = spawnSync(process.execPath, [npx, "--yes", "vercel", "env", "add", name, "production", "--yes", "--force", sensitive ? "--sensitive" : "--no-sensitive"], { input: value, encoding: "utf8", timeout: 90000, maxBuffer: 1024 * 1024, env: { ...process.env, VERCEL_TELEMETRY_DISABLED: "1" } });
  if (result.status !== 0) { console.error(`VERCEL_ENV_UPDATE_FAILED: ${name}; provider details withheld`); process.exit(1); }
  console.log(`Production ${name}: configured${sensitive ? " as secret" : ""}`);
}
console.log("Production uses restricted database credentials. The privileged local setup connection was not sent.");
