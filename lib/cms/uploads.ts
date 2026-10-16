import "server-only";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import type { z } from "zod";
import { createOwnerClient } from "./auth";
import { cmsConfiguration } from "./config";
import { prisma } from "./db";
import { CmsError } from "./errors";
import { processStorageCleanup, queueRemovedAssets } from "./media";
import { sniffImageMime, uploadPrepareSchema } from "./validation";

const MAX_BYTES = 10 * 1024 * 1024;

export async function prepareUpload(input: z.infer<typeof uploadPrepareSchema>, ownerId: string) {
  const artwork = input.artworkId ? await prisma.artwork.findUnique({ where: { id: input.artworkId }, select: { id: true } }) : null;
  if (input.purpose !== "avatar" && !artwork) throw new CmsError("Artwork not found. Save a draft first.", 404);
  if (input.purpose === "avatar" && input.artworkId) throw new CmsError("Profile images cannot belong to an artwork.", 400);
  // Staged uploads have a separate ceiling so replacing a full 15-image set is possible.
  const count = await prisma.mediaAsset.count({ where: { ownerId, ...(artwork ? { artworkId: artwork.id } : { purpose: "avatar" }) } });
  if (count >= (artwork ? 30 : 8)) throw new CmsError("Remove unused uploads before adding more images.", 400);
  const id = randomUUID();
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[input.contentType];
  const storagePath = `${ownerId}/${id}/original.${extension}`;
  const framePath = `${ownerId}/${id}/frame.webp`;
  const asset = await prisma.mediaAsset.create({ data: { id, ownerId, artworkId: artwork?.id, storagePath, framePath, mime: input.contentType, sizeBytes: input.sizeBytes, width: 0, height: 0, purpose: input.purpose } });
  const client = await createOwnerClient();
  const { data, error } = await client.storage.from(cmsConfiguration().bucket).createSignedUploadUrl(storagePath, { upsert: false });
  if (error || !data) {
    await prisma.mediaAsset.delete({ where: { id: asset.id } });
    throw new CmsError("Could not prepare the upload. Check the private storage policies.", 503);
  }
  return { id: asset.id, path: data.path, token: data.token, signedUrl: data.signedUrl };
}

export function uploadDto(asset: { id: string; storagePath: string; framePath: string | null; width: number; height: number; mime: string; sizeBytes: number }) {
  return { ...asset, url: `/api/media/${asset.id}`, frameUrl: `/api/media/${asset.id}?variant=frame` };
}

export async function finalizeUpload(id: string, ownerId: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset || asset.ownerId !== ownerId) throw new CmsError("Upload not found.", 404);
  if (asset.validated) return uploadDto(asset);
  const client = await createOwnerClient();
  const { data, error } = await client.storage.from(cmsConfiguration().bucket).download(asset.storagePath);
  if (error || !data) throw new CmsError("The upload has not reached storage. Upload the image, then try again.", 409);
  try {
    if (data.size < 1 || data.size > MAX_BYTES || data.size !== asset.sizeBytes) throw new CmsError("The uploaded image does not match its declared size or exceeds 10 MB.", 400);
    const bytes = Buffer.from(await data.arrayBuffer());
    const mime = sniffImageMime(bytes);
    if (!mime || mime !== asset.mime) throw new CmsError("Upload a genuine JPEG, PNG, or WebP image matching its file type.", 400);
    let metadata: Metadata;
    try { metadata = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error", animated: false }).metadata(); }
    catch { throw new CmsError("This image could not be decoded safely. Export it again as JPEG, PNG, or WebP.", 400); }
    if (!metadata.width || !metadata.height || metadata.width > 12000 || metadata.height > 12000 || (metadata.pages ?? 1) > 1) throw new CmsError("Use a still image no larger than 12,000 pixels per side and 40 megapixels.", 400);
    const artwork = asset.artworkId ? await prisma.artwork.findUnique({ where: { id: asset.artworkId }, select: { category: true } }) : null;
    if (asset.artworkId && !artwork) throw new CmsError("The artwork was removed during upload.", 409);
    const pixel = artwork?.category === "Pixel art";
    let frame: Buffer;
    try {
      frame = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error", animated: false }).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true, kernel: pixel ? "nearest" : "lanczos3" }).webp({ quality: 90, lossless: pixel }).toBuffer();
    } catch { throw new CmsError("The image data is incomplete or invalid. Export the image again.", 400); }
    const { error: frameError } = await client.storage.from(cmsConfiguration().bucket).upload(asset.framePath!, frame, { contentType: "image/webp", upsert: true, cacheControl: "60" });
    if (frameError) throw new CmsError("Could not save the 3D thumbnail. Check storage setup and retry.", 503);
    const rotated = (metadata.orientation ?? 1) > 4;
    const saved = await prisma.mediaAsset.update({ where: { id: asset.id }, data: { validated: true, mime, sizeBytes: bytes.length, width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height } });
    return uploadDto(saved);
  } catch (failure) {
    // Invalid content is never allowed to remain publishable. Retryable provider failures retain the staged upload.
    if (failure instanceof CmsError && failure.status === 400) {
      await prisma.$transaction(async (tx) => { await queueRemovedAssets(tx, [asset.storagePath], ownerId); });
      await processStorageCleanup(ownerId).catch(() => undefined);
    }
    throw failure;
  }
}

export async function discardUpload(id: string, ownerId: string, deferCleanup = false) {
  await prisma.$transaction(async (tx) => {
    const asset = await tx.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.ownerId !== ownerId) throw new CmsError("Upload not found.", 404);
    const referenced = await tx.artwork.findFirst({ where: { OR: [{ coverPath: asset.storagePath }, { images: { some: { storagePath: asset.storagePath } } }] }, select: { id: true } }) || await tx.portfolioProfile.findFirst({ where: { avatarPath: asset.storagePath }, select: { id: true } });
    if (referenced) throw new CmsError("Remove this image from the artwork or profile before deleting it.", 409);
    await queueRemovedAssets(tx, [asset.storagePath], ownerId);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (deferCleanup) return { completed: 0, pending: 0 };
  return processStorageCleanup(ownerId).catch(() => ({ completed: 0, pending: 1 }));
}

export async function cleanStagedUploads(ownerId: string) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // Filter references in SQL before LIMIT, so a large active portfolio cannot starve orphan cleanup.
  const candidates = await prisma.$queryRaw<{ id: string }[]>`
    SELECT m.id FROM "MediaAsset" m
    WHERE m."ownerId" = ${ownerId}::uuid AND m."createdAt" < ${cutoff}
      AND NOT EXISTS (SELECT 1 FROM "Artwork" a WHERE a."coverPath" = m."storagePath")
      AND NOT EXISTS (SELECT 1 FROM "ArtworkImage" i WHERE i."storagePath" = m."storagePath")
      AND NOT EXISTS (SELECT 1 FROM "PortfolioProfile" p WHERE p."avatarPath" = m."storagePath")
    ORDER BY m."createdAt" ASC LIMIT 50
  `;
  for (const asset of candidates) {
    try { await discardUpload(asset.id, ownerId, true); }
    catch (error) { if (!(error instanceof CmsError && error.status === 409)) throw error; }
  }
}
