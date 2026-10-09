import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { artworks } from "@/data/artworks";
import ArtworkDetail from "./ArtworkDetail";
import ArtworkLoading from "./ArtworkLoading";
import "../artwork.css";

type ArtworkPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return artworks.map((artwork) => ({ slug: artwork.slug }));
}

export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artwork = artworks.find((item) => item.slug === slug);

  if (!artwork) {
    return { title: "Artwork not found" };
  }

  return {
    title: `${artwork.title} — woxiwaldie`,
    description: artwork.description,
    openGraph: {
      title: `${artwork.title} — woxiwaldie`,
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
  const index = artworks.findIndex((item) => item.slug === slug);

  if (index === -1) notFound();

  return (
    <ArtworkDetail
      artwork={artworks[index]}
      previous={artworks[(index - 1 + artworks.length) % artworks.length]}
      next={artworks[(index + 1) % artworks.length]}
      number={index + 1}
    />
  );
}
