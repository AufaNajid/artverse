import { z } from "zod";
import { createOwnerClient } from "@/lib/cms/auth";
import { cmsConfiguration, hasCmsConfiguration } from "@/lib/cms/config";
import { apiError, CmsError, privateJson } from "@/lib/cms/errors";
import { assertSameOrigin, enforceRateLimit, readJson } from "@/lib/cms/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!hasCmsConfiguration()) throw new CmsError("Complete Supabase setup before signing in.", 503);
    const input = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(200) }).strict().parse(await readJson(request));
    await enforceRateLimit("login-owner", "single-owner", 10, 600);
    await enforceRateLimit("login-email", input.email.toLowerCase(), 5, 600);
    const client = await createOwnerClient();
    const { data, error } = await client.auth.signInWithPassword(input);
    if (error || !data.user || data.user.id !== cmsConfiguration().ownerId) {
      if (data.session) await client.auth.signOut({ scope: "local" });
      throw new CmsError("Email or password is incorrect.", 401);
    }
    return privateJson({ user: { id: data.user.id, email: data.user.email } });
  } catch (error) { return apiError(error); }
}
