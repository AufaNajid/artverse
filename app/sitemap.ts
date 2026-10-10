import type { MetadataRoute } from "next";
import { artworks } from "@/data/artworks";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/3d`, changeFrequency: "monthly", priority: 0.9 },
    ...artworks.map((artwork) => ({ url: `${base}/artwork/${artwork.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
