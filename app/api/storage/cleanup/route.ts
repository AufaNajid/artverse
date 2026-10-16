import { requireOwnerSession } from "@/lib/cms/auth";
import { apiError, privateJson } from "@/lib/cms/errors";
import { processStorageCleanup } from "@/lib/cms/media";
import { cleanStagedUploads } from "@/lib/cms/uploads";
import { assertSameOrigin } from "@/lib/cms/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const owner = await requireOwnerSession();
    await cleanStagedUploads(owner.id);
    return privateJson(await processStorageCleanup(owner.id));
  } catch (error) { return apiError(error); }
}
