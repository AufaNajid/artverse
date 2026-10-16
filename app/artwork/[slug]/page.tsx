import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPublishedArtworks, getPublishedArtworkBySlug, getPublicProfile } from "@/lib/cms/public";
import ArtworkDetail from "./ArtworkDetail";
import ArtworkLoading from "./ArtworkLoading";
import "../artwork.css";

type ArtworkPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [artwork, profile] = await Promise.all([getPublishedArtworkBySlug(slug), getPublicProfile()]);

  if (!artwork) {
    return { title: "Artwork not found", robots: { index: false, follow: false } };
  }

  return {
    title: `${artwork.title} — ${profile.name}`,
    description: artwork.description,
    authors: [{ name: profile.name }],
    alternates: { canonical: `/artwork/${artwork.slug}` },
    openGraph: {
      title: `${artwork.title} — ${profile.name}`,
      description: artwork.description,
      type: "website",
      images: [{ url: artwork.coverImage, alt: artwork.alt, width: artwork.width, height: artwork.height }],
    },
  };
}

export default function ArtworkPage({ params }: ArtworkPageProps) {
  return (
    <div className="artwork-route">
      <Suspense fallback={<ArtworkLoading />}>
        <ResolvedArtworkPage params={params} />
      </Suspense>
    </div>
  );
}

async function ResolvedArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params;
  const [artworks, profile] = await Promise.all([getPublishedArtworks(), getPublicProfile()]);
  const index = artworks.findIndex((item) => item.slug === slug);

  if (index === -1) notFound();

  return (
    <ArtworkDetail
      artwork={artworks[index]}
      previous={artworks[(index - 1 + artworks.length) % artworks.length]}
      next={artworks[(index + 1) % artworks.length]}
      number={index + 1}
      profile={profile}
      total={artworks.length}
    />
  );
}
