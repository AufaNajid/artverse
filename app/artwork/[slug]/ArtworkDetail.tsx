"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Artwork } from "@/data/artworks";

type ArtworkDetailProps = {
  artwork: Artwork;
  previous: Artwork;
  next: Artwork;
  number: number;
};

function Arrow({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" style={direction === "left" ? { transform: "rotate(180deg)" } : undefined}>
      <path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M11 2h6v7h2v2h7v6h-7v2h-2v7h-6v-7H9v-2H2v-6h7V9h2Z" fill="currentColor" />
    </svg>
  );
}

export default function ArtworkDetail({ artwork, previous, next, number }: ArtworkDetailProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalOverflow; };
  }, [isOpen]);

  function openArtwork() {
    dialogRef.current?.showModal();
    setIsOpen(true);
  }

  function closeArtwork() {
    dialogRef.current?.close();
  }

  return (
    <div className="artwork-detail">
      <header className="artwork-header">
        <Link href="/" className="artwork-wordmark" aria-label="ARTVERSE home"><Sparkle />ARTVERSE</Link>
        <Link href="/#work" className="artwork-back"><Arrow direction="left" />Back to the good stuff</Link>
      </header>

      <main className="artwork-main">
        <section className="artwork-intro" aria-labelledby="artwork-title">
          <div className="artwork-kicker"><span>{String(number).padStart(2, "0")} / SELECTED WORK</span><span>{artwork.category}{artwork.year ? ` · ${artwork.year}` : ""}</span></div>
          <h1 id="artwork-title">{artwork.title}<span className="artwork-title-dot">.</span></h1>
          <div className="artwork-intro-bottom"><p>{artwork.description}</p><div className="artwork-intro-note"><Sparkle /><span>Every pixel<br />has personality.</span></div></div>
        </section>

        <figure className="artwork-feature">
          <button type="button" onClick={openArtwork} className="artwork-image-button" aria-label={`View ${artwork.title} fullscreen`} title={`Open ${artwork.title} in full screen`} style={{ backgroundColor: artwork.color, aspectRatio: `${artwork.width} / ${artwork.height}`, maxWidth: artwork.width / artwork.height < 1.2 ? 900 : undefined }}>
            <Image src={artwork.coverImage} alt={artwork.alt} fill preload sizes="(max-width: 740px) 94vw, (max-width: 1440px) 90vw, 1320px" unoptimized={artwork.category === "Pixel art"} className={`artwork-feature-image${artwork.category === "Pixel art" ? " artwork-pixels" : ""}`} />
            <span className="artwork-expand"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>Take a closer look</span>
          </button>
          <figcaption><span>{artwork.title} · Original artwork by woxiwaldie</span><span>Every detail counts ↗</span></figcaption>
        </figure>

        <section className="artwork-story" aria-label="About this artwork">
          <aside className="artwork-facts">
            <div><h2>The details</h2><dl><dt>Artist</dt><dd>woxiwaldie</dd><dt>Discipline</dt><dd>{artwork.category}</dd>{artwork.year ? <><dt>Year</dt><dd>{artwork.year}</dd></> : null}<dt>Medium</dt><dd>{artwork.tools.join(" · ")}</dd><dt>Original size</dt><dd>{artwork.width} × {artwork.height} px</dd></dl></div>
            <div className="artwork-tag-list">{artwork.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </aside>
          <div className="artwork-story-copy">
            <div><span className="artwork-small-label">01 — THE PIECE</span><h2>Look a little<br />closer.</h2><p>{artwork.brief}</p></div>
            <div><span className="artwork-small-label">02 — COLOR &amp; CHARACTER</span><h2>It&apos;s all in the details.</h2><p>{artwork.approach}</p></div>
          </div>
        </section>

        <nav className="artwork-pagination" aria-label="Explore more artwork">
          <Link href={`/artwork/${previous.slug}`} className="artwork-project-link artwork-previous"><span><Arrow direction="left" />Previous artwork</span><h2>{previous.title}</h2></Link>
          <Link href={`/artwork/${next.slug}`} className="artwork-project-link artwork-next"><span>Next artwork<Arrow /></span><h2>{next.title}</h2></Link>
        </nav>
      </main>

      <footer className="artwork-footer"><Link href="/" className="artwork-wordmark"><Sparkle />ARTVERSE</Link><p>A universe by woxiwaldie. © 2026</p><Link href="/#work">Explore all work <span aria-hidden="true">↗</span></Link></footer>

      <dialog ref={dialogRef} className="artwork-lightbox" aria-labelledby="artwork-dialog-title" onClose={() => { setIsOpen(false); setZoomed(false); }} onClick={(event) => { if (event.target === event.currentTarget) closeArtwork(); }}>
        <div className="artwork-lightbox-toolbar"><div><h2 id="artwork-dialog-title">{artwork.title}</h2><p>{zoomed ? "Scroll to explore the details" : "Escape to return to the artwork"}</p></div><div className="artwork-lightbox-actions"><button type="button" onClick={() => setZoomed(!zoomed)} aria-pressed={zoomed} title={zoomed ? "Fit artwork to screen" : "Zoom in on artwork"}>{zoomed ? "− Fit to screen" : "+ Zoom in"}</button><button type="button" onClick={closeArtwork} aria-label="Close artwork viewer" title="Close artwork viewer (Escape)" autoFocus>Close <span aria-hidden="true">×</span></button></div></div>
        <div className="artwork-lightbox-scroll"><div className={`artwork-lightbox-image${zoomed ? " artwork-lightbox-zoomed" : ""}`}><Image src={artwork.coverImage} alt={artwork.alt} fill unoptimized className={artwork.category === "Pixel art" ? "artwork-pixels" : undefined} sizes={zoomed ? "(max-width: 740px) 220vw, 150vw" : "100vw"} /></div></div>
      </dialog>
    </div>
  );
}

