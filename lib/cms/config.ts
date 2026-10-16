const requiredNames = ["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "CMS_OWNER_ID"] as const;

export function isCmsPreviewMode(): boolean {
  return requiredNames.every((name) => !process.env[name]?.trim());
}

export function hasCmsConfiguration(): boolean {
  if (requiredNames.some((name) => !process.env[name]?.trim())) return false;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(process.env.CMS_OWNER_ID!)) return false;
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    const database = new URL(process.env.DATABASE_URL!);
    const direct = new URL(process.env.DIRECT_URL!);
    return ["https:", "http:"].includes(url.protocol) && database.protocol.startsWith("postgres") && direct.protocol.startsWith("postgres");
  } catch { return false; }
}

export function cmsConfiguration() {
  if (!hasCmsConfiguration()) throw new Error("CMS_CONFIGURATION_REQUIRED");
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    ownerId: process.env.CMS_OWNER_ID!.toLowerCase(),
    bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "portfolio",
  };
}
