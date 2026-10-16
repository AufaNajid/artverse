import { Suspense } from "react";
import ArtworkEditor from "@/components/dashboard/ArtworkEditor";
async function ResolvedEditor({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ArtworkEditor artworkId={id} />; }
export default function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) { return <Suspense fallback={<div className="cms-loading">Opening your artwork…</div>}><ResolvedEditor params={params} /></Suspense>; }
