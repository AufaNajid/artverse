import { connection } from "next/server";
import { Prisma } from "@prisma/client";
import { requireOwnerSession } from "@/lib/cms/auth";
import { artworkInclude, saveArtwork, serializeArtwork } from "@/lib/cms/artworks";
import { prisma } from "@/lib/cms/db";
import { apiError, CmsError, privateJson } from "@/lib/cms/errors";
import { processStorageCleanup, queueRemovedAssets } from "@/lib/cms/media";
import { assertSameOrigin, readJson } from "@/lib/cms/security";
import { patchArtworkSchema, uuidSchema } from "@/lib/cms/validation";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  await connection();
  try {
    await requireOwnerSession();
    const id = uuidSchema.parse((await context.params).id);
    const row = await prisma.artwork.findUnique({ where: { id }, include: artworkInclude });
    if (!row) throw new CmsError("Artwork not found.", 404);
    return privateJson({ artwork: await serializeArtwork(row) });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const owner = await requireOwnerSession();
    const id = uuidSchema.parse((await context.params).id);
    const row = await saveArtwork(patchArtworkSchema.parse(await readJson(request)), owner.id, id);
    await processStorageCleanup(owner.id).catch(() => undefined);
    return privateJson({ artwork: await serializeArtwork(row) });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const owner = await requireOwnerSession();
    const id = uuidSchema.parse((await context.params).id);
    await prisma.$transaction(async (tx) => {
      const row = await tx.artwork.findUnique({ where: { id }, include: { mediaAssets: true } });
      if (!row) throw new CmsError("Artwork not found.", 404);
      await queueRemovedAssets(tx, row.mediaAssets.map((asset) => asset.storagePath), owner.id);
      await tx.artwork.delete({ where: { id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    const cleanup = await processStorageCleanup(owner.id).catch(() => ({ completed: 0, pending: 1 }));
    return privateJson({ success: true, cleanupPending: cleanup.pending > 0 });
  } catch (error) { return apiError(error); }
}
