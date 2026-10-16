import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "./db";
import { CmsError } from "./errors";
import { assetUrl, queueRemovedAssets, seedFrames, validateOwnedReferences } from "./media";
import { assertReferenceCount, createArtworkSchema, patchArtworkSchema, publicationSchema, slugifyTitle } from "./validation";

export const artworkInclude = { images: { orderBy: { sortOrder: "asc" as const } } };
export type ArtworkRecord = Prisma.ArtworkGetPayload<{ include: typeof artworkInclude }>;

export async function serializeArtwork(row: ArtworkRecord) {
  const [coverUrl, frameUrl, images] = await Promise.all([
    assetUrl(row.coverPath), assetUrl(row.coverPath, "frame"),
    Promise.all(row.images.map(async (image) => ({ ...image, url: await assetUrl(image.storagePath) }))),
  ]);
  return { ...row, coverUrl, frameUrl, coverImage: coverUrl, frameImage: frameUrl, images, galleryImages: images };
}

export async function saveArtwork(input: z.infer<typeof patchArtworkSchema>, ownerId: string, id?: string) {
  return prisma.$transaction(async (tx) => {
    const existing = id ? await tx.artwork.findUnique({ where: { id }, include: artworkInclude }) : null;
    if (id && !existing) throw new CmsError("Artwork not found.", 404);
    if (existing?.publishedAt && input.slug && input.slug !== existing.slug) throw new CmsError("A published artwork keeps its original URL, including while it is a draft.", 409, { slug: ["Published URLs cannot be changed."] });
    const artworkId = existing?.id ?? randomUUID();
    const coverPath = input.coverPath === undefined ? existing?.coverPath ?? null : input.coverPath;
    const images = input.images ?? existing?.images.map(({ storagePath, alt, sortOrder }) => ({ storagePath, alt, sortOrder })) ?? [];
    if (!assertReferenceCount(coverPath, images.map((image) => image.storagePath))) throw new CmsError("Use at most 15 different images, including the cover.", 400, { images: ["Maximum 15 images; duplicate references are not allowed."] });
    const status = input.status ?? existing?.status ?? "draft";
    if (status === "published") publicationSchema.parse({ ...existing, ...input, coverPath });
    const paths = [...(coverPath ? [coverPath] : []), ...images.map((image) => image.storagePath)];
    const oldPaths = [...(existing?.coverPath ? [existing.coverPath] : []), ...(existing?.images.map((image) => image.storagePath) ?? [])];
    await validateOwnedReferences(tx, paths, ownerId, artworkId, oldPaths);
    const coverAsset = coverPath && !seedFrames[coverPath] ? await tx.mediaAsset.findUnique({ where: { storagePath: coverPath } }) : null;
    const { images: _images, ...metadata } = input;
    void _images;
    const data = {
      ...metadata,
      coverPath,
      framePath: coverPath ? seedFrames[coverPath] ?? coverAsset?.framePath ?? null : null,
      width: coverAsset?.width ?? (coverPath === existing?.coverPath ? existing?.width : null),
      height: coverAsset?.height ?? (coverPath === existing?.coverPath ? existing?.height : null),
      publishedAt: existing?.publishedAt ?? (status === "published" ? new Date() : null),
      images: { ...(existing ? { deleteMany: {} } : {}), create: images },
    };
    const saved = existing
      ? await tx.artwork.update({ where: { id: existing.id }, data, include: artworkInclude })
      : await tx.artwork.create({ data: { ...data, id: artworkId, title: input.title!, category: input.category!, slug: input.slug ?? `${slugifyTitle(input.title!)}-${artworkId.slice(0, 6)}` }, include: artworkInclude });
    await queueRemovedAssets(tx, oldPaths.filter((path) => !paths.includes(path)), ownerId);
    return saved;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createArtwork(input: unknown, ownerId: string) {
  return saveArtwork(createArtworkSchema.parse(input), ownerId);
}
