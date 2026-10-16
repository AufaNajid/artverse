import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import ExploreRoute from "@/components/explore/ExploreRoute";
import { getPublishedArtworks, getPublicProfile } from "@/lib/cms/public";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicProfile();
  const description = `Step into ${profile.name}'s floating gallery. Explore original art and painted stories in an interactive aqua world.`;
  return {
  title: `Explore in 3D — ${profile.name}`,
  description,
  authors: [{ name: profile.name }],
  alternates: { canonical: "/3d" },
  openGraph: {
    title: `Explore in 3D — ${profile.name} · ARTVERSE`,
    description,
    url: "/3d",
    type: "website",
    images: [{ url: "/3d/opengraph-image", width: 1200, height: 630, alt: `ARTVERSE: an aqua floating gallery of ${profile.name}'s original art.` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Explore in 3D — ${profile.name} · ARTVERSE`,
    description,
    images: ["/3d/opengraph-image"],
  },
  };
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="explorer-route-loading" role="status" aria-live="polite"><span aria-hidden="true">✦</span><p>ENTERING THE ARTVERSE…</p></div>}>
      <PublishedExhibition />
    </Suspense>
  );
}

async function PublishedExhibition() {
  const artworks = await getPublishedArtworks();
  if (!artworks.length) return <main className="explorer-route-loading"><h1>The next world is taking shape.</h1><p>New artwork will appear here soon.</p><Link href="/#work">Return to the portfolio ↗</Link></main>;
  return <ExploreRoute artworks={artworks} />;
}
