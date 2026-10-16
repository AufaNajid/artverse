"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cmsRequest, errorMessage, type CmsArtwork } from "./types";

export default function Overview() {
  const [works, setWorks] = useState<CmsArtwork[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [retry, setRetry] = useState(0);
  const [cleaning, setCleaning] = useState(false); const [cleanupResult, setCleanupResult] = useState<{ completed: number; pending: number } | null>(null); const [cleanupError, setCleanupError] = useState("");
  useEffect(() => { const abort = new AbortController(); cmsRequest<{ artworks: CmsArtwork[] }>("/api/artworks?scope=owner", { signal: abort.signal }).then(data => { setWorks(data.artworks); setError(""); }).catch(cause => { if (!abort.signal.aborted) setError(errorMessage(cause)); }).finally(() => { if (!abort.signal.aborted) setLoading(false); }); return () => abort.abort(); }, [retry]);
  const published = works.filter(work => work.status === "published"); const drafts = works.filter(work => work.status === "draft");
  async function retryCleanup() {
    setCleaning(true); setCleanupResult(null); setCleanupError("");
    try { setCleanupResult(await cmsRequest<{ completed: number; pending: number }>("/api/storage/cleanup", { method: "POST" })); }
    catch (cause) { setCleanupError(errorMessage(cause)); } finally { setCleaning(false); }
  }
  return <><div className="cms-page-heading"><div><p className="cms-eyebrow">YOUR CREATIVE CORNER / 01</p><h1>A little room<br />for big ideas.</h1><p>Welcome back. Let’s put something good into the world.</p></div><span className="cms-heading-spark" aria-hidden="true">✳</span></div>
    {error && <div className="cms-message cms-error" role="alert"><p>{error}</p><button className="cms-text-button" onClick={() => { setLoading(true); setRetry(retry + 1); }}>Try again →</button></div>}
    <div className="cms-stats" aria-busy={loading}>{[{ label: "Artworks in your studio", value: works.length, className: "cms-stat-blue" }, { label: "Out in the world", value: published.length, className: "cms-stat-mint" }, { label: "Ideas in progress", value: drafts.length, className: "cms-stat-pink" }].map(stat => <Link href={stat.label === "Ideas in progress" ? "/dashboard/artworks?status=draft" : stat.label === "Out in the world" ? "/dashboard/artworks?status=published" : "/dashboard/artworks"} className={`cms-stat ${stat.className}`} key={stat.label}><span>{stat.label}</span><strong>{loading ? "—" : String(stat.value).padStart(2, "0")}</strong><i aria-hidden="true">↗</i></Link>)}</div>
    <section className="cms-panel"><div className="cms-panel-heading"><div><p className="cms-eyebrow">THE COLLECTION</p><h2>From your studio</h2></div><Link href="/dashboard/artworks" className="cms-text-button">Manage artworks ↗</Link></div>
      {loading ? <div className="cms-loading" role="status"><i /> Gathering your artworks…</div> : works.length ? <div className="cms-recent-grid">{works.slice(0, 4).map(work => <Link href={`/dashboard/artworks/${work.id}/edit`} className="cms-recent-work" key={work.id}><div className="cms-recent-image" style={{ background: work.color || "#d8f4f5" }}>{work.coverUrl ? <Image src={work.coverUrl} alt={work.alt || work.title} fill unoptimized sizes="260px" /> : <span aria-hidden="true">＋</span>}<span className={`cms-badge ${work.status}`}>{work.status}</span></div><h3>{work.title || "Untitled artwork"}</h3><p>{work.category}<span>↗</span></p></Link>)}</div> : <div className="cms-empty"><span aria-hidden="true">▧</span><h3>Your collection starts here.</h3><p>Add your first artwork as a draft. Publish it whenever it feels ready.</p><Link href="/dashboard/artworks/new" className="cms-button">＋ Add your first artwork</Link></div>}
    </section><div className="cms-note-strip"><span aria-hidden="true">✦</span><p><strong>A small reminder.</strong> Drafts stay private. Published pieces appear in your portfolio and 3D gallery.</p><Link href="/" target="_blank" rel="noopener noreferrer">Visit your world ↗</Link></div>
    <section className="cms-maintenance" aria-labelledby="cms-maintenance-title"><div><p className="cms-eyebrow">STUDIO MAINTENANCE</p><h2 id="cms-maintenance-title">A little housekeeping.</h2><p>Retry queued image removals after a storage connection issue, and clear expired unused uploads.</p></div><button className="cms-button cms-button-secondary cms-button-small" disabled={cleaning} onClick={() => void retryCleanup()}>{cleaning ? "Retrying cleanup…" : "Retry image cleanup"}</button>{cleanupResult && <p className={`cms-message ${cleanupResult.pending ? "" : "cms-success"}`} role="status">{cleanupResult.completed} {cleanupResult.completed === 1 ? "removal" : "removals"} completed. {cleanupResult.pending ? `${cleanupResult.pending} still pending. Check your storage connection, then retry.` : "No queued removals remain."}</p>}{cleanupError && <p className="cms-message cms-error" role="alert">{cleanupError}</p>}</section>
  </>;
}

