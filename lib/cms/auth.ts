import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cmsConfiguration, hasCmsConfiguration } from "./config";
import { CmsError } from "./errors";

export { hasCmsConfiguration } from "./config";

export async function createOwnerClient() {
  const config = cmsConfiguration();
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server components cannot write; proxy refreshes their cookies. */ }
      },
    },
  });
}

export function createPublicStorageClient() {
  const config = cmsConfiguration();
  return createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function getOwnerSession(): Promise<{ id: string; email: string } | null> {
  if (!hasCmsConfiguration()) return null;
  try {
    const client = await createOwnerClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || data.user.id !== cmsConfiguration().ownerId || !data.user.email) return null;
    return { id: data.user.id, email: data.user.email };
  } catch (error) { unstable_rethrow(error); return null; }
}

export async function requireOwnerSession() {
  if (!hasCmsConfiguration()) throw new CmsError("Complete Supabase setup before using the CMS.", 503);
  const owner = await getOwnerSession();
  if (!owner) throw new CmsError("Sign in as the portfolio owner to continue.", 401);
  return owner;
}
