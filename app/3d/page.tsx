import type { Metadata } from "next";
import { Suspense } from "react";
import ExploreRoute from "@/components/explore/ExploreRoute";

const description = "Step into woxiwaldie's floating gallery. Explore original pixel art, expressive characters, and painted stories in an interactive aqua world.";

export const metadata: Metadata = {
  title: "Explore in 3D — woxiwaldie",
  description,
  alternates: { canonical: "/3d" },
  openGraph: {
    title: "Explore in 3D — woxiwaldie · ARTVERSE",
    description,
    url: "/3d",
    type: "website",
    images: [{ url: "/3d/opengraph-image", width: 1200, height: 630, alt: "ARTVERSE: an aqua floating gallery of woxiwaldie's original art." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore in 3D — woxiwaldie · ARTVERSE",
    description,
    images: ["/3d/opengraph-image"],
  },
};

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="explorer-route-loading" role="status" aria-live="polite"><span aria-hidden="true">✦</span><p>ENTERING THE ARTVERSE…</p></div>}>
      <ExploreRoute />
    </Suspense>
  );
}
