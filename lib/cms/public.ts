import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { artworks as previewArtworks, type Artwork } from "@/data/artworks";
import { previewProfile } from "@/data/profile";
import { prisma } from "./db";
import { hasCmsConfiguration, isCmsPreviewMode } from "./config";
import { assetUrl, seedFrames, seedPaths } from "./media";
import type { ArtworkRecord } from "./artworks";
import type { PublicProfile } from "./public-types";

function requireLiveCms() {
  // A partially configured or unavailable CMS must never republish preview data.
  if (!hasCmsConfiguration()) throw new Error("CMS configuration is incomplete. Complete the local environment setup before serving published content.");
}

async function toPublicArtworks(rows: ArtworkRecord[]): Promise<Artwork[]> {
  const paths = [...new Set(rows.flatMap((row) => [row.coverPath, ...row.images.map((image) => image.storagePath)]).filter((path): path is string => Boolean(path) && !seedPaths.has(path!)))];
  // Resolve every frame and gallery image in one database read, even for large galleries.
  const assets = paths.length ? await prisma.mediaAsset.findMany({ where: { validated: true, storagePath: { in: paths } }, select: { id: true, storagePath: true, framePath: true, width: true, height: true } }) : [];
  const byPath = new Map(assets.map((asset) => [asset.storagePath, asset]));
  const imageUrl = (path: string | null, frame = false): string | null => {
    if (!path) return null;
    if (seedPaths.has(path)) return frame ? seedFrames[path] || path : path;
    const asset = byPath.get(path);
    return asset ? `/api/media/${asset.id}${frame && asset.framePath ? "?variant=frame" : ""}` : null;
  };
  return rows.map((artwork) => {
    const coverImage = imageUrl(artwork.coverPath);
    const frameImage = imageUrl(artwork.coverPath, true);
    if (!coverImage || !frameImage) throw new Error("A published artwork is missing its cover or exhibition image.");
    return {
      id: artwork.id,
      slug: artwork.slug,
      title: artwork.title,
      category: artwork.category,
      description: artwork.description,
      coverImage,
      frameImage,
      alt: artwork.alt || artwork.title,
      width: artwork.width || 1024,
      height: artwork.height || 1024,
      tools: artwork.tools,
      year: artwork.year ?? undefined,
      featured: artwork.featured,
      color: artwork.color,
      tags: artwork.tags,
      brief: artwork.brief,
      approach: artwork.approach,
      galleryImages: artwork.images.map((image) => {
        const url = imageUrl(image.storagePath);
        if (!url) throw new Error("A published artwork is missing a gallery image.");
        const asset = byPath.get(image.storagePath);
        return { id: image.id, url, frameUrl: imageUrl(image.storagePath, true) || url, alt: image.alt || artwork.title, width: asset?.width, height: asset?.height };
      }),
    };
  });
}

/** Request-scoped memoization only: publishing is visible on the next request. */
export const getPublishedArtworks = cache(async (): Promise<Artwork[]> => {
  await connection();
  if (isCmsPreviewMode()) return previewArtworks;
  requireLiveCms();
  const rows = await prisma.artwork.findMany({
    where: { status: "published" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  return toPublicArtworks(rows);
});

export const getPublishedArtworkBySlug = cache(async (slug: string): Promise<Artwork | null> => {
  await connection();
  if (isCmsPreviewMode()) return previewArtworks.find((artwork) => artwork.slug === slug) ?? null;
  requireLiveCms();
  const row = await prisma.artwork.findFirst({
    where: { slug, status: "published" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  return row ? (await toPublicArtworks([row]))[0] : null;
});

export const getPublicProfile = cache(async (): Promise<PublicProfile> => {
  await connection();
  if (isCmsPreviewMode()) return previewProfile;
  requireLiveCms();
  const profile = await prisma.portfolioProfile.findUnique({ where: { id: "singleton" } });
  if (!profile) throw new Error("The portfolio profile has not been initialized. Run the CMS seed setup.");
  return {
    name: profile.name,
    bio: profile.bio,
    avatarUrl: await assetUrl(profile.avatarPath, profile.avatarPath?.startsWith("/artworks/") ? "original" : "frame"),
    instagram: profile.instagram ? `https://www.instagram.com/${profile.instagram.replace(/^@/, "")}/` : null,
    email: profile.email || null,
  };
});
