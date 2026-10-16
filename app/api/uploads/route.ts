import { z } from "zod";
import { requireOwnerSession } from "@/lib/cms/auth";
import { apiError, CmsError, privateJson } from "@/lib/cms/errors";
import { createOwnerClient } from "@/lib/cms/auth";
import { processStorageCleanup } from "@/lib/cms/media";
import { cmsConfiguration } from "@/lib/cms/config";
import { assertSameOrigin, enforceRateLimit, readJson } from "@/lib/cms/security";
import { cleanStagedUploads, discardUpload, finalizeUpload, prepareUpload } from "@/lib/cms/uploads";
import { uploadPrepareSchema, uuidSchema } from "@/lib/cms/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const owner = await requireOwnerSession();
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      // Compatibility for self-hosted clients; the dashboard uses signed direct uploads for the full 10 MB allowance.
      if (!request.headers.get("content-length") || Number(request.headers.get("content-length")) > 4 * 1024 * 1024) throw new CmsError("Use the direct storage upload flow for files over 4 MB.", 413);
      await enforceRateLimit("upload", owner.id, 60, 3600);
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size > 4 * 1024 * 1024) throw new CmsError("Select an image no larger than 4 MB for a multipart upload.", 400);
      const input = uploadPrepareSchema.parse({ action: "prepare", artworkId: form.get("artworkId") || undefined, purpose: form.get("purpose"), filename: file.name, contentType: file.type, sizeBytes: file.size });
      const upload = await prepareUpload(input, owner.id);
      const client = await createOwnerClient();
      const { error } = await client.storage.from(cmsConfiguration().bucket).uploadToSignedUrl(upload.path, upload.token, await file.arrayBuffer(), { contentType: file.type });
      if (error) throw new CmsError("The image could not be uploaded. Please retry.", 503);
      return privateJson({ asset: await finalizeUpload(upload.id, owner.id) }, 201);
    }
    const body = await readJson(request);
    if (typeof body === "object" && body !== null && "action" in body && body.action === "prepare") {
      const input = uploadPrepareSchema.parse(body);
      await enforceRateLimit("upload", owner.id, 60, 3600);
      await cleanStagedUploads(owner.id);
      await processStorageCleanup(owner.id).catch(() => undefined);
      return privateJson({ upload: await prepareUpload(input, owner.id) }, 201);
    }
    const input = z.object({ action: z.literal("finalize"), id: uuidSchema }).strict().parse(body);
    return privateJson({ asset: await finalizeUpload(input.id, owner.id) });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const owner = await requireOwnerSession();
    const { id } = z.object({ id: uuidSchema }).strict().parse(await readJson(request));
    const cleanup = await discardUpload(id, owner.id);
    return privateJson({ success: true, cleanupPending: cleanup.pending > 0 });
  } catch (error) { return apiError(error); }
}
