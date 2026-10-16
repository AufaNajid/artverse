"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories } from "@/data/artworks";
import { cmsRequest, errorMessage, type CmsArtwork } from "./types";

export default function ArtworkList() {
  const params = useSearchParams();
  const [works, setWorks] = useState<CmsArtwork[]>([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(["draft", "published"].includes(params.get("status") || "") ? params.get("status")! : "all"); const [category, setCategory] = useState("all");
  const [busy, setBusy] = useState(false); const [deleting, setDeleting] = useState<CmsArtwork | null>(null); const [retry, setRetry] = useState(0); const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const abort = new AbortController(); cmsRequest<{ artworks: CmsArtwork[] }>("/api/artworks?scope=owner", { signal: abort.signal }).then(data => { setWorks(data.artworks.sort((a, b) => a.sortOrder - b.sortOrder)); setError(""); }).catch(cause => { if (!abort.signal.aborted) setError(errorMessage(cause)); }).finally(() => { if (!abort.signal.aborted) setLoading(false); }); return () => abort.abort(); }, [retry]);
  const filtered = useMemo(() => works.filter(work => (status === "all" || work.status === status) && (category === "all" || work.category === category) && `${work.title} ${work.description} ${work.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase().trim())), [works, status, category, search]);
  const isFiltered = status !== "all" || category !== "all" || Boolean(search.trim());
  async function move(id: string, direction: number) {
    const next = [...works]; const index = next.findIndex(work => work.id === id); const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]; setBusy(true); setError(""); setNotice("");
    try { await cmsRequest("/api/artworks/order", { method: "PATCH", body: JSON.stringify({ ids: next.map(work => work.id) }) }); setWorks(next.map((work, i) => ({ ...work, sortOrder: i }))); setNotice("Artwork order saved."); }
    catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting) return; setBusy(true); setError("");
    try { await cmsRequest(`/api/artworks/${deleting.id}`, { method: "DELETE" }); setWorks(works.filter(work => work.id !== deleting.id)); setNotice(`“${deleting.title}” deleted.`); dialog.current?.close(); setDeleting(null); }
    catch (cause) { setError(errorMessage(cause)); dialog.current?.close(); setDeleting(null); } finally { setBusy(false); }
  }
  return <><div className="cms-page-heading cms-heading-compact"><div><p className="cms-eyebrow">THE COLLECTION / 02</p><h1>Every little world.</h1><p>Your artworks, from the first idea to the final pixel.</p></div><Link href="/dashboard/artworks/new" className="cms-button">＋ Add artwork</Link></div>
    <div className="cms-toolbar"><label className="cms-search"><span className="cms-sr-only">Search artworks</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Find a title, tag, or idea…" value={search} onChange={e => setSearch(e.target.value)} /></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option></select></label><label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label></div>
    <div className="cms-list-summary"><span>{loading ? "Loading the collection…" : `${filtered.length} ${filtered.length === 1 ? "artwork" : "artworks"}`}</span><span>{isFiltered ? "Clear filters to rearrange your collection." : "Use the arrows to arrange your portfolio."}</span></div>
    {error && <div className="cms-message cms-error" role="alert">{error}<button className="cms-text-button" onClick={() => { setLoading(true); setRetry(retry + 1); }}>Reload artworks →</button></div>}{notice && <p className="cms-message cms-success" role="status">{notice}</p>}
    <section className="cms-panel cms-artwork-list" aria-label="Artworks" aria-busy={loading || busy}>
      {loading ? <div className="cms-loading" role="status"><i /> Gathering your artworks…</div> : filtered.length ? <><div className="cms-list-labels" aria-hidden="true"><span>ARTWORK</span><span>STATUS</span><span>ORDER</span><span>ACTIONS</span></div>{filtered.map(work => { const index = works.findIndex(item => item.id === work.id); return <article className="cms-artwork-row" key={work.id}><Link className="cms-list-work" href={`/dashboard/artworks/${work.id}/edit`}><div className="cms-list-thumb" style={{ background: work.color || "#d8f4f5" }}>{work.coverUrl ? <Image src={work.coverUrl} alt={work.alt || work.title} fill unoptimized sizes="72px" /> : <span aria-hidden="true">▧</span>}</div><div><h2>{work.title || "Untitled artwork"}</h2><p>{work.category}{work.featured && <span className="cms-featured">★ Featured</span>}</p></div></Link><span className={`cms-badge ${work.status}`}>{work.status}</span><div className="cms-order-buttons"><button disabled={busy || isFiltered || index === 0} onClick={() => move(work.id, -1)} aria-label={`Move ${work.title} up`}>↑</button><button disabled={busy || isFiltered || index === works.length - 1} onClick={() => move(work.id, 1)} aria-label={`Move ${work.title} down`}>↓</button></div><div className="cms-row-actions"><Link href={`/dashboard/artworks/${work.id}/edit`} className="cms-button cms-button-secondary cms-button-small">Edit ↗</Link><button className="cms-delete-button" disabled={busy} aria-label={`Delete ${work.title}`} onClick={() => { setDeleting(work); dialog.current?.showModal(); }}>Delete</button></div></article>; })}</> : <div className="cms-empty"><span aria-hidden="true">▧</span><h3>{works.length ? "No pixels found." : "Ready for your first piece?"}</h3><p>{works.length ? "Try another search or clear your filters to see everything." : "Give your artwork a title, add a cover, and make it part of your world."}</p>{works.length ? <button className="cms-button cms-button-secondary" onClick={() => { setSearch(""); setStatus("all"); setCategory("all"); }}>Clear filters</button> : <Link href="/dashboard/artworks/new" className="cms-button">＋ Add artwork</Link>}</div>}
    </section>
    <dialog className="cms-confirm" ref={dialog} aria-labelledby="delete-artwork-title" onCancel={event => { if (busy) event.preventDefault(); }} onClose={() => setDeleting(null)}><span className="cms-eyebrow">ONE LAST CHECK</span><h2 id="delete-artwork-title">Delete this artwork?</h2><p>“{deleting?.title}” will be removed from your studio, portfolio, and 3D gallery. This cannot be undone.</p><div className="cms-actions"><button className="cms-button cms-button-secondary" disabled={busy} onClick={() => dialog.current?.close()}>Keep artwork</button><button className="cms-button cms-button-danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete artwork"}</button></div></dialog>
  </>;
}

