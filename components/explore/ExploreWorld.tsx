"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { Artwork } from "@/data/artworks";
import Icon from "@/components/Icons";
import "./explore.css";

const ExhibitionScene = dynamic(() => import("@/components/three/ExhibitionScene"), { ssr: false });

type ExploreWorldProps = {
  artworks: Artwork[];
  initialSlug?: string | null;
  fullScreen?: boolean;
  routeMode?: boolean;
  motionEnabled?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onClose?: () => void;
  onBrowseGallery?: () => void;
};

export default function ExploreWorld({
  artworks,
  initialSlug = null,
  fullScreen = false,
  routeMode = false,
  motionEnabled = true,
  soundEnabled = false,
  onToggleSound,
  onClose,
  onBrowseGallery,
}: ExploreWorldProps) {
  const validSlug = useCallback((slug: string | null | undefined) => artworks.some((art) => art.slug === slug) ? slug! : null, [artworks]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => validSlug(initialSlug));
  const [paused, setPaused] = useState(!motionEnabled);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [resetKey, setResetKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDialogElement>(null);
  const previewTitleId = useId();
  const selected = artworks.find((art) => art.slug === selectedSlug);
  const selectedIndex = artworks.findIndex((art) => art.slug === selectedSlug);
  const animationPaused = paused || reducedMotion;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    const frame = requestAnimationFrame(update);
    media.addEventListener("change", update);
    return () => { cancelAnimationFrame(frame); media.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSelectedSlug(validSlug(initialSlug)));
    return () => cancelAnimationFrame(frame);
  }, [initialSlug, validSlug]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPaused(!motionEnabled));
    return () => cancelAnimationFrame(frame);
  }, [motionEnabled]);

  const syncUrl = useCallback((slug: string | null) => {
    if (!routeMode) return;
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("karya", slug);
    else url.searchParams.delete("karya");
    window.history.replaceState(window.history.state, "", url);
  }, [routeMode]);

  const select = useCallback((slug: string) => {
    const next = validSlug(slug);
    setSelectedSlug(next);
    setShareStatus("");
    syncUrl(next);
  }, [syncUrl, validSlug]);

  const clearFocus = useCallback(() => {
    if (rootRef.current?.querySelector(".explorer-info")?.contains(document.activeElement)) stageRef.current?.focus({ preventScroll: true });
    setSelectedSlug(null);
    setShareStatus("");
    syncUrl(null);
  }, [syncUrl]);

  const step = useCallback((direction: number) => {
    if (!artworks.length) return;
    const start = selectedIndex < 0 ? (direction > 0 ? -1 : 0) : selectedIndex;
    select(artworks[(start + direction + artworks.length) % artworks.length].slug);
  }, [artworks, select, selectedIndex]);

  const closePreview = useCallback(() => {
    previewRef.current?.close();
    setPreviewOpen(false);
    setZoomed(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || (!fullScreen && !rootRef.current?.contains(document.activeElement))) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (previewOpen) closePreview();
        else if (selectedSlug) clearFocus();
        else onClose?.();
        return;
      }
      const target = event.target as HTMLElement;
      if (previewOpen || target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        step(event.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearFocus, closePreview, fullScreen, onClose, previewOpen, selectedSlug, step]);

  const onReady = useCallback(() => setStatus("ready"), []);
  const onUnavailable = useCallback(() => setStatus("fallback"), []);

  function reset() {
    clearFocus();
    setResetKey((key) => key + 1);
  }

  function openPreview() {
    if (!selected) return;
    setPreviewOpen(true);
    previewRef.current?.showModal();
  }

  async function copyLink() {
    if (!selected) return;
    const link = new URL(`/3d?karya=${encodeURIComponent(selected.slug)}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(link);
      setShareStatus("Link copied. Share this little world.");
    } catch { setShareStatus(`Copy this link: ${link}`); }
  }

  const className = ["explorer", fullScreen ? "explorer-fullscreen" : "explorer-embedded", selected ? "is-focused" : "", status === "fallback" ? "is-fallback" : ""].join(" ");

  return <div ref={rootRef} className={className} role="region" aria-label="ARTVERSE interactive exhibition">
    <span className="explorer-announcement" role="status" aria-live="polite" aria-atomic="true">{selected ? `${selected.title}. ${selected.category}. ${selected.description}` : "World overview. Choose any artwork to explore."}</span>
    <div ref={stageRef} className="explorer-stage" tabIndex={0} aria-label="3D gallery. Drag to orbit, scroll or pinch to zoom. Use arrow keys to select artwork." onPointerDown={(event) => event.currentTarget.focus({ preventScroll: true })}>
      {status !== "fallback" && <ExhibitionScene artworks={artworks} selectedSlug={selectedSlug} paused={animationPaused} reducedMotion={reducedMotion} resetKey={resetKey} onSelectArtwork={select} onClearFocus={clearFocus} onReady={onReady} onUnavailable={onUnavailable} />}
      {status === "fallback" && <div className="explorer-fallback">
        <div className="explorer-fallback-intro"><span className="explorer-label">A DIFFERENT WAY TO EXPLORE</span><h2>The art is still here.</h2><p>Your device is showing the gallery in 2D. Pick a piece to take a closer look.</p></div>
        <div className="explorer-fallback-grid">{artworks.map((art) => <button key={art.slug} className={selectedSlug === art.slug ? "is-selected" : ""} onClick={() => select(art.slug)}><span style={{ backgroundColor: art.color }}><Image src={art.frameImage} alt={art.alt} fill sizes="(max-width:600px) 45vw, 260px" unoptimized style={{ imageRendering: art.category === "Pixel art" ? "pixelated" : "auto" }} /></span><strong>{art.title}</strong><small>{art.category}</small></button>)}</div>
      </div>}
      {status === "loading" && <div className="explorer-loading" role="status"><div className="explorer-loader-pixels" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 70}ms` }} />)}</div><span className="explorer-label">BUILDING A LITTLE WORLD</span><p>Unpacking pixels & possibilities…</p><div className="explorer-loading-track" aria-hidden="true"><span /></div></div>}
    </div>

    <header className="explorer-header">
      <div className="explorer-wordmark"><Icon name="cube" width="26" height="26" /><span>ARTVERSE</span><small>/ 3D</small></div>
      <div className="explorer-header-actions"><span className="explorer-world-tag"><i />WORLD 01 / PIXEL DAYDREAM</span>{onToggleSound && <button className="explorer-icon" onClick={onToggleSound} aria-label={soundEnabled ? "Mute sound" : "Enable sound"} aria-pressed={soundEnabled}><Icon name={soundEnabled ? "volume" : "mute"} width="17" height="17" /></button>}{onClose ? <button autoFocus={fullScreen && !routeMode} className="explorer-icon explorer-close" onClick={onClose} aria-label={routeMode ? "Return to portfolio" : "Close 3D world"}><Icon name="close" /></button> : <Link href={selected ? `/3d?karya=${encodeURIComponent(selected.slug)}` : "/3d"} className="explorer-icon" aria-label="Open exhibition fullscreen"><Icon name="diagonal" width="17" height="17" /></Link>}</div>
    </header>

    {selected && <aside className="explorer-info" aria-label="Selected artwork">
      <div className="explorer-info-kicker"><span>{String(selectedIndex + 1).padStart(2, "0")} / {String(artworks.length).padStart(2, "0")}</span><span>{selected.category}</span><button onClick={clearFocus} aria-label="Return to world overview"><Icon name="close" width="15" height="15" /></button></div>
      <h2>{selected.title}</h2><p className="explorer-description">{selected.description}</p>
      <div className="explorer-info-tags">{selected.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <button className="explorer-primary explorer-preview-button" onClick={openPreview}>View full artwork <Icon name="diagonal" width="15" height="15" /></button>
      <div className="explorer-info-links"><Link href={`/artwork/${selected.slug}`} onClick={fullScreen && !routeMode ? onClose : undefined}>Discover the story <Icon name="arrow" width="14" height="14" /></Link><button onClick={copyLink} aria-label={`Copy link to ${selected.title}`}><Icon name="copy" width="14" height="14" /> Share</button></div>
      <span className="explorer-share-status" role="status">{shareStatus}</span>
      <span className="explorer-escape-hint">ESC TO STEP BACK INTO THE WORLD</span>
    </aside>}

    <div className="explorer-artwork-rail" aria-label="Choose artwork">{artworks.map((art, i) => <button key={art.slug} onClick={() => select(art.slug)} aria-label={`Focus ${art.title}`} aria-pressed={art.slug === selectedSlug} title={art.title}><span className="explorer-rail-number">{String(i + 1).padStart(2, "0")}</span><span className="explorer-rail-image" style={{ backgroundColor: art.color }}><Image src={art.frameImage} alt="" fill sizes="48px" unoptimized /></span><span className="explorer-rail-title">{art.title}</span></button>)}</div>

    <footer className="explorer-footer">
      <div className="explorer-footer-left"><span className="explorer-label explorer-control-hint">DRAG TO ORBIT · SCROLL / PINCH TO ZOOM · CLICK TO FOCUS</span>{onBrowseGallery ? <button onClick={onBrowseGallery} className="explorer-back-link"><Icon name="grid" width="13" height="13" /> Browse the regular gallery <Icon name="arrow" width="13" height="13" /></button> : <Link href="/#work" className="explorer-back-link"><Icon name="grid" width="13" height="13" /> Browse the regular gallery <Icon name="arrow" width="13" height="13" /></Link>}</div>
      <div className="explorer-controls" aria-label="Exhibition controls"><button className="explorer-icon" onClick={() => step(-1)} aria-label="Previous artwork" title="Previous artwork (←)"><Icon name="arrow" width="16" height="16" style={{ transform: "rotate(180deg)" }} /></button><button className="explorer-primary" onClick={() => step(1)} aria-label="Next artwork">NEXT <Icon name="arrow" width="15" height="15" /></button><button className="explorer-control" onClick={() => setPaused(!paused)} disabled={reducedMotion} aria-pressed={animationPaused} aria-label={reducedMotion ? "Animations reduced by your system preference" : paused ? "Play world animation" : "Pause world animation"}>{reducedMotion ? "STILL" : paused ? "PLAY" : "PAUSE"}<Icon name={animationPaused ? "play" : "pause"} width="13" height="13" /></button><button className="explorer-control" onClick={reset} aria-label="Reset world view" title="Return to the beginning">RESET <span aria-hidden="true">↺</span></button></div>
    </footer>

    <dialog ref={previewRef} className="explorer-preview" aria-labelledby={previewTitleId} onCancel={(event) => { event.preventDefault(); closePreview(); }} onClose={() => { setPreviewOpen(false); setZoomed(false); }}>
      <div className="explorer-preview-toolbar"><div><span className="explorer-label">EVERY DETAIL COUNTS</span><h2 id={previewTitleId}>{selected?.title}</h2></div><div><button onClick={() => setZoomed(!zoomed)} aria-pressed={zoomed}>{zoomed ? "− Fit to screen" : "+ Zoom in"}</button><button autoFocus onClick={closePreview} aria-label="Close full artwork">Close <Icon name="close" width="17" height="17" /></button></div></div>
      <div className="explorer-preview-scroll">{selected && <div className={`explorer-preview-image ${zoomed ? "is-zoomed" : ""}`}><Image src={selected.coverImage} alt={selected.alt} fill sizes={zoomed ? "180vw" : "100vw"} unoptimized style={{ imageRendering: selected.category === "Pixel art" ? "pixelated" : "auto" }} /></div>}</div>
    </dialog>
  </div>;
}
