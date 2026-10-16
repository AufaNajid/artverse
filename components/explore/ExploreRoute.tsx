"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Artwork } from "@/data/artworks";
import ExploreWorld from "./ExploreWorld";

export default function ExploreRoute({ artworks }: { artworks: Artwork[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const values = params.getAll("karya");
  const slug = values.length === 1 ? values[0] : null;
  return <ExploreWorld artworks={artworks} initialSlug={slug} fullScreen routeMode onClose={() => router.push("/")} onBrowseGallery={() => router.push("/#work")} />;
}
