import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd());
const runtimeUrl = new URL(process.env.DATABASE_URL);
console.log(JSON.stringify({ runtimeUsesRestrictedRole: decodeURIComponent(runtimeUrl.username).split(".")[0] === "portfolio_app", transactionPoolerConfigured: runtimeUrl.port !== "6543" || runtimeUrl.searchParams.get("pgbouncer") === "true" }));
const client = new PrismaClient({ log: [], datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } } });
try {
  const [state] = await client.$queryRaw`
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portfolio_app' AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND NOT rolinherit) AS "restrictedRoleExists",
      EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'portfolio' AND public = false AND file_size_limit <= 10485760) AS "privateBucketConfigured",
      (SELECT COUNT(*)::int FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname IN ('portfolio_public_read','portfolio_owner_read','portfolio_owner_insert','portfolio_owner_update','portfolio_owner_delete')) AS "storagePolicyCount",
      NOT has_table_privilege('anon', 'public."Artwork"', 'SELECT') AS "anonymousMetadataRestricted",
      (SELECT COUNT(*)::int FROM public."Artwork" WHERE status = 'published') AS "publishedArtworks"
  `;
  console.log(JSON.stringify(state));
} catch (error) {
  console.log(JSON.stringify({ checkFailed: true, code: /^P\d{4}$/.test(error?.code) ? error.code : "DATABASE_CHECK_FAILED" }));
  process.exitCode = 1;
} finally { await client.$disconnect(); }
