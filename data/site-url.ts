/** Resolve canonical links without carrying a localhost URL into hosting. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(configured).origin;
  const hosted = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return hosted ? new URL(`https://${hosted}`).origin : "http://localhost:3000";
}
