import type { MetadataRoute } from "next";
import { getPublishedArtworks } from "@/lib/cms/public";
import { getSiteUrl } from "@/data/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artworks = await getPublishedArtworks();
  const base = getSiteUrl();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/3d`, changeFrequency: "monthly", priority: 0.9 },
    ...artworks.map((artwork) => ({ url: `${base}/artwork/${artwork.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
