export type CmsImage = { id?: string; storagePath: string; alt: string; sortOrder: number; url: string };
export type CmsArtwork = {
  id: string; slug: string; title: string; category: string; description: string;
  coverPath: string | null; framePath: string | null; coverUrl: string | null; frameUrl: string | null; alt: string;
  width: number | null; height: number | null; tools: string[]; year: number | null; featured: boolean;
  color: string; tags: string[]; brief: string; approach: string;
  status: "draft" | "published"; sortOrder: number; publishedAt: string | null;
  images: CmsImage[];
};
export type CmsProfile = { name: string; bio: string; avatarPath: string | null; avatarUrl: string | null; instagram: string; email: string };
export type UploadAsset = { id: string; storagePath: string; framePath: string; width: number; height: number; url: string; frameUrl: string; mime: string; sizeBytes: number };
export class CmsError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string[]> = {}) { super(message); }
}
export async function cmsRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store", headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new CmsError(body.error || "Something went wrong. Please try again.", response.status, body.fieldErrors);
  return body as T;
}
export function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }
export function assetUrl(path: string) { return path.startsWith("/") || path.startsWith("https://") ? path : ""; }
