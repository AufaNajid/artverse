import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { createOwnerClient } from "./auth";
import { cmsConfiguration } from "./config";
import { CmsError } from "./errors";
import { isOwnedStoragePath } from "./validation";
import { cleanupNotBefore } from "./cleanup-schedule";

export const seedPaths = new Set(["/artworks/art1.png", "/artworks/art2.jpg", "/artworks/compart1.png", "/artworks/compart2.png", "/artworks/frames/toge-toge.webp", "/artworks/frames/portrait-study.webp", "/artworks/frames/digital-companion.webp", "/artworks/frames/character-sketch.webp"]);
export const seedFrames: Record<string, string> = { "/artworks/art1.png": "/artworks/frames/toge-toge.webp", "/artworks/art2.jpg": "/artworks/frames/portrait-study.webp", "/artworks/compart1.png": "/artworks/frames/digital-companion.webp", "/artworks/compart2.png": "/artworks/frames/character-sketch.webp" };

export async function assetUrl(storagePath: string | null, variant: "original" | "frame" = "original"): Promise<string | null> {
  if (!storagePath) return null;
  if (seedPaths.has(storagePath)) return variant === "frame" ? seedFrames[storagePath] ?? storagePath : storagePath;
  const asset = await prisma.mediaAsset.findFirst({ where: { validated: true, OR: [{ storagePath }, { framePath: storagePath }] }, select: { id: true, framePath: true } });
  if (!asset) return null;
  return `/api/media/${asset.id}${variant === "frame" && asset.framePath ? "?variant=frame" : ""}`;
}

export async function validateOwnedReferences(tx: Prisma.TransactionClient, paths: string[], ownerId: string, artworkId: string, previousPaths: string[]) {
  for (const path of paths) {
    if (seedPaths.has(path)) {
      if (!previousPaths.includes(path)) throw new CmsError("This local artwork image cannot be assigned to another work.", 400);
      continue;
    }
    if (!isOwnedStoragePath(path, ownerId)) throw new CmsError("Select an image uploaded to this artwork.", 400);
    const asset = await tx.mediaAsset.findUnique({ where: { storagePath: path } });
    if (!asset?.validated || asset.ownerId !== ownerId || asset.artworkId !== artworkId || asset.purpose === "avatar") throw new CmsError("This image is not a validated upload belonging to this artwork.", 400);
  }
}

export async function queueRemovedAssets(tx: Prisma.TransactionClient, removedPaths: string[], ownerId: string) {
  if (!removedPaths.length) return;
  const assets = await tx.mediaAsset.findMany({ where: { ownerId, storagePath: { in: removedPaths } } });
  const storagePaths = assets.flatMap((asset) => [asset.storagePath, ...(asset.framePath ? [asset.framePath] : [])]).filter((path) => isOwnedStoragePath(path, ownerId));
  // Revoke metadata access now, but retain the deletion job until every signed
  // upload token can no longer recreate an object at the generated path.
  if (storagePaths.length) await tx.storageCleanup.create({ data: { ownerId, storagePaths, notBefore: cleanupNotBefore() } });
  if (assets.length) await tx.mediaAsset.deleteMany({ where: { id: { in: assets.map((asset) => asset.id) }, ownerId } });
}

export async function processStorageCleanup(ownerId: string) {
  const client = await createOwnerClient();
  const jobs = await prisma.storageCleanup.findMany({ where: { ownerId, notBefore: { lte: new Date() } }, orderBy: { createdAt: "asc" }, take: 10 });
  let completed = 0;
  for (const job of jobs) {
    const paths = job.storagePaths.filter((path) => isOwnedStoragePath(path, ownerId));
    if (paths.length !== job.storagePaths.length) continue;
    await prisma.storageCleanup.updateMany({ where: { id: job.id }, data: { attempts: { increment: 1 }, attemptedAt: new Date() } });
    const { error } = await client.storage.from(cmsConfiguration().bucket).remove(paths);
    if (!error) { await prisma.storageCleanup.deleteMany({ where: { id: job.id } }); completed++; }
  }
  return { completed, pending: await prisma.storageCleanup.count({ where: { ownerId } }) };
}
