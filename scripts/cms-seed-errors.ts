export function seedFailureMessage(error: unknown): string {
  const failure = error as { code?: unknown; errorCode?: unknown; meta?: { code?: unknown }; message?: unknown } | null;
  const code = String(failure?.code ?? failure?.errorCode ?? "");
  const sqlState = String(failure?.meta?.code ?? "");
  const detail = String(failure?.message ?? "");
  if (sqlState === "42P05" || /prepared statement.+already exists/i.test(detail)) return "CMS seed failed [POOLER_CONFIGURATION]. Add pgbouncer=true to the port-6543 DATABASE_URL, and use a direct/session-pooler DIRECT_URL for setup.";
  if (["P2021", "P2022"].includes(code) || ["42P01", "42703"].includes(sqlState)) return "CMS seed failed [MIGRATIONS_REQUIRED]. Run npm run db:migrate against this database, then retry the seed.";
  if (code === "P2028") return "CMS seed failed [TRANSACTION_TIMEOUT]. The database setup transaction timed out. Check the connection and retry; the import is atomic.";
  if (code === "P1000") return "CMS seed failed [DATABASE_AUTHENTICATION]. Check the database username/password in DIRECT_URL locally and URL-encode special password characters.";
  if (["P1001", "P1002", "P1017"].includes(code)) return "CMS seed failed [DATABASE_CONNECTION]. Check DIRECT_URL, project availability, and network access. Use the session pooler if the direct endpoint is unreachable.";
  if (code === "P1010" || sqlState === "42501" || /permission denied|row-level security/i.test(detail)) return "CMS seed failed [DATABASE_PERMISSIONS]. Use the trusted setup connection in DIRECT_URL; its role must be allowed to initialize the CMS tables.";
  if (detail === "CMS_OWNER_MISMATCH") return "CMS seed failed [OWNER_MISMATCH]. The existing profile belongs to another configured owner. Existing content was preserved; check CMS_OWNER_ID before transferring ownership.";
  if (detail === "CMS_OWNER_ID_REQUIRED") return "CMS seed failed [OWNER_ID_REQUIRED]. Set CMS_OWNER_ID to the confirmed Supabase owner user's UUID before seeding.";
  if (detail === "CMS_DATABASE_URL_REQUIRED") return "CMS seed failed [DATABASE_URL_REQUIRED]. Add the setup database connection to DIRECT_URL in .env.";
  if (code === "P2002") return "CMS seed failed [CONTENT_CONFLICT]. A profile or artwork with the same identifier already exists. Existing content was preserved; review it before retrying.";
  return `CMS seed failed${/^P\d{4}$/.test(code) ? ` [${code}]` : " [SETUP_ERROR]"}. Check the database setup. Connection strings, passwords, and raw database errors were withheld.`;
}
