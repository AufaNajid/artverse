import { createOwnerClient, requireOwnerSession } from "@/lib/cms/auth";
import { apiError, privateJson } from "@/lib/cms/errors";
import { assertSameOrigin } from "@/lib/cms/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireOwnerSession();
    const client = await createOwnerClient();
    await client.auth.signOut({ scope: "local" });
    return privateJson({ success: true });
  } catch (error) { return apiError(error); }
}
