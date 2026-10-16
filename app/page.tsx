import Portfolio from "@/components/Portfolio";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublishedArtworks, getPublicProfile } from "@/lib/cms/public";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicProfile();
  const title = `ARTVERSE — The world of ${profile.name}`;
  const description = profile.bio || `Explore ${profile.name}'s original artwork and interactive 3D exhibition.`;
  return {
    title: { absolute: title },
    description,
    authors: [{ name: profile.name }],
    alternates: { canonical: "/" },
    openGraph: { title, description, type: "website", images: [{ url: "/3d/opengraph-image", width: 1200, height: 630 }] },
  };
}

export default function Home() {
  return <Suspense fallback={<main className="explorer-route-loading" role="status">Opening the ARTVERSE…</main>}><PublishedPortfolio /></Suspense>;
}

async function PublishedPortfolio() {
  const [artworks, profile] = await Promise.all([getPublishedArtworks(), getPublicProfile()]);
  return <Portfolio artworks={artworks} profile={profile} />;
}
