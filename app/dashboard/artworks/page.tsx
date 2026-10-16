import { Suspense } from "react";
import ArtworkList from "@/components/dashboard/ArtworkList";
export default function ArtworksPage() { return <Suspense fallback={<div className="cms-loading">Loading your collection…</div>}><ArtworkList /></Suspense>; }
