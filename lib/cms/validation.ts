import { z } from "zod";

export const artworkCategories = ["Pixel art", "Characters", "Illustrations"] as const;
export const uuidSchema = z.string().uuid();
const shortList = z.array(z.string().trim().min(1).max(60)).max(16);
export const imageReferenceSchema = z.object({ storagePath: z.string().min(1).max(400), alt: z.string().trim().max(500).default(""), sortOrder: z.number().int().min(0).max(100000).default(0) }).strict();
export const artworkFields = {
  title: z.string().trim().min(1, "Enter an artwork title.").max(120),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
  category: z.enum(artworkCategories),
  description: z.string().trim().max(5000),
  coverPath: z.string().min(1).max(400).nullable(),
  alt: z.string().trim().max(500),
  tools: shortList,
  year: z.number().int().min(1900).max(2100).nullable(),
  featured: z.boolean(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color."),
  tags: shortList,
  brief: z.string().trim().max(6000),
  approach: z.string().trim().max(6000),
  status: z.enum(["draft", "published"]),
  sortOrder: z.number().int().min(0).max(100000),
  images: z.array(imageReferenceSchema).max(15),
};
export const publicationSchema = z.object({ title: artworkFields.title, category: artworkFields.category, coverPath: z.string().min(1, "Add a cover image before publishing."), alt: z.string().trim().min(1, "Describe the cover image before publishing.").max(500) });
export const createArtworkSchema = z.object(artworkFields).partial().required({ title: true, category: true }).strict();
export const patchArtworkSchema = z.object(artworkFields).partial().strict();
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(3000),
  instagram: z.string().trim().max(30).regex(/^@?[A-Za-z0-9._]*$/, "Enter an Instagram username."),
  email: z.union([z.string().trim().email().max(254), z.literal(""), z.null()]),
  avatarPath: z.string().min(1).max(400).nullable(),
}).partial().strict();
export const uploadPrepareSchema = z.object({ action: z.literal("prepare"), artworkId: uuidSchema.optional(), purpose: z.enum(["cover", "gallery", "avatar"]), filename: z.string().min(1).max(255), contentType: z.enum(["image/jpeg", "image/png", "image/webp"]), sizeBytes: z.number().int().min(1).max(10 * 1024 * 1024, "Images must be 10 MB or smaller.") }).strict().refine((value) => value.purpose === "avatar" || !!value.artworkId, { path: ["artworkId"], message: "Create an artwork before uploading its images." });

export function slugifyTitle(title: string) {
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100).replace(/-$/, "") || "artwork";
}

export function sniffImageMime(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => bytes[i] === v)) return "image/png";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export function isOwnedStoragePath(path: string, ownerId: string): boolean {
  return path.startsWith(`${ownerId}/`) && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/(?:original\.(?:jpg|png|webp)|frame\.webp)$/.test(path);
}

export function assertReferenceCount(coverPath: string | null, imagePaths: string[]) {
  const references = [...(coverPath ? [coverPath] : []), ...imagePaths];
  return references.length <= 15 && new Set(references).size === references.length;
}
